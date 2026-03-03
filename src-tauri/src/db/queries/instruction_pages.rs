use crate::models::InstructionPage;
use rusqlite::{params, Connection};
use uuid::Uuid;

pub fn list_by_source(conn: &Connection, source_id: &str) -> Result<Vec<InstructionPage>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT id, source_id, page_index, file_path, width, height
             FROM instruction_pages
             WHERE source_id = ?1
             ORDER BY page_index",
        )
        .map_err(|e| e.to_string())?;

    let pages = stmt
        .query_map(params![source_id], |row| {
            Ok(InstructionPage {
                id: row.get(0)?,
                source_id: row.get(1)?,
                page_index: row.get(2)?,
                file_path: row.get(3)?,
                width: row.get(4)?,
                height: row.get(5)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(pages)
}

pub fn insert_batch(
    conn: &Connection,
    source_id: &str,
    pages: &[(usize, String, u32, u32)], // (page_index, file_path, width, height)
) -> Result<Vec<InstructionPage>, String> {
    let mut result = Vec::with_capacity(pages.len());

    for (page_index, file_path, width, height) in pages {
        let id = Uuid::new_v4().to_string();
        conn.execute(
            "INSERT INTO instruction_pages (id, source_id, page_index, file_path, width, height)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![id, source_id, *page_index as i32, file_path, *width as i32, *height as i32],
        )
        .map_err(|e| e.to_string())?;

        result.push(InstructionPage {
            id,
            source_id: source_id.to_string(),
            page_index: *page_index as i32,
            file_path: file_path.clone(),
            width: *width as i32,
            height: *height as i32,
        });
    }

    Ok(result)
}

pub fn delete_by_source(conn: &Connection, source_id: &str) -> Result<(), String> {
    conn.execute(
        "DELETE FROM instruction_pages WHERE source_id = ?1",
        params![source_id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}
