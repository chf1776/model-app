use crate::db::AppDb;
use crate::models::MilestonePhoto;
use std::fs;
use std::path::PathBuf;
use tauri::{Manager, State};
use uuid::Uuid;

#[tauri::command]
pub fn list_project_milestone_photos(
    db: State<'_, AppDb>,
    project_id: String,
) -> Result<Vec<MilestonePhoto>, String> {
    let conn = db.conn()?;
    crate::db::queries::milestone_photos::list_by_project(&conn, &project_id)
}

#[tauri::command]
pub fn add_milestone_photo(
    app: tauri::AppHandle,
    db: State<'_, AppDb>,
    track_id: String,
    source_path: String,
) -> Result<MilestonePhoto, String> {
    let app_data = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let stash_dir = AppDb::stash_dir(&app_data);

    let source = PathBuf::from(&source_path);
    let ext = source
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("jpg");

    let filename = format!("mile_{}_{}.{}", track_id, Uuid::new_v4(), ext);
    let dest = stash_dir.join(&filename);

    fs::copy(&source, &dest).map_err(|e| format!("Failed to copy image: {e}"))?;

    let dest_str = dest.to_string_lossy().to_string();

    let conn = db.conn()?;
    crate::db::queries::milestone_photos::insert(&conn, &track_id, &dest_str)
}
