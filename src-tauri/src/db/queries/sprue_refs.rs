use crate::models::SprueRef;
use crate::util::now;
use rusqlite::{params, Connection};
use uuid::Uuid;

fn map_sprue_ref(row: &rusqlite::Row) -> rusqlite::Result<SprueRef> {
    Ok(SprueRef {
        id: row.get(0)?,
        project_id: row.get(1)?,
        source_page_id: row.get(2)?,
        crop_x: row.get(3)?,
        crop_y: row.get(4)?,
        crop_w: row.get(5)?,
        crop_h: row.get(6)?,
        polygon_points: row.get(7)?,
        label: row.get(8)?,
        color: row.get(9)?,
        display_order: row.get(10)?,
        created_at: row.get(11)?,
    })
}

const SELECT_COLS: &str =
    "id, project_id, source_page_id, crop_x, crop_y, crop_w, crop_h, polygon_points, label, color, display_order, created_at";

pub fn list_for_project(conn: &Connection, project_id: &str) -> Result<Vec<SprueRef>, String> {
    let mut stmt = conn
        .prepare(&format!(
            "SELECT {SELECT_COLS} FROM sprue_refs WHERE project_id = ?1 ORDER BY display_order"
        ))
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map(params![project_id], |row| map_sprue_ref(row))
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(rows)
}

pub fn get_by_id(conn: &Connection, id: &str) -> Result<SprueRef, String> {
    conn.query_row(
        &format!("SELECT {SELECT_COLS} FROM sprue_refs WHERE id = ?1"),
        params![id],
        |row| map_sprue_ref(row),
    )
    .map_err(|e| e.to_string())
}

pub fn insert(
    conn: &Connection,
    project_id: &str,
    source_page_id: Option<&str>,
    crop_x: Option<f64>,
    crop_y: Option<f64>,
    crop_w: Option<f64>,
    crop_h: Option<f64>,
    polygon_points: Option<&str>,
    label: &str,
    color: &str,
) -> Result<SprueRef, String> {
    let id = Uuid::new_v4().to_string();
    let ts = now();

    let max_order: i32 = conn
        .query_row(
            "SELECT COALESCE(MAX(display_order), -1) FROM sprue_refs WHERE project_id = ?1",
            params![project_id],
            |row| row.get(0),
        )
        .unwrap_or(-1);

    conn.execute(
        "INSERT INTO sprue_refs (id, project_id, source_page_id, crop_x, crop_y, crop_w, crop_h, polygon_points, label, color, display_order, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)",
        params![id, project_id, source_page_id, crop_x, crop_y, crop_w, crop_h, polygon_points, label, color, max_order + 1, ts],
    )
    .map_err(|e| e.to_string())?;

    get_by_id(conn, &id)
}

pub fn update(
    conn: &Connection,
    id: &str,
    source_page_id: Option<Option<&str>>,
    crop_x: Option<f64>,
    crop_y: Option<f64>,
    crop_w: Option<f64>,
    crop_h: Option<f64>,
    polygon_points: Option<Option<&str>>,
    label: Option<&str>,
    color: Option<&str>,
) -> Result<SprueRef, String> {
    let current = get_by_id(conn, id)?;

    let source_page_id = match source_page_id {
        Some(v) => v.map(|s| s.to_string()),
        None => current.source_page_id,
    };
    let crop_x = crop_x.or(current.crop_x);
    let crop_y = crop_y.or(current.crop_y);
    let crop_w = crop_w.or(current.crop_w);
    let crop_h = crop_h.or(current.crop_h);
    let polygon_points = match polygon_points {
        Some(v) => v.map(|s| s.to_string()),
        None => current.polygon_points,
    };
    let label = label.unwrap_or(&current.label);
    let color = color.unwrap_or(&current.color);

    conn.execute(
        "UPDATE sprue_refs SET source_page_id = ?1, crop_x = ?2, crop_y = ?3, crop_w = ?4, crop_h = ?5, polygon_points = ?6, label = ?7, color = ?8 WHERE id = ?9",
        params![source_page_id, crop_x, crop_y, crop_w, crop_h, polygon_points, label, color, id],
    )
    .map_err(|e| e.to_string())?;

    get_by_id(conn, id)
}

pub fn delete(conn: &Connection, id: &str) -> Result<(), String> {
    conn.execute("DELETE FROM sprue_refs WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

/// Get the next auto-assigned color for a project's sprues.
pub fn get_next_color(conn: &Connection, project_id: &str) -> Result<String, String> {
    let count: i32 = conn
        .query_row(
            "SELECT COUNT(*) FROM sprue_refs WHERE project_id = ?1",
            params![project_id],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    const SPRUE_COLORS: &[&str] = &[
        "#3A7CA5", "#C47A2A", "#5B8A3C", "#7B5EA7", "#C2553A", "#2A8A7A", "#C49A2A", "#8B5E6B",
    ];

    Ok(SPRUE_COLORS[count as usize % SPRUE_COLORS.len()].to_string())
}
