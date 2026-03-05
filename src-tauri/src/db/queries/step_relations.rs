use crate::models::StepRelation;
use rusqlite::{params, Connection};
use uuid::Uuid;

fn map_relation(row: &rusqlite::Row) -> rusqlite::Result<StepRelation> {
    Ok(StepRelation {
        id: row.get(0)?,
        from_step_id: row.get(1)?,
        to_step_id: row.get(2)?,
        relation_type: row.get(3)?,
    })
}

/// Returns all relations where the step is either `from_step_id` or `to_step_id`.
pub fn list_for_step(conn: &Connection, step_id: &str) -> Result<Vec<StepRelation>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT id, from_step_id, to_step_id, relation_type
             FROM step_relations
             WHERE from_step_id = ?1 OR to_step_id = ?1
             ORDER BY relation_type, id",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map(params![step_id], |row| map_relation(row))
        .map_err(|e| e.to_string())?;

    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())
}

/// Replace all relations where `from_step_id = step_id` with the given list.
pub fn set_step_relations(
    conn: &Connection,
    step_id: &str,
    relations: Vec<(String, String)>, // (target_step_id, relation_type)
) -> Result<Vec<StepRelation>, String> {
    conn.execute(
        "DELETE FROM step_relations WHERE from_step_id = ?1",
        params![step_id],
    )
    .map_err(|e| e.to_string())?;

    for (target_step_id, relation_type) in relations {
        let id = Uuid::new_v4().to_string();
        conn.execute(
            "INSERT OR IGNORE INTO step_relations (id, from_step_id, to_step_id, relation_type)
             VALUES (?1, ?2, ?3, ?4)",
            params![id, step_id, target_step_id, relation_type],
        )
        .map_err(|e| e.to_string())?;
    }

    list_for_step(conn, step_id)
}
