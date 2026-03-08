use crate::db::AppDb;
use crate::models::MilestonePhoto;
use crate::services::file_stash;
use tauri::{Manager, State};

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
    let dest_str = file_stash::save_to_stash(&app_data, &source_path, "mile", &track_id)?;

    let conn = db.conn()?;
    crate::db::queries::milestone_photos::insert(&conn, &track_id, &dest_str)
}
