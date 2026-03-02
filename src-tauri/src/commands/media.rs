use crate::db::AppDb;
use std::fs;
use std::path::PathBuf;
use tauri::{Manager, State};
use uuid::Uuid;

#[tauri::command]
pub fn save_box_art(
    app: tauri::AppHandle,
    db: State<'_, AppDb>,
    kit_id: String,
    source_path: String,
) -> Result<String, String> {
    let app_data = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;
    let stash_dir = AppDb::stash_dir(&app_data);

    let source = PathBuf::from(&source_path);
    let ext = source
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("jpg");

    let filename = format!("{}_{}.{}", kit_id, Uuid::new_v4(), ext);
    let dest = stash_dir.join(&filename);

    fs::copy(&source, &dest).map_err(|e| format!("Failed to copy image: {e}"))?;

    let dest_str = dest.to_string_lossy().to_string();

    // Update kit record
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE kits SET box_art_path = ?1 WHERE id = ?2",
        rusqlite::params![dest_str, kit_id],
    )
    .map_err(|e| e.to_string())?;

    Ok(dest_str)
}

#[tauri::command]
pub fn save_accessory_image(
    app: tauri::AppHandle,
    db: State<'_, AppDb>,
    accessory_id: String,
    source_path: String,
) -> Result<String, String> {
    let app_data = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;
    let stash_dir = AppDb::stash_dir(&app_data);

    let source = PathBuf::from(&source_path);
    let ext = source
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("jpg");

    let filename = format!("acc_{}_{}.{}", accessory_id, Uuid::new_v4(), ext);
    let dest = stash_dir.join(&filename);

    fs::copy(&source, &dest).map_err(|e| format!("Failed to copy image: {e}"))?;

    let dest_str = dest.to_string_lossy().to_string();

    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE accessories SET image_path = ?1 WHERE id = ?2",
        rusqlite::params![dest_str, accessory_id],
    )
    .map_err(|e| e.to_string())?;

    Ok(dest_str)
}
