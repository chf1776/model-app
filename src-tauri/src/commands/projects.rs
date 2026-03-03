use crate::db::AppDb;
use crate::models::{CreateKitInput, CreateProjectInput, Project};
use rusqlite::params;
use std::path::PathBuf;
use tauri::{Manager, State};

#[tauri::command]
pub fn list_projects(db: State<'_, AppDb>) -> Result<Vec<Project>, String> {
    let conn = db.conn()?;
    crate::db::queries::projects::list_all(&conn)
}

#[tauri::command]
pub fn get_project(db: State<'_, AppDb>, id: String) -> Result<Project, String> {
    let conn = db.conn()?;
    crate::db::queries::projects::get_by_id(&conn, &id)
}

#[tauri::command]
pub fn create_project(app: tauri::AppHandle, db: State<'_, AppDb>, input: CreateProjectInput) -> Result<Project, String> {
    let conn = db.conn()?;

    // Determine kit_id: use existing or create new
    let kit_id = if let Some(ref existing_id) = input.kit_id {
        // Transition kit to building status
        conn.execute(
            "UPDATE kits SET status = 'building' WHERE id = ?1 AND status = 'shelf'",
            rusqlite::params![existing_id],
        )
        .map_err(|e| e.to_string())?;
        existing_id.clone()
    } else if let Some(ref new_name) = input.new_kit_name {
        // Create a new kit inline
        let new_kit = crate::db::queries::kits::insert(
            &conn,
            CreateKitInput {
                name: new_name.clone(),
                manufacturer: input.new_kit_manufacturer.clone(),
                scale: input.new_kit_scale.clone(),
                kit_number: None,
                status: Some("building".to_string()),
                category: input.category.clone(),
                scalemates_url: None,
                price: None,
                currency: None,
                retailer_url: None,
                notes: None,
            },
        )?;
        new_kit.id
    } else {
        return Err("Either kit_id or new_kit_name must be provided".to_string());
    };

    let project = crate::db::queries::projects::insert(&conn, &input, &kit_id)?;

    // Auto-import kit files as instruction sources + rasterize PDFs
    let kit_files = crate::db::queries::kit_files::list_by_kit(&conn, &kit_id)
        .unwrap_or_default();
    let pdf_kit_files: Vec<_> = kit_files.iter().filter(|kf| kf.file_type == "pdf").collect();

    if !pdf_kit_files.is_empty() {
        let app_data = app.path().app_data_dir().map_err(|e| e.to_string())?;
        let dpi = crate::util::get_pdf_dpi(&conn);

        for kf in &pdf_kit_files {
            let name = kf
                .label
                .clone()
                .unwrap_or_else(|| {
                    PathBuf::from(&kf.file_path)
                        .file_stem()
                        .and_then(|n| n.to_str())
                        .unwrap_or("Untitled")
                        .to_string()
                });
            let original_filename = PathBuf::from(&kf.file_path)
                .file_name()
                .and_then(|n| n.to_str())
                .unwrap_or("unknown.pdf")
                .to_string();

            let source = crate::db::queries::instruction_sources::insert(
                &conn,
                &project.id,
                &name,
                &original_filename,
                &kf.file_path,
            )?;

            let instructions_dir = crate::util::instructions_dir(&app_data, &project.id, &source.id);

            std::fs::create_dir_all(&instructions_dir)
                .map_err(|e| format!("Failed to create instructions dir: {e}"))?;
            let pdf_dest = instructions_dir.join("original.pdf");
            std::fs::copy(&kf.file_path, &pdf_dest)
                .map_err(|e| format!("Failed to copy PDF: {e}"))?;

            let pages_dir = instructions_dir.join("pages");
            match crate::services::pdf::rasterize_and_persist(
                &conn, &source.id, &pdf_dest, &pages_dir, dpi,
            ) {
                Ok(_) => {}
                Err(e) => {
                    eprintln!("Warning: failed to rasterize PDF for kit file {}: {}", kf.id, e);
                }
            }
        }
    }

    // Auto-link accessories with matching parent_kit_id
    let mut acc_stmt = conn
        .prepare("SELECT id FROM accessories WHERE parent_kit_id = ?1")
        .map_err(|e| e.to_string())?;
    let acc_ids: Vec<String> = acc_stmt
        .query_map(params![kit_id], |row| row.get(0))
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    for acc_id in &acc_ids {
        conn.execute(
            "INSERT OR IGNORE INTO project_accessories (project_id, accessory_id) VALUES (?1, ?2)",
            params![project.id, acc_id],
        )
        .map_err(|e| e.to_string())?;
    }

    // Store the project id as active
    crate::db::queries::settings::set(&conn, "active_project_id", &project.id)
        .ok();

    Ok(project)
}

#[tauri::command]
pub fn rename_project(db: State<'_, AppDb>, id: String, name: String) -> Result<(), String> {
    let conn = db.conn()?;
    conn.execute(
        "UPDATE projects SET name = ?1 WHERE id = ?2",
        rusqlite::params![name, id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn delete_project(app: tauri::AppHandle, db: State<'_, AppDb>, id: String) -> Result<(), String> {
    let conn = db.conn()?;

    // Clear active project if it's the one being deleted
    let active_id = crate::db::queries::settings::get(&conn, "active_project_id")
        .unwrap_or_default();
    if active_id == id {
        crate::db::queries::settings::set(&conn, "active_project_id", "").ok();
    }

    // Clean up instruction files on disk
    let app_data = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let project_dir = app_data.join("model-builder").join("projects").join(&id);
    if project_dir.exists() {
        let _ = std::fs::remove_dir_all(&project_dir);
    }

    // CASCADE handles project_ui_state, instruction_sources, instruction_pages, etc.
    crate::db::queries::projects::delete(&conn, &id)
}

#[tauri::command]
pub fn set_active_project(db: State<'_, AppDb>, id: String) -> Result<(), String> {
    let conn = db.conn()?;
    crate::db::queries::settings::set(&conn, "active_project_id", &id)
}

#[tauri::command]
pub fn get_active_project(db: State<'_, AppDb>) -> Result<Option<Project>, String> {
    let conn = db.conn()?;
    let id = crate::db::queries::settings::get(&conn, "active_project_id")
        .unwrap_or_default();
    if id.is_empty() {
        return Ok(None);
    }
    match crate::db::queries::projects::get_by_id(&conn, &id) {
        Ok(p) => Ok(Some(p)),
        Err(_) => Ok(None),
    }
}
