use crate::db::AppDb;
use crate::models::{BuildLogEntry, CreateBuildLogEntryInput};
use tauri::State;

#[tauri::command]
pub fn list_build_log_entries(
    db: State<'_, AppDb>,
    project_id: String,
) -> Result<Vec<BuildLogEntry>, String> {
    let conn = db.conn()?;
    crate::db::queries::build_log_entries::list_by_project(&conn, &project_id)
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
    )
}
