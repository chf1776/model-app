use crate::models::GalleryPhoto;
use crate::util::now;
use rusqlite::{params, Connection};
use uuid::Uuid;

fn map_row(row: &rusqlite::Row) -> rusqlite::Result<GalleryPhoto> {
    Ok(GalleryPhoto {
        id: row.get(0)?,
        project_id: row.get(1)?,
        file_path: row.get(2)?,
        caption: row.get(3)?,
        is_starred: row.get::<_, i32>(4)? != 0,
        created_at: row.get(5)?,
    })
}

const SELECT_COLS: &str = "id, project_id, file_path, caption, is_starred, created_at";

pub fn list_by_project(conn: &Connection, project_id: &str) -> Result<Vec<GalleryPhoto>, String> {
    let mut stmt = conn
        .prepare(&format!(
            "SELECT {SELECT_COLS} FROM gallery_photos WHERE project_id = ?1 ORDER BY created_at DESC"
        ))
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map(params![project_id], |row| map_row(row))
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(rows)
}

pub fn get_by_id(conn: &Connection, id: &str) -> Result<GalleryPhoto, String> {
    conn.query_row(
        &format!("SELECT {SELECT_COLS} FROM gallery_photos WHERE id = ?1"),
        params![id],
        |row| map_row(row),
    )
    .map_err(|e| e.to_string())
}

pub fn insert(
    conn: &Connection,
    project_id: &str,
    file_path: &str,
    caption: Option<&str>,
) -> Result<GalleryPhoto, String> {
    let id = Uuid::new_v4().to_string();
    let ts = now();

    conn.execute(
        "INSERT INTO gallery_photos (id, project_id, file_path, caption, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5)",
        params![id, project_id, file_path, caption, ts],
    )
    .map_err(|e| e.to_string())?;

    get_by_id(conn, &id)
}

pub fn update_caption(
    conn: &Connection,
    id: &str,
    caption: Option<&str>,
) -> Result<GalleryPhoto, String> {
    conn.execute(
        "UPDATE gallery_photos SET caption = ?1 WHERE id = ?2",
        params![caption, id],
    )
    .map_err(|e| e.to_string())?;

    get_by_id(conn, id)
}

pub fn toggle_star(conn: &Connection, id: &str) -> Result<bool, String> {
    crate::util::toggle_star(conn, "gallery_photos", id)
}

pub fn delete(conn: &Connection, id: &str) -> Result<(), String> {
    conn.execute("DELETE FROM gallery_photos WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}
