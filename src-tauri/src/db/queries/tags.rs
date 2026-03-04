use crate::models::Tag;
use crate::util::now;
use rusqlite::Connection;
use uuid::Uuid;

fn map_tag(row: &rusqlite::Row) -> rusqlite::Result<Tag> {
    Ok(Tag {
        id: row.get(0)?,
        name: row.get(1)?,
        created_at: row.get(2)?,
    })
}

pub fn list_all(conn: &Connection) -> Result<Vec<Tag>, String> {
    let mut stmt = conn
        .prepare("SELECT id, name, created_at FROM tags ORDER BY name")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |row| map_tag(row))
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())
}

/// Returns the tag for the given name, creating it if it doesn't exist.
pub fn ensure_tag(conn: &Connection, name: &str) -> Result<Tag, String> {
    let existing: Option<Tag> = conn
        .query_row(
            "SELECT id, name, created_at FROM tags WHERE name = ?1",
            [name],
            |row| map_tag(row),
        )
        .ok();

    if let Some(tag) = existing {
        return Ok(tag);
    }

    let id = Uuid::new_v4().to_string();
    let ts = now();
    conn.execute(
        "INSERT INTO tags (id, name, created_at) VALUES (?1, ?2, ?3)",
        rusqlite::params![id, name, ts],
    )
    .map_err(|e| e.to_string())?;

    Ok(Tag {
        id,
        name: name.to_string(),
        created_at: ts,
    })
}

pub fn list_for_step(conn: &Connection, step_id: &str) -> Result<Vec<Tag>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT t.id, t.name, t.created_at
             FROM tags t
             JOIN step_tags st ON st.tag_id = t.id
             WHERE st.step_id = ?1
             ORDER BY t.name",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([step_id], |row| map_tag(row))
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())
}

/// Replace all tags for a step with the given tag names.
pub fn set_step_tags(conn: &Connection, step_id: &str, tag_names: Vec<String>) -> Result<Vec<Tag>, String> {
    conn.execute("DELETE FROM step_tags WHERE step_id = ?1", [step_id])
        .map_err(|e| e.to_string())?;

    let mut tags = Vec::new();
    for name in tag_names {
        let tag = ensure_tag(conn, &name)?;
        conn.execute(
            "INSERT OR IGNORE INTO step_tags (step_id, tag_id) VALUES (?1, ?2)",
            rusqlite::params![step_id, tag.id],
        )
        .map_err(|e| e.to_string())?;
        tags.push(tag);
    }
    tags.sort_by(|a, b| a.name.cmp(&b.name));
    Ok(tags)
}
