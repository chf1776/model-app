use crate::models::{CreateTrackInput, Track, UpdateTrackInput};
use crate::util::now;
use rusqlite::{params, Connection};
use uuid::Uuid;

const TRACK_COLORS: &[&str] = &[
    "#C2553A", // Terracotta
    "#3A7CA5", // Steel Blue
    "#5B8A3C", // Olive
    "#C49A2A", // Gold
    "#7B5EA7", // Purple
    "#C47A2A", // Burnt Orange
    "#2A8A7A", // Teal
    "#8B5E6B", // Mauve
];

fn map_track(row: &rusqlite::Row) -> rusqlite::Result<Track> {
    Ok(Track {
        id: row.get(0)?,
        project_id: row.get(1)?,
        name: row.get(2)?,
        color: row.get(3)?,
        display_order: row.get(4)?,
        is_standalone: row.get(5)?,
        join_point_step_id: row.get(6)?,
        join_point_notes: row.get(7)?,
        step_count: row.get(8)?,
        completed_count: row.get(9)?,
        created_at: row.get(10)?,
        updated_at: row.get(11)?,
    })
}

const SELECT_COLS: &str =
    "t.id, t.project_id, t.name, t.color, t.display_order, t.is_standalone,
     t.join_point_step_id, t.join_point_notes,
     (SELECT COUNT(*) FROM steps s WHERE s.track_id = t.id
       AND NOT EXISTS (SELECT 1 FROM steps r WHERE r.replaces_step_id = s.id)) AS step_count,
     (SELECT COUNT(*) FROM steps s WHERE s.track_id = t.id AND s.is_completed = 1
       AND NOT EXISTS (SELECT 1 FROM steps r WHERE r.replaces_step_id = s.id)) AS completed_count,
     t.created_at, t.updated_at";

pub fn list_by_project(conn: &Connection, project_id: &str) -> Result<Vec<Track>, String> {
    let mut stmt = conn
        .prepare(&format!(
            "SELECT {SELECT_COLS} FROM tracks t WHERE t.project_id = ?1 ORDER BY t.display_order"
        ))
        .map_err(|e| e.to_string())?;

    let tracks = stmt
        .query_map(params![project_id], |row| map_track(row))
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(tracks)
}

pub fn get_by_id(conn: &Connection, id: &str) -> Result<Track, String> {
    conn.query_row(
        &format!("SELECT {SELECT_COLS} FROM tracks t WHERE t.id = ?1"),
        params![id],
        |row| map_track(row),
    )
    .map_err(|e| e.to_string())
}

fn pick_color(conn: &Connection, project_id: &str) -> String {
    let used: Vec<String> = conn
        .prepare("SELECT color FROM tracks WHERE project_id = ?1")
        .and_then(|mut stmt| {
            stmt.query_map(params![project_id], |row| row.get(0))
                .map(|rows| rows.filter_map(|r| r.ok()).collect())
        })
        .unwrap_or_default();

    for color in TRACK_COLORS {
        if !used.iter().any(|c| c.eq_ignore_ascii_case(color)) {
            return color.to_string();
        }
    }
    // All used — cycle based on count
    TRACK_COLORS[used.len() % TRACK_COLORS.len()].to_string()
}

pub fn insert(conn: &Connection, input: CreateTrackInput) -> Result<Track, String> {
    let id = Uuid::new_v4().to_string();
    let ts = now();

    let color = input.color.unwrap_or_else(|| pick_color(conn, &input.project_id));

    let max_order: i32 = conn
        .query_row(
            "SELECT COALESCE(MAX(display_order), -1) FROM tracks WHERE project_id = ?1",
            params![input.project_id],
            |row| row.get(0),
        )
        .unwrap_or(-1);

    conn.execute(
        "INSERT INTO tracks (id, project_id, name, color, display_order, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![id, input.project_id, input.name, color, max_order + 1, ts, ts],
    )
    .map_err(|e| e.to_string())?;

    get_by_id(conn, &id)
}

pub fn update(conn: &Connection, input: UpdateTrackInput) -> Result<Track, String> {
    let existing = get_by_id(conn, &input.id)?;
    let ts = now();

    let name = input.name.unwrap_or(existing.name);
    let color = input.color.unwrap_or(existing.color);

    conn.execute(
        "UPDATE tracks SET name = ?1, color = ?2, updated_at = ?3 WHERE id = ?4",
        params![name, color, ts, input.id],
    )
    .map_err(|e| e.to_string())?;

    get_by_id(conn, &input.id)
}

pub fn delete(conn: &Connection, id: &str) -> Result<(), String> {
    conn.execute("DELETE FROM tracks WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn set_join_point(
    conn: &Connection,
    id: &str,
    join_point_step_id: Option<&str>,
    join_point_notes: Option<&str>,
) -> Result<Track, String> {
    let ts = now();
    conn.execute(
        "UPDATE tracks SET join_point_step_id = ?1, join_point_notes = ?2, updated_at = ?3 WHERE id = ?4",
        params![join_point_step_id, join_point_notes, ts, id],
    )
    .map_err(|e| e.to_string())?;
    get_by_id(conn, id)
}

pub fn reorder(conn: &Connection, project_id: &str, ordered_ids: Vec<String>) -> Result<(), String> {
    let ts = now();
    for (i, id) in ordered_ids.iter().enumerate() {
        conn.execute(
            "UPDATE tracks SET display_order = ?1, updated_at = ?2 WHERE id = ?3 AND project_id = ?4",
            params![i as i32, ts, id, project_id],
        )
        .map_err(|e| e.to_string())?;
    }
    Ok(())
}
