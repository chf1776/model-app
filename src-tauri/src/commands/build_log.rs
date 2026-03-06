use crate::db::AppDb;
use crate::models::BuildLogEntry;
use tauri::State;

#[tauri::command]
pub fn add_build_log_entry(
    db: State<'_, AppDb>,
    project_id: String,
    entry_type: String,
    body: Option<String>,
    step_id: Option<String>,
    track_id: Option<String>,
    step_number: Option<i32>,
    is_track_completion: Option<bool>,
    track_step_count: Option<i32>,
) -> Result<BuildLogEntry, String> {
    let conn = db.conn()?;
    crate::db::queries::build_log_entries::insert(
        &conn,
        &project_id,
        &entry_type,
        body.as_deref(),
        step_id.as_deref(),
        track_id.as_deref(),
        step_number,
        is_track_completion.unwrap_or(false),
        track_step_count,
    )
}
