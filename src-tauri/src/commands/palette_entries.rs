use crate::db::AppDb;
use crate::db::queries::palette_entries::PaletteMapping;
use crate::models::{Paint, PaletteEntry, PaletteComponent, CreatePaletteEntryInput, UpdatePaletteEntryInput, PaletteComponentInput};
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

#[tauri::command]
pub fn list_palette_entries(
    db: State<'_, AppDb>,
    project_id: String,
) -> Result<Vec<PaletteEntry>, String> {
    let conn = db.conn()?;
    crate::db::queries::palette_entries::list_by_project(&conn, &project_id)
}

#[tauri::command]
pub fn create_palette_entry(
    db: State<'_, AppDb>,
    input: CreatePaletteEntryInput,
) -> Result<PaletteEntry, String> {
    let conn = db.conn()?;
    crate::db::queries::palette_entries::insert(&conn, input)
}

#[tauri::command]
pub fn update_palette_entry(
    db: State<'_, AppDb>,
    input: UpdatePaletteEntryInput,
) -> Result<PaletteEntry, String> {
    let conn = db.conn()?;
    crate::db::queries::palette_entries::update(&conn, input)
}

#[tauri::command]
pub fn delete_palette_entry(
    db: State<'_, AppDb>,
    id: String,
) -> Result<(), String> {
    let conn = db.conn()?;
    crate::db::queries::palette_entries::delete(&conn, &id)
}

#[tauri::command]
pub fn set_palette_components(
    db: State<'_, AppDb>,
    palette_entry_id: String,
    components: Vec<PaletteComponentInput>,
) -> Result<Vec<PaletteComponent>, String> {
    let conn = db.conn()?;
    crate::db::queries::palette_entries::set_components(&conn, &palette_entry_id, &components)
}
