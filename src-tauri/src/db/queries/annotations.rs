use crate::models::StepAnnotations;
use crate::util::now;
use rusqlite::{params, Connection};

fn map_row(row: &rusqlite::Row) -> rusqlite::Result<StepAnnotations> {
    Ok(StepAnnotations {
        step_id: row.get(0)?,
        data: row.get(1)?,
        updated_at: row.get(2)?,
        created_at: row.get(3)?,
    })
}

const SELECT_COLS: &str = "step_id, data, updated_at, created_at";

pub fn get(conn: &Connection, step_id: &str) -> Result<Option<StepAnnotations>, String> {
    let mut stmt = conn
        .prepare(&format!(
            "SELECT {SELECT_COLS} FROM annotations WHERE step_id = ?1"
        ))
        .map_err(|e| e.to_string())?;

    let mut rows = stmt
        .query_map(params![step_id], |row| map_row(row))
        .map_err(|e| e.to_string())?;

    match rows.next() {
        Some(Ok(ann)) => Ok(Some(ann)),
        Some(Err(e)) => Err(e.to_string()),
        None => Ok(None),
    }
}

pub fn upsert(conn: &Connection, step_id: &str, data: &str) -> Result<StepAnnotations, String> {
    let ts = now();

    conn.execute(
        "INSERT INTO annotations (step_id, data, updated_at, created_at)
         VALUES (?1, ?2, ?3, ?3)
         ON CONFLICT(step_id) DO UPDATE SET data = ?2, updated_at = ?3",
        params![step_id, data, ts],
    )
    .map_err(|e| e.to_string())?;

    conn.query_row(
        &format!("SELECT {SELECT_COLS} FROM annotations WHERE step_id = ?1"),
        params![step_id],
        |row| map_row(row),
    )
    .map_err(|e| e.to_string())
}
