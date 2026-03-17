use crate::models::KitFile;
use crate::util::now;
use rusqlite::{params, Connection};
use uuid::Uuid;

fn map_row(row: &rusqlite::Row) -> rusqlite::Result<KitFile> {
    Ok(KitFile {
        id: row.get(0)?,
        kit_id: row.get(1)?,
        file_path: row.get(2)?,
        file_type: row.get(3)?,
        label: row.get(4)?,
        display_order: row.get(5)?,
        source_kit_name: row.get(6)?,
        source_kit_year: row.get(7)?,
        created_at: row.get(8)?,
    })
}

pub fn list_by_kit(conn: &Connection, kit_id: &str) -> Result<Vec<KitFile>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT id, kit_id, file_path, file_type, label, display_order,
                    source_kit_name, source_kit_year, created_at
             FROM kit_files WHERE kit_id = ?1 ORDER BY display_order, created_at",
        )
        .map_err(|e| e.to_string())?;

    let files = stmt
        .query_map(params![kit_id], |row| map_row(row))
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
    insert_with_provenance(conn, kit_id, file_path, file_type, label, None, None)
}

pub fn insert_with_provenance(
    conn: &Connection,
    kit_id: &str,
    file_path: &str,
    file_type: &str,
    label: Option<&str>,
    source_kit_name: Option<&str>,
    source_kit_year: Option<&str>,
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
        "INSERT INTO kit_files (id, kit_id, file_path, file_type, label, display_order,
                                source_kit_name, source_kit_year, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        params![id, kit_id, file_path, file_type, label, order, source_kit_name, source_kit_year, ts],
    )
    .map_err(|e| e.to_string())?;

    Ok(KitFile {
        id,
        kit_id: kit_id.to_string(),
        file_path: file_path.to_string(),
        file_type: file_type.to_string(),
        label: label.map(|s| s.to_string()),
        display_order: order,
        source_kit_name: source_kit_name.map(|s| s.to_string()),
        source_kit_year: source_kit_year.map(|s| s.to_string()),
        created_at: ts,
    })
}

pub fn delete(conn: &Connection, file_id: &str) -> Result<(), String> {
    conn.execute("DELETE FROM kit_files WHERE id = ?1", params![file_id])
        .map_err(|e| e.to_string())?;
    Ok(())
}
