use crate::db::AppDb;
use crate::models::{BackupDiff, StorageStats};
use std::fs;
use std::io;
use std::path::Path;
use tauri::{AppHandle, Manager, State};

const PHOTO_COUNT_SQL: &str = "SELECT (SELECT COUNT(*) FROM progress_photos) + (SELECT COUNT(*) FROM milestone_photos) + (SELECT COUNT(*) FROM gallery_photos)";

#[tauri::command]
pub fn get_setting(db: State<'_, AppDb>, key: String) -> Result<String, String> {
    let conn = db.conn()?;
    crate::db::queries::settings::get(&conn, &key)
}

#[tauri::command]
pub fn set_setting(db: State<'_, AppDb>, key: String, value: String) -> Result<(), String> {
    let conn = db.conn()?;
    crate::db::queries::settings::set(&conn, &key, &value)
}

#[tauri::command]
pub fn get_all_settings(db: State<'_, AppDb>) -> Result<Vec<(String, String)>, String> {
    let conn = db.conn()?;
    crate::db::queries::settings::get_all(&conn)
}

#[tauri::command]
pub fn get_storage_stats(app: AppHandle) -> Result<StorageStats, String> {
    let app_data = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let base = app_data.join("model-builder");
    let db_path = base.join("db.sqlite");
    let stash_path = base.join("stash");

    let db_size_bytes = fs::metadata(&db_path)
        .map(|m| m.len())
        .unwrap_or(0);

    let stash_size_bytes = dir_size(&stash_path);

    let db = app.state::<AppDb>();
    let conn = db.conn()?;
    let photo_count: u64 = conn
        .query_row(PHOTO_COUNT_SQL, [], |row| row.get(0))
        .map_err(|e| e.to_string())?;

    Ok(StorageStats {
        db_size_bytes,
        stash_size_bytes,
        photo_count,
    })
}

fn dir_size(dir: &Path) -> u64 {
    let mut total: u64 = 0;
    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                total += dir_size(&path);
            } else if let Ok(meta) = fs::metadata(&path) {
                total += meta.len();
            }
        }
    }
    total
}

fn collect_files(dir: &Path) -> Vec<std::path::PathBuf> {
    let mut files = Vec::new();
    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                files.extend(collect_files(&path));
            } else {
                files.push(path);
            }
        }
    }
    files
}

#[tauri::command]
pub fn export_backup(app: AppHandle, dest_path: String) -> Result<(), String> {
    let app_data = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let base = app_data.join("model-builder");
    let db_path = base.join("db.sqlite");
    let stash_path = base.join("stash");

    // Checkpoint WAL before backup
    let db = app.state::<AppDb>();
    let conn = db.conn()?;
    conn.execute_batch("PRAGMA wal_checkpoint(TRUNCATE)")
        .map_err(|e| e.to_string())?;
    drop(conn);

    let file = fs::File::create(&dest_path).map_err(|e| e.to_string())?;
    let mut zip = zip::ZipWriter::new(file);
    let options = zip::write::SimpleFileOptions::default()
        .compression_method(zip::CompressionMethod::Deflated);

    // Add db.sqlite (stream from disk)
    if let Ok(mut src) = fs::File::open(&db_path) {
        zip.start_file("db.sqlite", options).map_err(|e| e.to_string())?;
        io::copy(&mut src, &mut zip).map_err(|e| e.to_string())?;
    }

    // Add stash files (stream each from disk)
    for file_path in collect_files(&stash_path) {
        let relative = file_path
            .strip_prefix(&base)
            .map_err(|e| e.to_string())?;
        let name = relative.to_string_lossy().to_string();
        zip.start_file(&name, options).map_err(|e| e.to_string())?;
        let mut src = fs::File::open(&file_path).map_err(|e| e.to_string())?;
        io::copy(&mut src, &mut zip).map_err(|e| e.to_string())?;
    }

    zip.finish().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn preview_backup(source_path: String) -> Result<BackupDiff, String> {
    let file = fs::File::open(&source_path).map_err(|e| e.to_string())?;
    let mut archive = zip::ZipArchive::new(file).map_err(|e| e.to_string())?;

    // Find and extract db.sqlite to a temp location
    let temp_dir = std::env::temp_dir().join(format!("mba_preview_{}", uuid::Uuid::new_v4()));
    fs::create_dir_all(&temp_dir).map_err(|e| e.to_string())?;
    let temp_db = temp_dir.join("db.sqlite");

    match archive.by_name("db.sqlite") {
        Ok(mut entry) => {
            let mut out = fs::File::create(&temp_db).map_err(|e| e.to_string())?;
            io::copy(&mut entry, &mut out).map_err(|e| e.to_string())?;
        }
        Err(_) => {
            let _ = fs::remove_dir_all(&temp_dir);
            return Err("Invalid backup: no db.sqlite found".to_string());
        }
    }

    let conn = rusqlite::Connection::open_with_flags(
        &temp_db,
        rusqlite::OpenFlags::SQLITE_OPEN_READ_ONLY,
    )
    .map_err(|e| e.to_string())?;

    let projects: u64 = conn
        .query_row("SELECT COUNT(*) FROM projects", [], |row| row.get(0))
        .unwrap_or(0);
    let kits: u64 = conn
        .query_row("SELECT COUNT(*) FROM kits", [], |row| row.get(0))
        .unwrap_or(0);
    let paints: u64 = conn
        .query_row("SELECT COUNT(*) FROM paints", [], |row| row.get(0))
        .unwrap_or(0);
    let accessories: u64 = conn
        .query_row("SELECT COUNT(*) FROM accessories", [], |row| row.get(0))
        .unwrap_or(0);
    let photos: u64 = conn
        .query_row(PHOTO_COUNT_SQL, [], |row| row.get(0))
        .unwrap_or(0);

    drop(conn);
    let _ = fs::remove_dir_all(&temp_dir);

    Ok(BackupDiff {
        projects,
        kits,
        paints,
        accessories,
        photos,
    })
}

#[tauri::command]
pub fn apply_backup(app: AppHandle, source_path: String) -> Result<(), String> {
    let app_data = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let base = app_data.join("model-builder");

    let file = fs::File::open(&source_path).map_err(|e| e.to_string())?;
    let mut archive = zip::ZipArchive::new(file).map_err(|e| e.to_string())?;

    for i in 0..archive.len() {
        let mut entry = archive.by_index(i).map_err(|e| e.to_string())?;
        let name = entry.name().to_string();

        if name.ends_with('/') {
            // Directory entry
            let dir_path = base.join(&name);
            fs::create_dir_all(&dir_path).map_err(|e| e.to_string())?;
            continue;
        }

        let out_path = base.join(&name);
        if let Some(parent) = out_path.parent() {
            fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }

        let mut out = fs::File::create(&out_path).map_err(|e| e.to_string())?;
        io::copy(&mut entry, &mut out).map_err(|e| e.to_string())?;
    }

    app.restart();

    #[allow(unreachable_code)]
    Ok(())
}
