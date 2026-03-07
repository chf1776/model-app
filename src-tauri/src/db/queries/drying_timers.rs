use crate::models::{CreateDryingTimerInput, DryingTimer};
use crate::util::now;
use rusqlite::{params, Connection};
use uuid::Uuid;

fn map_row(row: &rusqlite::Row) -> rusqlite::Result<DryingTimer> {
    Ok(DryingTimer {
        id: row.get(0)?,
        step_id: row.get(1)?,
        label: row.get(2)?,
        duration_min: row.get(3)?,
        started_at: row.get(4)?,
    })
}

const SELECT_COLS: &str = "id, step_id, label, duration_min, started_at";

pub fn list_active(conn: &Connection) -> Result<Vec<DryingTimer>, String> {
    let mut stmt = conn
        .prepare(&format!(
            "SELECT {SELECT_COLS} FROM drying_timers ORDER BY started_at"
        ))
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |row| map_row(row))
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(rows)
}

pub fn insert(conn: &Connection, input: &CreateDryingTimerInput) -> Result<DryingTimer, String> {
    let id = Uuid::new_v4().to_string();
    let ts = now();

    conn.execute(
        "INSERT INTO drying_timers (id, step_id, label, duration_min, started_at)
         VALUES (?1, ?2, ?3, ?4, ?5)",
        params![id, input.step_id, input.label, input.duration_min, ts],
    )
    .map_err(|e| e.to_string())?;

    conn.query_row(
        &format!("SELECT {SELECT_COLS} FROM drying_timers WHERE id = ?1"),
        params![id],
        |row| map_row(row),
    )
    .map_err(|e| e.to_string())
}

pub fn delete(conn: &Connection, id: &str) -> Result<(), String> {
    conn.execute("DELETE FROM drying_timers WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}
