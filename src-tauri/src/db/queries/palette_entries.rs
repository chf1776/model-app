use crate::models::{Paint, PaletteEntry, PaletteComponent, CreatePaletteEntryInput, UpdatePaletteEntryInput, PaletteComponentInput};
use crate::util::now;
use rusqlite::{params, Connection};
use serde::Serialize;
use std::collections::HashMap;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize)]
pub struct PaletteMapping {
    pub paint_id: String,
    pub project_id: String,
    pub project_name: String,
}

// ── Row mappers ────────────────────────────────────────────────────────────

fn map_entry_row(row: &rusqlite::Row) -> rusqlite::Result<PaletteEntry> {
    Ok(PaletteEntry {
        id: row.get(0)?,
        project_id: row.get(1)?,
        name: row.get(2)?,
        purpose: row.get(3)?,
        is_formula: row.get(4)?,
        paint_id: row.get(5)?,
        mixing_notes: row.get(6)?,
        display_order: row.get(7)?,
        created_at: row.get(8)?,
        updated_at: row.get(9)?,
        paint_brand: row.get(10)?,
        paint_color: row.get(11)?,
        paint_type: row.get(12)?,
        paint_status: row.get(13)?,
        components: Vec::new(),
    })
}

fn map_component_row(row: &rusqlite::Row) -> rusqlite::Result<PaletteComponent> {
    Ok(PaletteComponent {
        id: row.get(0)?,
        palette_entry_id: row.get(1)?,
        paint_id: row.get(2)?,
        ratio_parts: row.get(3)?,
        percentage: row.get(4)?,
        display_order: row.get(5)?,
        paint_brand: row.get(6)?,
        paint_name: row.get(7)?,
        paint_color: row.get(8)?,
        paint_reference_code: row.get(9)?,
    })
}

const ENTRY_SELECT: &str =
    "SELECT pe.id, pe.project_id, pe.name, pe.purpose, pe.is_formula, pe.paint_id,
            pe.mixing_notes, pe.display_order, pe.created_at, pe.updated_at,
            p.brand, p.color, p.paint_type, p.status
     FROM palette_entries pe
     LEFT JOIN paints p ON pe.paint_id = p.id";

const COMPONENT_SELECT: &str =
    "SELECT pc.id, pc.palette_entry_id, pc.paint_id, pc.ratio_parts, pc.percentage,
            pc.display_order, p.brand, p.name, p.color, p.reference_code
     FROM palette_components pc
     JOIN paints p ON pc.paint_id = p.id";

// ── New CRUD functions ──────────────────────────────────────────────────────

pub fn list_by_project(conn: &Connection, project_id: &str) -> Result<Vec<PaletteEntry>, String> {
    let sql = format!("{ENTRY_SELECT} WHERE pe.project_id = ?1 ORDER BY pe.display_order, pe.created_at");
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    let mut entries: Vec<PaletteEntry> = stmt
        .query_map(params![project_id], |row| map_entry_row(row))
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    if entries.is_empty() {
        return Ok(entries);
    }

    // Fetch all components for these entries
    let entry_ids: Vec<String> = entries.iter().map(|e| e.id.clone()).collect();
    let placeholders: String = entry_ids.iter().enumerate().map(|(i, _)| format!("?{}", i + 1)).collect::<Vec<_>>().join(", ");
    let comp_sql = format!("{COMPONENT_SELECT} WHERE pc.palette_entry_id IN ({placeholders}) ORDER BY pc.display_order");
    let mut comp_stmt = conn.prepare(&comp_sql).map_err(|e| e.to_string())?;
    let comp_params: Vec<Box<dyn rusqlite::types::ToSql>> = entry_ids.iter().map(|id| Box::new(id.clone()) as Box<dyn rusqlite::types::ToSql>).collect();
    let param_refs: Vec<&dyn rusqlite::types::ToSql> = comp_params.iter().map(|p| p.as_ref()).collect();
    let components: Vec<PaletteComponent> = comp_stmt
        .query_map(param_refs.as_slice(), |row| map_component_row(row))
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    // Group components by entry_id
    let mut comp_map: HashMap<String, Vec<PaletteComponent>> = HashMap::new();
    for c in components {
        comp_map.entry(c.palette_entry_id.clone()).or_default().push(c);
    }
    for entry in &mut entries {
        if let Some(comps) = comp_map.remove(&entry.id) {
            entry.components = comps;
        }
    }

    Ok(entries)
}

pub fn get_by_id(conn: &Connection, id: &str) -> Result<PaletteEntry, String> {
    let sql = format!("{ENTRY_SELECT} WHERE pe.id = ?1");
    let mut entry: PaletteEntry = conn
        .query_row(&sql, params![id], |row| map_entry_row(row))
        .map_err(|e| e.to_string())?;

    let comp_sql = format!("{COMPONENT_SELECT} WHERE pc.palette_entry_id = ?1 ORDER BY pc.display_order");
    let mut comp_stmt = conn.prepare(&comp_sql).map_err(|e| e.to_string())?;
    entry.components = comp_stmt
        .query_map(params![id], |row| map_component_row(row))
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(entry)
}

pub fn insert(conn: &Connection, input: CreatePaletteEntryInput) -> Result<PaletteEntry, String> {
    let id = Uuid::new_v4().to_string();
    let ts = now();

    let max_order: i32 = conn
        .query_row(
            "SELECT COALESCE(MAX(display_order), -1) FROM palette_entries WHERE project_id = ?1",
            params![input.project_id],
            |row| row.get(0),
        )
        .unwrap_or(-1);

    conn.execute(
        "INSERT INTO palette_entries (id, project_id, name, purpose, is_formula, paint_id, mixing_notes, display_order, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
        params![
            id,
            input.project_id,
            input.name,
            input.purpose,
            input.is_formula,
            input.paint_id,
            input.mixing_notes,
            max_order + 1,
            ts,
            ts,
        ],
    )
    .map_err(|e| e.to_string())?;

    get_by_id(conn, &id)
}

pub fn update(conn: &Connection, input: UpdatePaletteEntryInput) -> Result<PaletteEntry, String> {
    // Fetch current scalar fields only (no component query needed for merge)
    let sql = format!("{ENTRY_SELECT} WHERE pe.id = ?1");
    let existing: PaletteEntry = conn
        .query_row(&sql, params![input.id], |row| map_entry_row(row))
        .map_err(|e| e.to_string())?;

    let name = input.name.unwrap_or(existing.name);
    let purpose = input.purpose.or(existing.purpose);
    let mixing_notes = input.mixing_notes.or(existing.mixing_notes);

    conn.execute(
        "UPDATE palette_entries SET name = ?1, purpose = ?2, mixing_notes = ?3 WHERE id = ?4",
        params![name, purpose, mixing_notes, input.id],
    )
    .map_err(|e| e.to_string())?;

    get_by_id(conn, &input.id)
}

pub fn delete(conn: &Connection, id: &str) -> Result<(), String> {
    conn.execute("DELETE FROM palette_entries WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn set_components(
    conn: &Connection,
    entry_id: &str,
    components: &[PaletteComponentInput],
) -> Result<Vec<PaletteComponent>, String> {
    conn.execute_batch("BEGIN").map_err(|e| e.to_string())?;

    let result = (|| {
        conn.execute(
            "DELETE FROM palette_components WHERE palette_entry_id = ?1",
            params![entry_id],
        )
        .map_err(|e| e.to_string())?;

        for (i, c) in components.iter().enumerate() {
            let id = Uuid::new_v4().to_string();
            conn.execute(
                "INSERT INTO palette_components (id, palette_entry_id, paint_id, ratio_parts, percentage, display_order)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
                params![id, entry_id, c.paint_id, c.ratio_parts, c.percentage, i as i32],
            )
            .map_err(|e| e.to_string())?;
        }
        Ok(())
    })();

    match result {
        Ok(()) => {
            conn.execute_batch("COMMIT").map_err(|e| e.to_string())?;
        }
        Err(e) => {
            let _ = conn.execute_batch("ROLLBACK");
            return Err(e);
        }
    }

    let comp_sql = format!("{COMPONENT_SELECT} WHERE pc.palette_entry_id = ?1 ORDER BY pc.display_order");
    let mut stmt = conn.prepare(&comp_sql).map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map(params![entry_id], |row| map_component_row(row))
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(rows)
}

// ── Existing functions (Collection zone) ────────────────────────────────────

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
