use crate::db::AppDb;
use crate::models::{Accessory, CreateAccessoryInput, UpdateAccessoryInput};
use tauri::State;

#[tauri::command]
pub fn list_accessories(db: State<'_, AppDb>) -> Result<Vec<Accessory>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    crate::db::queries::accessories::list_all(&conn)
}

#[tauri::command]
pub fn create_accessory(
    db: State<'_, AppDb>,
    input: CreateAccessoryInput,
) -> Result<Accessory, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    crate::db::queries::accessories::insert(&conn, input)
}

#[tauri::command]
pub fn update_accessory(
    db: State<'_, AppDb>,
    input: UpdateAccessoryInput,
) -> Result<Accessory, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    crate::db::queries::accessories::update(&conn, input)
}

#[tauri::command]
pub fn delete_accessory(db: State<'_, AppDb>, id: String) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    crate::db::queries::accessories::delete(&conn, &id)
}

#[tauri::command]
pub fn list_accessories_for_kit(
    db: State<'_, AppDb>,
    kit_id: String,
) -> Result<Vec<Accessory>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    crate::db::queries::accessories::list_by_kit(&conn, &kit_id)
}
