use crate::models::StepPaintRefInfo;
use rusqlite::Connection;

pub fn list_for_step(conn: &Connection, step_id: &str) -> Result<Vec<String>, String> {
    let mut stmt = conn
        .prepare("SELECT palette_entry_id FROM step_paint_refs WHERE step_id = ?1")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([step_id], |row| row.get::<_, String>(0))
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())
}

pub fn set_for_step(
    conn: &Connection,
    step_id: &str,
    entry_ids: Vec<String>,
) -> Result<Vec<String>, String> {
    conn.execute("DELETE FROM step_paint_refs WHERE step_id = ?1", [step_id])
        .map_err(|e| e.to_string())?;

    for entry_id in &entry_ids {
        conn.execute(
            "INSERT OR IGNORE INTO step_paint_refs (step_id, palette_entry_id) VALUES (?1, ?2)",
            rusqlite::params![step_id, entry_id],
        )
        .map_err(|e| e.to_string())?;
    }

    list_for_step(conn, step_id)
}

pub fn list_for_project(
    conn: &Connection,
    project_id: &str,
) -> Result<Vec<StepPaintRefInfo>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT spr.palette_entry_id, spr.step_id, s.title
             FROM step_paint_refs spr
             JOIN steps s ON s.id = spr.step_id
             JOIN tracks t ON t.id = s.track_id
             WHERE t.project_id = ?1
             ORDER BY spr.palette_entry_id, s.display_order",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([project_id], |row| {
            Ok(StepPaintRefInfo {
                palette_entry_id: row.get(0)?,
                step_id: row.get(1)?,
                step_title: row.get(2)?,
            })
        })
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())
}
