use crate::db::AppDb;
use crate::models::ProgressPhoto;
use crate::services::file_stash;
use tauri::{Manager, State};

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
    let dest_str = file_stash::save_to_stash(&app_data, &source_path, "prog", &step_id)?;

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
        None,
        None,
    );

    Ok(photo)
}
