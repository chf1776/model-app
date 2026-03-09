use crate::db::AppDb;
use crate::models::GalleryPhoto;
use crate::services::file_stash;
use tauri::{Manager, State};

#[tauri::command]
pub fn list_gallery_photos(
    db: State<'_, AppDb>,
    project_id: String,
) -> Result<Vec<GalleryPhoto>, String> {
    let conn = db.conn()?;
    crate::db::queries::gallery_photos::list_by_project(&conn, &project_id)
}

#[tauri::command]
pub fn add_gallery_photo(
    app: tauri::AppHandle,
    db: State<'_, AppDb>,
    project_id: String,
    source_path: String,
    caption: Option<String>,
) -> Result<GalleryPhoto, String> {
    let app_data = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;
    let dest_str = file_stash::save_to_stash(&app_data, &source_path, "gal", &project_id)?;

    let conn = db.conn()?;
    crate::db::queries::gallery_photos::insert(&conn, &project_id, &dest_str, caption.as_deref())
}

#[tauri::command]
pub fn update_gallery_photo_caption(
    db: State<'_, AppDb>,
    id: String,
    caption: Option<String>,
) -> Result<GalleryPhoto, String> {
    let conn = db.conn()?;
    crate::db::queries::gallery_photos::update_caption(&conn, &id, caption.as_deref())
}

#[tauri::command]
pub fn delete_gallery_photo(
    db: State<'_, AppDb>,
    id: String,
) -> Result<(), String> {
    let conn = db.conn()?;
    let photo = crate::db::queries::gallery_photos::get_by_id(&conn, &id)?;
    crate::db::queries::gallery_photos::delete(&conn, &id)?;
    let _ = std::fs::remove_file(&photo.file_path);
    Ok(())
}

#[tauri::command]
pub fn toggle_photo_star(
    db: State<'_, AppDb>,
    photo_type: String,
    id: String,
) -> Result<bool, String> {
    let conn = db.conn()?;
    match photo_type.as_str() {
        "progress" => crate::db::queries::progress_photos::toggle_star(&conn, &id),
        "milestone" => crate::db::queries::milestone_photos::toggle_star(&conn, &id),
        "gallery" => crate::db::queries::gallery_photos::toggle_star(&conn, &id),
        _ => Err(format!("Unknown photo type: {}", photo_type)),
    }
}
