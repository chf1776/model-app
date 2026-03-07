use crate::db::AppDb;
use crate::models::{CreateDryingTimerInput, DryingTimer};
use tauri::State;

#[tauri::command]
pub fn list_drying_timers(db: State<'_, AppDb>) -> Result<Vec<DryingTimer>, String> {
    let conn = db.conn()?;
    crate::db::queries::drying_timers::list_active(&conn)
}

#[tauri::command]
pub fn create_drying_timer(
    db: State<'_, AppDb>,
    input: CreateDryingTimerInput,
) -> Result<DryingTimer, String> {
    let conn = db.conn()?;
    crate::db::queries::drying_timers::insert(&conn, &input)
}

#[tauri::command]
pub fn delete_drying_timer(db: State<'_, AppDb>, id: String) -> Result<(), String> {
    let conn = db.conn()?;
    crate::db::queries::drying_timers::delete(&conn, &id)
}
