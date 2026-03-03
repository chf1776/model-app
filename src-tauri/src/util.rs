use rusqlite::Connection;
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

pub fn now() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs() as i64
}

pub fn get_pdf_dpi(conn: &Connection) -> u32 {
    crate::db::queries::settings::get(conn, "pdf_dpi")
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or(150)
}

pub fn instructions_dir(app_data: &Path, project_id: &str, source_id: &str) -> PathBuf {
    app_data
        .join("model-builder")
        .join("projects")
        .join(project_id)
        .join("instructions")
        .join(source_id)
}
