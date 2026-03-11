use crate::db::AppDb;
use crate::models::StepPaintRefInfo;
use tauri::State;

#[tauri::command]
pub fn list_step_paint_refs(db: State<'_, AppDb>, step_id: String) -> Result<Vec<String>, String> {
    let conn = db.conn()?;
    crate::db::queries::step_paint_refs::list_for_step(&conn, &step_id)
}

#[tauri::command]
pub fn set_step_paint_refs(
    db: State<'_, AppDb>,
    step_id: String,
    entry_ids: Vec<String>,
) -> Result<Vec<String>, String> {
    let conn = db.conn()?;
    crate::db::queries::step_paint_refs::set_for_step(&conn, &step_id, entry_ids)
}

#[tauri::command]
pub fn list_project_step_paint_refs(
    db: State<'_, AppDb>,
    project_id: String,
) -> Result<Vec<StepPaintRefInfo>, String> {
    let conn = db.conn()?;
    crate::db::queries::step_paint_refs::list_for_project(&conn, &project_id)
}
