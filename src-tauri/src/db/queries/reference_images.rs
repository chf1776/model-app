use crate::models::ReferenceImage;
use crate::util::now;
use rusqlite::{params, Connection};
use uuid::Uuid;

fn map_reference_image(row: &rusqlite::Row) -> rusqlite::Result<ReferenceImage> {
    Ok(ReferenceImage {
        id: row.get(0)?,
        step_id: row.get(1)?,
        file_path: row.get(2)?,
        caption: row.get(3)?,
        display_order: row.get(4)?,
        created_at: row.get(5)?,
    })
}

const SELECT_COLS: &str = "id, step_id, file_path, caption, display_order, created_at";

pub fn list_for_step(conn: &Connection, step_id: &str) -> Result<Vec<ReferenceImage>, String> {
    let mut stmt = conn
        .prepare(&format!(
            "SELECT {SELECT_COLS} FROM reference_images WHERE step_id = ?1 ORDER BY display_order"
        ))
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map(params![step_id], |row| map_reference_image(row))
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(rows)
}

pub fn get_by_id(conn: &Connection, id: &str) -> Result<ReferenceImage, String> {
    conn.query_row(
        &format!("SELECT {SELECT_COLS} FROM reference_images WHERE id = ?1"),
        params![id],
        |row| map_reference_image(row),
    )
    .map_err(|e| e.to_string())
}

pub fn insert(
    conn: &Connection,
    step_id: &str,
    file_path: &str,
    caption: Option<&str>,
) -> Result<ReferenceImage, String> {
    let id = Uuid::new_v4().to_string();
    let ts = now();

    let max_order: i32 = conn
        .query_row(
            "SELECT COALESCE(MAX(display_order), -1) FROM reference_images WHERE step_id = ?1",
            params![step_id],
            |row| row.get(0),
        )
        .unwrap_or(-1);

    conn.execute(
        "INSERT INTO reference_images (id, step_id, file_path, caption, display_order, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![id, step_id, file_path, caption, max_order + 1, ts],
    )
    .map_err(|e| e.to_string())?;

    get_by_id(conn, &id)
}

pub fn update_caption(
    conn: &Connection,
    id: &str,
    caption: Option<&str>,
) -> Result<ReferenceImage, String> {
    conn.execute(
        "UPDATE reference_images SET caption = ?1 WHERE id = ?2",
        params![caption, id],
    )
    .map_err(|e| e.to_string())?;

    get_by_id(conn, id)
}

pub fn delete(conn: &Connection, id: &str) -> Result<(), String> {
    conn.execute("DELETE FROM reference_images WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}
