use crate::db::AppDb;
use crate::models::Tag;
use tauri::State;

#[tauri::command]
pub fn list_tags(db: State<'_, AppDb>) -> Result<Vec<Tag>, String> {
    let conn = db.conn()?;
    crate::db::queries::tags::list_all(&conn)
}

#[tauri::command]
pub fn list_step_tags(db: State<'_, AppDb>, step_id: String) -> Result<Vec<Tag>, String> {
    let conn = db.conn()?;
    crate::db::queries::tags::list_for_step(&conn, &step_id)
}

#[tauri::command]
pub fn set_step_tags(
    db: State<'_, AppDb>,
    step_id: String,
    tag_names: Vec<String>,
) -> Result<Vec<Tag>, String> {
    let conn = db.conn()?;
    crate::db::queries::tags::set_step_tags(&conn, &step_id, tag_names)
}
