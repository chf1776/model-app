use crate::models::ProjectUiState;
use crate::util::now;
use rusqlite::{params, Connection};

pub fn get_or_create(conn: &Connection, project_id: &str) -> Result<ProjectUiState, String> {
    let ts = now();

    conn.execute(
        "INSERT OR IGNORE INTO project_ui_state (project_id, updated_at)
         VALUES (?1, ?2)",
        params![project_id, ts],
    )
    .map_err(|e| e.to_string())?;

    conn.query_row(
        "SELECT project_id, active_step_id, active_track_id, build_mode, nav_mode,
                build_view, image_zoom, image_pan_x, image_pan_y, sprue_panel_open, updated_at
         FROM project_ui_state WHERE project_id = ?1",
        params![project_id],
        |row| {
            Ok(ProjectUiState {
                project_id: row.get(0)?,
                active_step_id: row.get(1)?,
                active_track_id: row.get(2)?,
                build_mode: row.get(3)?,
                nav_mode: row.get(4)?,
                build_view: row.get(5)?,
                image_zoom: row.get(6)?,
                image_pan_x: row.get(7)?,
                image_pan_y: row.get(8)?,
                sprue_panel_open: row.get(9)?,
                updated_at: row.get(10)?,
            })
        },
    )
    .map_err(|e| e.to_string())
}

pub fn save_active_track(
    conn: &Connection,
    project_id: &str,
    active_track_id: Option<&str>,
) -> Result<(), String> {
    let ts = now();
    conn.execute(
        "UPDATE project_ui_state SET active_track_id = ?1, updated_at = ?2
         WHERE project_id = ?3",
        params![active_track_id, ts, project_id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn save_sprue_panel_open(
    conn: &Connection,
    project_id: &str,
    open: bool,
) -> Result<(), String> {
    let ts = now();
    conn.execute(
        "UPDATE project_ui_state SET sprue_panel_open = ?1, updated_at = ?2
         WHERE project_id = ?3",
        params![open, ts, project_id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn save_build_view(
    conn: &Connection,
    project_id: &str,
    build_view: &str,
) -> Result<(), String> {
    let ts = now();
    conn.execute(
        "UPDATE project_ui_state SET build_view = ?1, updated_at = ?2
         WHERE project_id = ?3",
        params![build_view, ts, project_id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn save_view_state(
    conn: &Connection,
    project_id: &str,
    zoom: f64,
    pan_x: f64,
    pan_y: f64,
) -> Result<(), String> {
    let ts = now();

    conn.execute(
        "UPDATE project_ui_state SET image_zoom = ?1, image_pan_x = ?2, image_pan_y = ?3, updated_at = ?4
         WHERE project_id = ?5",
        params![zoom, pan_x, pan_y, ts, project_id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

