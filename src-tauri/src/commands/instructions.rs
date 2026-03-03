use crate::db::AppDb;
use crate::models::{InstructionPage, InstructionSource, ProjectUiState};
use std::fs;
use std::path::PathBuf;
use tauri::{Manager, State};

#[tauri::command]
pub fn list_instruction_sources(
    db: State<'_, AppDb>,
    project_id: String,
) -> Result<Vec<InstructionSource>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    crate::db::queries::instruction_sources::list_by_project(&conn, &project_id)
}

#[tauri::command]
pub fn list_instruction_pages(
    db: State<'_, AppDb>,
    source_id: String,
) -> Result<Vec<InstructionPage>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    crate::db::queries::instruction_pages::list_by_source(&conn, &source_id)
}

#[tauri::command]
pub fn upload_instruction_pdf(
    app: tauri::AppHandle,
    db: State<'_, AppDb>,
    project_id: String,
    source_path: String,
    name: Option<String>,
) -> Result<InstructionSource, String> {
    let app_data = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let source_file = PathBuf::from(&source_path);

    // Derive name from filename if not provided
    let display_name = name.unwrap_or_else(|| {
        source_file
            .file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or("Instructions")
            .to_string()
    });

    let original_filename = source_file
        .file_name()
        .and_then(|s| s.to_str())
        .unwrap_or("unknown.pdf")
        .to_string();

    // Insert source record first to get the actual ID
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut source = crate::db::queries::instruction_sources::insert(
        &conn,
        &project_id,
        &display_name,
        &original_filename,
        &source_path,
    )?;

    // Create output directory using the actual source ID
    let instructions_dir = app_data
        .join("model-builder")
        .join("projects")
        .join(&project_id)
        .join("instructions")
        .join(&source.id);

    fs::create_dir_all(&instructions_dir)
        .map_err(|e| format!("Failed to create instructions dir: {e}"))?;

    // Copy original PDF
    let pdf_dest = instructions_dir.join("original.pdf");
    fs::copy(&source_file, &pdf_dest)
        .map_err(|e| format!("Failed to copy PDF: {e}"))?;

    // Read DPI setting and rasterize
    let dpi: u32 = crate::db::queries::settings::get(&conn, "pdf_dpi")
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or(150);

    let pages_dir = instructions_dir.join("pages");
    let page_count = crate::services::pdf::rasterize_and_persist(
        &conn, &source.id, &pdf_dest, &pages_dir, dpi,
    )?;

    source.page_count = page_count;
    source.file_path = pdf_dest.to_string_lossy().to_string();

    Ok(source)
}

#[tauri::command]
pub fn process_instruction_source(
    app: tauri::AppHandle,
    db: State<'_, AppDb>,
    source_id: String,
) -> Result<InstructionSource, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let source = crate::db::queries::instruction_sources::get_by_id(&conn, &source_id)?;

    if source.page_count > 0 {
        return Ok(source);
    }

    let app_data = app.path().app_data_dir().map_err(|e| e.to_string())?;

    let instructions_dir = app_data
        .join("model-builder")
        .join("projects")
        .join(&source.project_id)
        .join("instructions")
        .join(&source.id);
    let pages_dir = instructions_dir.join("pages");

    let pdf_path = PathBuf::from(&source.file_path);
    if !pdf_path.exists() {
        return Err(format!("PDF file not found: {}", source.file_path));
    }

    let dpi: u32 = crate::db::queries::settings::get(&conn, "pdf_dpi")
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or(150);

    let page_count = crate::services::pdf::rasterize_and_persist(
        &conn, &source.id, &pdf_path, &pages_dir, dpi,
    )?;

    let mut updated = source;
    updated.page_count = page_count;
    Ok(updated)
}

#[tauri::command]
pub fn delete_instruction_source(
    app: tauri::AppHandle,
    db: State<'_, AppDb>,
    source_id: String,
) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let source = crate::db::queries::instruction_sources::get_by_id(&conn, &source_id)?;

    // Delete from database (CASCADE will remove pages)
    crate::db::queries::instruction_sources::delete(&conn, &source_id)?;

    // Clean up files on disk
    let app_data = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let instructions_dir = app_data
        .join("model-builder")
        .join("projects")
        .join(&source.project_id)
        .join("instructions")
        .join(&source.id);

    if instructions_dir.exists() {
        let _ = fs::remove_dir_all(&instructions_dir);
    }

    Ok(())
}

#[tauri::command]
pub fn set_page_rotation(
    db: State<'_, AppDb>,
    page_id: String,
    rotation: i32,
) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    crate::db::queries::instruction_pages::set_rotation(&conn, &page_id, rotation)
}

#[tauri::command]
pub fn get_project_ui_state(
    db: State<'_, AppDb>,
    project_id: String,
) -> Result<ProjectUiState, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    crate::db::queries::project_ui_state::get_or_create(&conn, &project_id)
}

#[tauri::command]
pub fn save_view_state(
    db: State<'_, AppDb>,
    project_id: String,
    zoom: f64,
    pan_x: f64,
    pan_y: f64,
) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    crate::db::queries::project_ui_state::save_view_state(&conn, &project_id, zoom, pan_x, pan_y)
}
