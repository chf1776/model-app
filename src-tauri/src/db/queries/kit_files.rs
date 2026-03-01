use crate::models::KitFile;
use rusqlite::{params, Connection};
use std::time::{SystemTime, UNIX_EPOCH};
use uuid::Uuid;

fn now() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs() as i64
}

pub fn list_by_kit(conn: &Connection, kit_id: &str) -> Result<Vec<KitFile>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT id, kit_id, file_path, file_type, label, display_order, created_at
             FROM kit_files WHERE kit_id = ?1 ORDER BY display_order, created_at",
        )
        .map_err(|e| e.to_string())?;

    let files = stmt
        .query_map(params![kit_id], |row| {
            Ok(KitFile {
                id: row.get(0)?,
                kit_id: row.get(1)?,
                file_path: row.get(2)?,
                file_type: row.get(3)?,
                label: row.get(4)?,
                display_order: row.get(5)?,
                created_at: row.get(6)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(files)
}

pub fn insert(
    conn: &Connection,
    kit_id: &str,
    file_path: &str,
    file_type: &str,
    label: Option<&str>,
) -> Result<KitFile, String> {
    let id = Uuid::new_v4().to_string();
    let ts = now();

    // Get next display_order
    let order: i32 = conn
        .query_row(
            "SELECT COALESCE(MAX(display_order), -1) + 1 FROM kit_files WHERE kit_id = ?1",
            params![kit_id],
            |row| row.get(0),
        )
        .unwrap_or(0);

    conn.execute(
        "INSERT INTO kit_files (id, kit_id, file_path, file_type, label, display_order, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![id, kit_id, file_path, file_type, label, order, ts],
    )
    .map_err(|e| e.to_string())?;

    Ok(KitFile {
        id,
        kit_id: kit_id.to_string(),
        file_path: file_path.to_string(),
        file_type: file_type.to_string(),
        label: label.map(|s| s.to_string()),
        display_order: order,
        created_at: ts,
    })
}

pub fn delete(conn: &Connection, file_id: &str) -> Result<(), String> {
    conn.execute("DELETE FROM kit_files WHERE id = ?1", params![file_id])
        .map_err(|e| e.to_string())?;
    Ok(())
}
