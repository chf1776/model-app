use crate::models::Paint;
use crate::util::now;
use rusqlite::{params, Connection};
use serde::Serialize;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize)]
pub struct PaletteMapping {
    pub paint_id: String,
    pub project_id: String,
    pub project_name: String,
}

/// Returns distinct (paint_id, project_id, project_name) pairs for all palette entries
/// that reference a paint.
pub fn list_all_paint_mappings(conn: &Connection) -> Result<Vec<PaletteMapping>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT pe.paint_id, pe.project_id, p.name
             FROM palette_entries pe
             JOIN projects p ON pe.project_id = p.id
             WHERE pe.paint_id IS NOT NULL
             GROUP BY pe.paint_id, pe.project_id
             ORDER BY p.name",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |row| {
            Ok(PaletteMapping {
                paint_id: row.get(0)?,
                project_id: row.get(1)?,
                project_name: row.get(2)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(rows)
}

pub fn list_paints_for_project(conn: &Connection, project_id: &str) -> Result<Vec<Paint>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT p.id, p.brand, p.name, p.reference_code, p.paint_type, p.finish, p.color,
                    p.color_family, p.status, p.price, p.currency, p.buy_url, p.price_updated_at,
                    p.notes, p.created_at, p.updated_at
             FROM paints p
             JOIN palette_entries pe ON pe.paint_id = p.id
             WHERE pe.project_id = ?1
             GROUP BY p.id
             ORDER BY p.name",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map(params![project_id], |row| super::paints::row_to_paint(row))
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(rows)
}

/// Syncs palette_entries for a given paint: removes entries for unlinked projects,
/// inserts simple entries (is_formula=0) for newly linked projects.
pub fn set_projects_for_paint(
    conn: &Connection,
    paint_id: &str,
    paint_name: &str,
    project_ids: &[String],
) -> Result<(), String> {
    if project_ids.is_empty() {
        // Remove all entries for this paint
        conn.execute(
            "DELETE FROM palette_entries WHERE paint_id = ?1",
            params![paint_id],
        )
        .map_err(|e| e.to_string())?;
        return Ok(());
    }

    // Build comma-separated placeholders for the IN clause
    let placeholders: Vec<String> = project_ids.iter().enumerate().map(|(i, _)| format!("?{}", i + 2)).collect();
    let in_clause = placeholders.join(", ");

    // Delete entries for projects no longer linked
    let delete_sql = format!(
        "DELETE FROM palette_entries WHERE paint_id = ?1 AND project_id NOT IN ({in_clause})"
    );
    let mut delete_params: Vec<Box<dyn rusqlite::types::ToSql>> = Vec::new();
    delete_params.push(Box::new(paint_id.to_string()));
    for pid in project_ids {
        delete_params.push(Box::new(pid.clone()));
    }
    let param_refs: Vec<&dyn rusqlite::types::ToSql> = delete_params.iter().map(|p| p.as_ref()).collect();
    conn.execute(&delete_sql, param_refs.as_slice())
        .map_err(|e| e.to_string())?;

    // Get existing project_ids for this paint
    let existing_placeholders = placeholders.join(", ");
    let existing_sql = format!(
        "SELECT DISTINCT project_id FROM palette_entries WHERE paint_id = ?1 AND project_id IN ({existing_placeholders})"
    );
    let mut existing_stmt = conn.prepare(&existing_sql).map_err(|e| e.to_string())?;
    let existing: std::collections::HashSet<String> = existing_stmt
        .query_map(param_refs.as_slice(), |row| row.get::<_, String>(0))
        .map_err(|e| e.to_string())?
        .collect::<Result<std::collections::HashSet<_>, _>>()
        .map_err(|e| e.to_string())?;

    // Insert new entries for projects not already linked
    let ts = now();
    for pid in project_ids {
        if !existing.contains(pid) {
            let id = Uuid::new_v4().to_string();
            conn.execute(
                "INSERT INTO palette_entries (id, project_id, name, is_formula, paint_id, display_order, created_at, updated_at)
                 VALUES (?1, ?2, ?3, 0, ?4, 0, ?5, ?6)",
                params![id, pid, paint_name, paint_id, ts, ts],
            )
            .map_err(|e| e.to_string())?;
        }
    }

    Ok(())
}
