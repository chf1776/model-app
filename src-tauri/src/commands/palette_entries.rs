use crate::db::AppDb;
use crate::db::queries::palette_entries::PaletteMapping;
use crate::models::Paint;
use tauri::State;

#[tauri::command]
pub fn list_paint_project_mappings(
    db: State<'_, AppDb>,
) -> Result<Vec<PaletteMapping>, String> {
    let conn = db.conn()?;
    crate::db::queries::palette_entries::list_all_paint_mappings(&conn)
}

#[tauri::command]
pub fn list_paints_for_project(
    db: State<'_, AppDb>,
    project_id: String,
) -> Result<Vec<Paint>, String> {
    let conn = db.conn()?;
    crate::db::queries::palette_entries::list_paints_for_project(&conn, &project_id)
}

#[tauri::command]
pub fn set_paint_projects(
    db: State<'_, AppDb>,
    paint_id: String,
    paint_name: String,
    project_ids: Vec<String>,
) -> Result<(), String> {
    let conn = db.conn()?;
    crate::db::queries::palette_entries::set_projects_for_paint(&conn, &paint_id, &paint_name, &project_ids)
}
