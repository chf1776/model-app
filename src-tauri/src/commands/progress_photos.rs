use crate::db::AppDb;
use crate::models::ProgressPhoto;
use std::fs;
use std::path::PathBuf;
use tauri::{Manager, State};
use uuid::Uuid;

#[tauri::command]
pub fn list_project_progress_photos(
    db: State<'_, AppDb>,
    project_id: String,
) -> Result<Vec<ProgressPhoto>, String> {
    let conn = db.conn()?;
    crate::db::queries::progress_photos::list_by_project(&conn, &project_id)
}

#[tauri::command]
pub fn list_progress_photos(
    db: State<'_, AppDb>,
    step_id: String,
) -> Result<Vec<ProgressPhoto>, String> {
    let conn = db.conn()?;
    crate::db::queries::progress_photos::list_for_step(&conn, &step_id)
}

#[tauri::command]
pub fn add_progress_photo(
    app: tauri::AppHandle,
    db: State<'_, AppDb>,
    step_id: String,
    source_path: String,
) -> Result<ProgressPhoto, String> {
    let app_data = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let stash_dir = AppDb::stash_dir(&app_data);

    let source = PathBuf::from(&source_path);
    let ext = source
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("jpg");

    let filename = format!("prog_{}_{}.{}", step_id, Uuid::new_v4(), ext);
    let dest = stash_dir.join(&filename);

    fs::copy(&source, &dest).map_err(|e| format!("Failed to copy image: {e}"))?;

    let dest_str = dest.to_string_lossy().to_string();

    let conn = db.conn()?;
    let photo = crate::db::queries::progress_photos::insert(&conn, &step_id, &dest_str)?;

    // Also insert a build_log_entry for the photo
    let step = crate::db::queries::steps::get_by_id(&conn, &step_id)?;
    let track = crate::db::queries::tracks::get_by_id(&conn, &step.track_id)?;
    let _ = crate::db::queries::build_log_entries::insert(
        &conn,
        &track.project_id,
        "photo",
        None,
        Some(&step_id),
        Some(&step.track_id),
        None,
        false,
        None,
    );

    Ok(photo)
}
