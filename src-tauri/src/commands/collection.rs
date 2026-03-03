use crate::db::AppDb;
use crate::models::{CreateKitInput, Kit, KitFile, UpdateKitInput};
use std::fs;
use std::path::PathBuf;
use tauri::{Manager, State};
use uuid::Uuid;

#[tauri::command]
pub fn list_kits(db: State<'_, AppDb>) -> Result<Vec<Kit>, String> {
    let conn = db.conn()?;
    crate::db::queries::kits::list_all(&conn)
}

#[tauri::command]
pub fn create_kit(db: State<'_, AppDb>, input: CreateKitInput) -> Result<Kit, String> {
    let conn = db.conn()?;
    crate::db::queries::kits::insert(&conn, input)
}

#[tauri::command]
pub fn update_kit(db: State<'_, AppDb>, input: UpdateKitInput) -> Result<Kit, String> {
    let conn = db.conn()?;
    crate::db::queries::kits::update(&conn, input)
}

#[tauri::command]
pub fn delete_kit(db: State<'_, AppDb>, id: String) -> Result<(), String> {
    let conn = db.conn()?;
    crate::db::queries::kits::delete(&conn, &id)
}

// ── Kit Files ────────────────────────────────────────────────────────────────

#[tauri::command]
pub fn list_kit_files(db: State<'_, AppDb>, kit_id: String) -> Result<Vec<KitFile>, String> {
    let conn = db.conn()?;
    crate::db::queries::kit_files::list_by_kit(&conn, &kit_id)
}

#[tauri::command]
pub fn attach_kit_file(
    app: tauri::AppHandle,
    db: State<'_, AppDb>,
    kit_id: String,
    source_path: String,
    label: Option<String>,
) -> Result<KitFile, String> {
    let app_data = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let stash_dir = AppDb::stash_dir(&app_data);

    let source = PathBuf::from(&source_path);
    let ext = source
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("bin")
        .to_lowercase();

    let file_type = match ext.as_str() {
        "pdf" => "pdf",
        _ => "image",
    };

    let filename = format!("{}_{}.{}", kit_id, Uuid::new_v4(), ext);
    let dest = stash_dir.join(&filename);

    fs::copy(&source, &dest).map_err(|e| format!("Failed to copy file: {e}"))?;

    let dest_str = dest.to_string_lossy().to_string();
    let conn = db.conn()?;
    crate::db::queries::kit_files::insert(&conn, &kit_id, &dest_str, file_type, label.as_deref())
}

#[tauri::command]
pub fn delete_kit_file(db: State<'_, AppDb>, file_id: String) -> Result<(), String> {
    let conn = db.conn()?;
    crate::db::queries::kit_files::delete(&conn, &file_id)
}
