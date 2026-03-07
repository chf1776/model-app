use crate::db::AppDb;
use crate::models::StepAnnotations;
use tauri::State;

#[tauri::command]
pub fn get_annotations(
    db: State<'_, AppDb>,
    step_id: String,
) -> Result<Option<StepAnnotations>, String> {
    let conn = db.conn()?;
    crate::db::queries::annotations::get(&conn, &step_id)
}

#[tauri::command]
pub fn save_annotations(
    db: State<'_, AppDb>,
    step_id: String,
    data: String,
) -> Result<StepAnnotations, String> {
    let conn = db.conn()?;
    crate::db::queries::annotations::upsert(&conn, &step_id, &data)
}
