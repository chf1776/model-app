use crate::db::AppDb;
use crate::models::{CreateSprueRefInput, SprueRef, UpdateSprueRefInput};
use tauri::State;

#[tauri::command]
pub fn list_sprue_refs(db: State<'_, AppDb>, project_id: String) -> Result<Vec<SprueRef>, String> {
    let conn = db.conn()?;
    crate::db::queries::sprue_refs::list_for_project(&conn, &project_id)
}

#[tauri::command]
pub fn create_sprue_ref(db: State<'_, AppDb>, input: CreateSprueRefInput) -> Result<SprueRef, String> {
    let conn = db.conn()?;

    let color = match &input.color {
        Some(c) => c.clone(),
        None => crate::db::queries::sprue_refs::get_next_color(&conn, &input.project_id)?,
    };

    crate::db::queries::sprue_refs::insert(
        &conn,
        &input.project_id,
        input.source_page_id.as_deref(),
        input.crop_x,
        input.crop_y,
        input.crop_w,
        input.crop_h,
        input.polygon_points.as_deref(),
        &input.label,
        &color,
    )
}

#[tauri::command]
pub fn update_sprue_ref(db: State<'_, AppDb>, input: UpdateSprueRefInput) -> Result<SprueRef, String> {
    let conn = db.conn()?;
    crate::db::queries::sprue_refs::update(
        &conn,
        &input.id,
        input.source_page_id.as_ref().map(|o| o.as_deref()),
        input.crop_x,
        input.crop_y,
        input.crop_w,
        input.crop_h,
        input.polygon_points.as_ref().map(|o| o.as_deref()),
        input.label.as_deref(),
        input.color.as_deref(),
    )
}

#[tauri::command]
pub fn delete_sprue_ref(db: State<'_, AppDb>, id: String) -> Result<(), String> {
    let conn = db.conn()?;
    crate::db::queries::sprue_refs::delete(&conn, &id)
}

#[tauri::command]
pub fn get_next_sprue_color(db: State<'_, AppDb>, project_id: String) -> Result<String, String> {
    let conn = db.conn()?;
    crate::db::queries::sprue_refs::get_next_color(&conn, &project_id)
}
