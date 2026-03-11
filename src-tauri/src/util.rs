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

pub fn project_dir(app_data: &Path, project_id: &str) -> PathBuf {
    app_data
        .join("model-builder")
        .join("projects")
        .join(project_id)
}

pub fn instructions_dir(app_data: &Path, project_id: &str, source_id: &str) -> PathBuf {
    project_dir(app_data, project_id)
        .join("instructions")
        .join(source_id)
}

/// Toggle `is_starred` column on a photo table and return the new value.
pub fn toggle_star(conn: &Connection, table: &str, id: &str) -> Result<bool, String> {
    conn.execute(
        &format!("UPDATE {table} SET is_starred = 1 - is_starred WHERE id = ?1"),
        rusqlite::params![id],
    )
    .map_err(|e| e.to_string())?;

    conn.query_row(
        &format!("SELECT is_starred FROM {table} WHERE id = ?1"),
        rusqlite::params![id],
        |row| Ok(row.get::<_, i32>(0)? != 0),
    )
    .map_err(|e| e.to_string())
}
