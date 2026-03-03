use crate::models::InstructionSource;
use rusqlite::{params, Connection};
use std::time::{SystemTime, UNIX_EPOCH};
use uuid::Uuid;

fn now() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs() as i64
}

pub fn list_by_project(conn: &Connection, project_id: &str) -> Result<Vec<InstructionSource>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT id, project_id, name, original_filename, file_path, page_count,
                    display_order, created_at
             FROM instruction_sources
             WHERE project_id = ?1
             ORDER BY display_order, created_at",
        )
        .map_err(|e| e.to_string())?;

    let sources = stmt
        .query_map(params![project_id], |row| {
            Ok(InstructionSource {
                id: row.get(0)?,
                project_id: row.get(1)?,
                name: row.get(2)?,
                original_filename: row.get(3)?,
                file_path: row.get(4)?,
                page_count: row.get(5)?,
                display_order: row.get(6)?,
                created_at: row.get(7)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(sources)
}

pub fn get_by_id(conn: &Connection, id: &str) -> Result<InstructionSource, String> {
    conn.query_row(
        "SELECT id, project_id, name, original_filename, file_path, page_count,
                display_order, created_at
         FROM instruction_sources WHERE id = ?1",
        params![id],
        |row| {
            Ok(InstructionSource {
                id: row.get(0)?,
                project_id: row.get(1)?,
                name: row.get(2)?,
                original_filename: row.get(3)?,
                file_path: row.get(4)?,
                page_count: row.get(5)?,
                display_order: row.get(6)?,
                created_at: row.get(7)?,
            })
        },
    )
    .map_err(|e| e.to_string())
}

pub fn insert(
    conn: &Connection,
    project_id: &str,
    name: &str,
    original_filename: &str,
    file_path: &str,
) -> Result<InstructionSource, String> {
    let id = Uuid::new_v4().to_string();
    let ts = now();

    // Get next display_order
    let display_order: i32 = conn
        .query_row(
            "SELECT COALESCE(MAX(display_order), -1) + 1 FROM instruction_sources WHERE project_id = ?1",
            params![project_id],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT INTO instruction_sources (id, project_id, name, original_filename, file_path, page_count, display_order, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, 0, ?6, ?7)",
        params![id, project_id, name, original_filename, file_path, display_order, ts],
    )
    .map_err(|e| e.to_string())?;

    Ok(InstructionSource {
        id,
        project_id: project_id.to_string(),
        name: name.to_string(),
        original_filename: original_filename.to_string(),
        file_path: file_path.to_string(),
        page_count: 0,
        display_order,
        created_at: ts,
    })
}

pub fn update_after_processing(
    conn: &Connection,
    id: &str,
    page_count: i32,
    file_path: &str,
) -> Result<(), String> {
    conn.execute(
        "UPDATE instruction_sources SET page_count = ?1, file_path = ?2 WHERE id = ?3",
        params![page_count, file_path, id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn delete(conn: &Connection, id: &str) -> Result<(), String> {
    conn.execute("DELETE FROM instruction_sources WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}
