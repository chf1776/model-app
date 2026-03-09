use crate::models::MilestonePhoto;
use crate::util::now;
use rusqlite::{params, Connection};
use uuid::Uuid;

fn map_row(row: &rusqlite::Row) -> rusqlite::Result<MilestonePhoto> {
    Ok(MilestonePhoto {
        id: row.get(0)?,
        track_id: row.get(1)?,
        file_path: row.get(2)?,
        captured_at: row.get(3)?,
        created_at: row.get(4)?,
        is_starred: row.get::<_, i32>(5)? != 0,
    })
}

const SELECT_COLS: &str = "id, track_id, file_path, captured_at, created_at, is_starred";

pub fn list_by_project(conn: &Connection, project_id: &str) -> Result<Vec<MilestonePhoto>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT mp.id, mp.track_id, mp.file_path, mp.captured_at, mp.created_at, mp.is_starred
             FROM milestone_photos mp
             JOIN tracks t ON mp.track_id = t.id
             WHERE t.project_id = ?1
             ORDER BY mp.created_at DESC",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map(params![project_id], |row| map_row(row))
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(rows)
}

pub fn insert(
    conn: &Connection,
    track_id: &str,
    file_path: &str,
) -> Result<MilestonePhoto, String> {
    let id = Uuid::new_v4().to_string();
    let ts = now();

    conn.execute(
        "INSERT INTO milestone_photos (id, track_id, file_path, captured_at, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5)",
        params![id, track_id, file_path, ts, ts],
    )
    .map_err(|e| e.to_string())?;

    conn.query_row(
        &format!("SELECT {SELECT_COLS} FROM milestone_photos WHERE id = ?1"),
        params![id],
        |row| map_row(row),
    )
    .map_err(|e| e.to_string())
}

pub fn toggle_star(conn: &Connection, id: &str) -> Result<bool, String> {
    conn.execute(
        "UPDATE milestone_photos SET is_starred = 1 - is_starred WHERE id = ?1",
        params![id],
    )
    .map_err(|e| e.to_string())?;

    conn.query_row(
        "SELECT is_starred FROM milestone_photos WHERE id = ?1",
        params![id],
        |row| Ok(row.get::<_, i32>(0)? != 0),
    )
    .map_err(|e| e.to_string())
}
