use crate::models::{StepSpruePart, SprueDepletionSummary};
use crate::util::now;
use rusqlite::{params, Connection};
use uuid::Uuid;

fn map_step_sprue_part(row: &rusqlite::Row) -> rusqlite::Result<StepSpruePart> {
    Ok(StepSpruePart {
        id: row.get(0)?,
        step_id: row.get(1)?,
        sprue_label: row.get(2)?,
        part_number: row.get(3)?,
        ai_detected: row.get(4)?,
        is_ticked: row.get(5)?,
        created_at: row.get(6)?,
    })
}

const SELECT_COLS: &str = "id, step_id, sprue_label, part_number, ai_detected, is_ticked, created_at";

pub fn list_for_step(conn: &Connection, step_id: &str) -> Result<Vec<StepSpruePart>, String> {
    let mut stmt = conn
        .prepare(&format!(
            "SELECT {SELECT_COLS} FROM step_sprue_parts WHERE step_id = ?1 ORDER BY sprue_label, part_number"
        ))
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map(params![step_id], |row| map_step_sprue_part(row))
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(rows)
}

pub fn list_for_project(conn: &Connection, project_id: &str) -> Result<Vec<StepSpruePart>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT ssp.id, ssp.step_id, ssp.sprue_label, ssp.part_number, ssp.ai_detected, ssp.is_ticked, ssp.created_at
             FROM step_sprue_parts ssp
             JOIN steps s ON s.id = ssp.step_id
             JOIN tracks t ON t.id = s.track_id
             WHERE t.project_id = ?1
             ORDER BY ssp.sprue_label, ssp.part_number",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map(params![project_id], |row| map_step_sprue_part(row))
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(rows)
}

pub fn add_part(
    conn: &Connection,
    step_id: &str,
    sprue_label: &str,
    part_number: Option<&str>,
    ai_detected: bool,
) -> Result<StepSpruePart, String> {
    let id = Uuid::new_v4().to_string();
    let ts = now();

    conn.execute(
        "INSERT OR IGNORE INTO step_sprue_parts (id, step_id, sprue_label, part_number, ai_detected, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![id, step_id, sprue_label, part_number, ai_detected as i32, ts],
    )
    .map_err(|e| e.to_string())?;

    // Return the row (may be the existing one if INSERT OR IGNORE skipped)
    let coalesced = part_number.unwrap_or("");
    conn.query_row(
        &format!("SELECT {SELECT_COLS} FROM step_sprue_parts WHERE step_id = ?1 AND sprue_label = ?2 AND COALESCE(part_number, '') = ?3"),
        params![step_id, sprue_label, coalesced],
        |row| map_step_sprue_part(row),
    )
    .map_err(|e| e.to_string())
}

pub fn remove_part(conn: &Connection, id: &str) -> Result<(), String> {
    conn.execute("DELETE FROM step_sprue_parts WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn set_ticked(conn: &Connection, id: &str, is_ticked: bool) -> Result<(), String> {
    conn.execute(
        "UPDATE step_sprue_parts SET is_ticked = ?1 WHERE id = ?2",
        params![is_ticked as i32, id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn remove_ai_detected_for_step(conn: &Connection, step_id: &str) -> Result<(), String> {
    conn.execute(
        "DELETE FROM step_sprue_parts WHERE step_id = ?1 AND ai_detected = 1",
        params![step_id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn depletion_summary(
    conn: &Connection,
    project_id: &str,
) -> Result<Vec<SprueDepletionSummary>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT ssp.sprue_label,
                    COUNT(DISTINCT COALESCE(ssp.part_number, '')) as parts_count
             FROM step_sprue_parts ssp
             JOIN steps s ON s.id = ssp.step_id
             JOIN tracks t ON t.id = s.track_id
             WHERE t.project_id = ?1
             GROUP BY ssp.sprue_label
             ORDER BY ssp.sprue_label",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map(params![project_id], |row| {
            Ok(SprueDepletionSummary {
                sprue_label: row.get(0)?,
                parts_used: row.get(1)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(rows)
}
