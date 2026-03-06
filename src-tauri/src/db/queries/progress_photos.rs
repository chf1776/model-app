use crate::models::ProgressPhoto;
use crate::util::now;
use rusqlite::{params, Connection};
use uuid::Uuid;

fn map_row(row: &rusqlite::Row) -> rusqlite::Result<ProgressPhoto> {
    Ok(ProgressPhoto {
        id: row.get(0)?,
        step_id: row.get(1)?,
        file_path: row.get(2)?,
        captured_at: row.get(3)?,
        created_at: row.get(4)?,
    })
}

const SELECT_COLS: &str = "id, step_id, file_path, captured_at, created_at";

pub fn list_for_step(conn: &Connection, step_id: &str) -> Result<Vec<ProgressPhoto>, String> {
    let mut stmt = conn
        .prepare(&format!(
            "SELECT {SELECT_COLS} FROM progress_photos WHERE step_id = ?1 ORDER BY created_at"
        ))
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map(params![step_id], |row| map_row(row))
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(rows)
}

pub fn insert(conn: &Connection, step_id: &str, file_path: &str) -> Result<ProgressPhoto, String> {
    let id = Uuid::new_v4().to_string();
    let ts = now();

    conn.execute(
        "INSERT INTO progress_photos (id, step_id, file_path, captured_at, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5)",
        params![id, step_id, file_path, ts, ts],
    )
    .map_err(|e| e.to_string())?;

    conn.query_row(
        &format!("SELECT {SELECT_COLS} FROM progress_photos WHERE id = ?1"),
        params![id],
        |row| map_row(row),
    )
    .map_err(|e| e.to_string())
}
