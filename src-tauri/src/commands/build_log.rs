use crate::db::AppDb;
use crate::models::{BuildLogEntry, CreateBuildLogEntryInput};
use crate::services::file_stash;
use tauri::{Manager, State};

#[tauri::command]
pub fn list_build_log_entries(
    db: State<'_, AppDb>,
    project_id: String,
) -> Result<Vec<BuildLogEntry>, String> {
    let conn = db.conn()?;
    crate::db::queries::build_log_entries::list_by_project(&conn, &project_id, None)
}

#[tauri::command]
pub fn add_build_log_entry(
    db: State<'_, AppDb>,
    input: CreateBuildLogEntryInput,
) -> Result<BuildLogEntry, String> {
    let conn = db.conn()?;
    crate::db::queries::build_log_entries::insert(
        &conn,
        &input.project_id,
        &input.entry_type,
        input.body.as_deref(),
        input.step_id.as_deref(),
        input.track_id.as_deref(),
        input.step_number,
        input.is_track_completion.unwrap_or(false),
        input.track_step_count,
        None,
        None,
    )
}

#[tauri::command]
pub fn add_build_log_photo(
    app: tauri::AppHandle,
    db: State<'_, AppDb>,
    project_id: String,
    source_path: String,
    caption: Option<String>,
) -> Result<BuildLogEntry, String> {
    let app_data = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let dest = file_stash::save_to_stash(&app_data, &source_path, "blog", &project_id)?;
    let conn = db.conn()?;
    crate::db::queries::build_log_entries::insert(
        &conn,
        &project_id,
        "photo",
        None,
        None,
        None,
        None,
        false,
        None,
        Some(&dest),
        caption.as_deref(),
    )
}
