use crate::db::AppDb;
use crate::models::ReferenceImage;
use crate::services::file_stash;
use tauri::{Manager, State};

#[tauri::command]
pub fn list_reference_images(
    db: State<'_, AppDb>,
    step_id: String,
) -> Result<Vec<ReferenceImage>, String> {
    let conn = db.conn()?;
    crate::db::queries::reference_images::list_for_step(&conn, &step_id)
}

#[tauri::command]
pub fn add_reference_image(
    app: tauri::AppHandle,
    db: State<'_, AppDb>,
    step_id: String,
    source_path: String,
    caption: Option<String>,
) -> Result<ReferenceImage, String> {
    let app_data = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;
    let dest_str = file_stash::save_to_stash(&app_data, &source_path, "ref", &step_id)?;

    let conn = db.conn()?;
    crate::db::queries::reference_images::insert(
        &conn,
        &step_id,
        &dest_str,
        caption.as_deref(),
    )
}

#[tauri::command]
pub fn update_reference_image_caption(
    db: State<'_, AppDb>,
    id: String,
    caption: Option<String>,
) -> Result<ReferenceImage, String> {
    let conn = db.conn()?;
    crate::db::queries::reference_images::update_caption(&conn, &id, caption.as_deref())
}

#[tauri::command]
pub fn delete_reference_image(
    db: State<'_, AppDb>,
    id: String,
) -> Result<(), String> {
    let conn = db.conn()?;

    // Get file path before deleting record
    let img = crate::db::queries::reference_images::get_by_id(&conn, &id)?;

    crate::db::queries::reference_images::delete(&conn, &id)?;

    // Best-effort file cleanup
    let _ = std::fs::remove_file(&img.file_path);

    Ok(())
}
