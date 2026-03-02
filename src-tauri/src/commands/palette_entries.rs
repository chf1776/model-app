use crate::db::AppDb;
use crate::db::queries::palette_entries::PaletteMapping;
use tauri::State;

#[tauri::command]
pub fn list_paint_project_mappings(
    db: State<'_, AppDb>,
) -> Result<Vec<PaletteMapping>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    crate::db::queries::palette_entries::list_all_paint_mappings(&conn)
}

#[tauri::command]
pub fn set_paint_projects(
    db: State<'_, AppDb>,
    paint_id: String,
    paint_name: String,
    project_ids: Vec<String>,
) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    crate::db::queries::palette_entries::set_projects_for_paint(&conn, &paint_id, &paint_name, &project_ids)
}
