use crate::db::AppDb;
use crate::models::{CreateStepInput, Step, UpdateStepInput};
use tauri::State;

#[tauri::command]
pub fn list_steps(db: State<'_, AppDb>, track_id: String) -> Result<Vec<Step>, String> {
    let conn = db.conn()?;
    crate::db::queries::steps::list_by_track(&conn, &track_id)
}

#[tauri::command]
pub fn list_project_steps(db: State<'_, AppDb>, project_id: String) -> Result<Vec<Step>, String> {
    let conn = db.conn()?;
    crate::db::queries::steps::list_by_project(&conn, &project_id)
}

#[tauri::command]
pub fn create_step(db: State<'_, AppDb>, input: CreateStepInput) -> Result<Step, String> {
    let conn = db.conn()?;
    crate::db::queries::steps::insert(&conn, input)
}

#[tauri::command]
pub fn update_step(db: State<'_, AppDb>, input: UpdateStepInput) -> Result<Step, String> {
    let conn = db.conn()?;
    crate::db::queries::steps::update(&conn, input)
}

#[tauri::command]
pub fn delete_step(db: State<'_, AppDb>, id: String) -> Result<(), String> {
    let conn = db.conn()?;
    crate::db::queries::steps::delete(&conn, &id)
}

#[tauri::command]
pub fn reorder_steps(
    db: State<'_, AppDb>,
    track_id: String,
    ordered_ids: Vec<String>,
) -> Result<(), String> {
    let conn = db.conn()?;
    crate::db::queries::steps::reorder(&conn, &track_id, ordered_ids)
}
