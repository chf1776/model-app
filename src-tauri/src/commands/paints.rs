use crate::db::AppDb;
use crate::models::{Paint, CreatePaintInput, UpdatePaintInput};
use tauri::State;

#[tauri::command]
pub fn list_paints(db: State<'_, AppDb>) -> Result<Vec<Paint>, String> {
    let conn = db.conn()?;
    crate::db::queries::paints::list_all(&conn)
}

#[tauri::command]
pub fn create_paint(
    db: State<'_, AppDb>,
    input: CreatePaintInput,
) -> Result<Paint, String> {
    let conn = db.conn()?;
    crate::db::queries::paints::insert(&conn, input)
}

#[tauri::command]
pub fn update_paint(
    db: State<'_, AppDb>,
    input: UpdatePaintInput,
) -> Result<Paint, String> {
    let conn = db.conn()?;
    crate::db::queries::paints::update(&conn, input)
}

#[tauri::command]
pub fn delete_paint(db: State<'_, AppDb>, id: String) -> Result<(), String> {
    let conn = db.conn()?;
    crate::db::queries::paints::delete(&conn, &id)
}
