use crate::db::AppDb;
use tauri::State;

#[tauri::command]
pub fn get_setting(db: State<'_, AppDb>, key: String) -> Result<String, String> {
    let conn = db.conn()?;
    crate::db::queries::settings::get(&conn, &key)
}

#[tauri::command]
pub fn set_setting(db: State<'_, AppDb>, key: String, value: String) -> Result<(), String> {
    let conn = db.conn()?;
    crate::db::queries::settings::set(&conn, &key, &value)
}
