use crate::db::AppDb;
use crate::models::{CreateTrackInput, Track, UpdateTrackInput};
use tauri::State;

#[tauri::command]
pub fn list_tracks(db: State<'_, AppDb>, project_id: String) -> Result<Vec<Track>, String> {
    let conn = db.conn()?;
    crate::db::queries::tracks::list_by_project(&conn, &project_id)
}

#[tauri::command]
pub fn create_track(db: State<'_, AppDb>, input: CreateTrackInput) -> Result<Track, String> {
    let conn = db.conn()?;
    crate::db::queries::tracks::insert(&conn, input)
}

#[tauri::command]
pub fn update_track(db: State<'_, AppDb>, input: UpdateTrackInput) -> Result<Track, String> {
    let conn = db.conn()?;
    crate::db::queries::tracks::update(&conn, input)
}

#[tauri::command]
pub fn delete_track(db: State<'_, AppDb>, id: String) -> Result<(), String> {
    let conn = db.conn()?;
    crate::db::queries::tracks::delete(&conn, &id)
}

#[tauri::command]
pub fn set_track_join_point(
    db: State<'_, AppDb>,
    id: String,
    join_point_step_id: Option<String>,
    join_point_notes: Option<String>,
) -> Result<Track, String> {
    let conn = db.conn()?;
    crate::db::queries::tracks::set_join_point(
        &conn,
        &id,
        join_point_step_id.as_deref(),
        join_point_notes.as_deref(),
    )
}

#[tauri::command]
pub fn reorder_tracks(
    db: State<'_, AppDb>,
    project_id: String,
    ordered_ids: Vec<String>,
) -> Result<(), String> {
    let conn = db.conn()?;
    crate::db::queries::tracks::reorder(&conn, &project_id, ordered_ids)
}
