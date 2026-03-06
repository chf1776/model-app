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
    })
}

const SELECT_COLS: &str = "id, track_id, file_path, captured_at, created_at";

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
