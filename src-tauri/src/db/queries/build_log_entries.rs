use crate::models::BuildLogEntry;
use crate::util::now;
use rusqlite::{params, Connection};
use uuid::Uuid;

fn map_row(row: &rusqlite::Row) -> rusqlite::Result<BuildLogEntry> {
    Ok(BuildLogEntry {
        id: row.get(0)?,
        project_id: row.get(1)?,
        entry_type: row.get(2)?,
        body: row.get(3)?,
        photo_path: row.get(4)?,
        caption: row.get(5)?,
        step_id: row.get(6)?,
        track_id: row.get(7)?,
        step_number: row.get(8)?,
        is_track_completion: row.get::<_, i32>(9)? != 0,
        track_step_count: row.get(10)?,
        created_at: row.get(11)?,
    })
}

const SELECT_COLS: &str =
    "id, project_id, entry_type, body, photo_path, caption, step_id, track_id, step_number, is_track_completion, track_step_count, created_at";

pub fn list_by_project(
    conn: &Connection,
    project_id: &str,
    limit: Option<i32>,
) -> Result<Vec<BuildLogEntry>, String> {
    let limit_clause = match limit {
        Some(n) => format!(" LIMIT {n}"),
        None => String::new(),
    };
    let mut stmt = conn
        .prepare(&format!(
            "SELECT {SELECT_COLS} FROM build_log_entries WHERE project_id = ?1 ORDER BY created_at DESC{limit_clause}"
        ))
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map(params![project_id], |row| map_row(row))
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(rows)
}

fn fetch_by_id(conn: &Connection, id: &str) -> Result<BuildLogEntry, String> {
    conn.query_row(
        &format!("SELECT {SELECT_COLS} FROM build_log_entries WHERE id = ?1"),
        params![id],
        |row| map_row(row),
    )
    .map_err(|e| e.to_string())
}

pub fn insert(
    conn: &Connection,
    project_id: &str,
    entry_type: &str,
    body: Option<&str>,
    step_id: Option<&str>,
    track_id: Option<&str>,
    step_number: Option<i32>,
    is_track_completion: bool,
    track_step_count: Option<i32>,
    photo_path: Option<&str>,
    caption: Option<&str>,
) -> Result<BuildLogEntry, String> {
    let id = Uuid::new_v4().to_string();
    let ts = now();

    conn.execute(
        &format!(
            "INSERT INTO build_log_entries ({SELECT_COLS})
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)"
        ),
        params![
            id,
            project_id,
            entry_type,
            body,
            photo_path,
            caption,
            step_id,
            track_id,
            step_number,
            is_track_completion as i32,
            track_step_count,
            ts,
        ],
    )
    .map_err(|e| e.to_string())?;

    fetch_by_id(conn, &id)
}
