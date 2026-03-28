use crate::db::AppDb;
use crate::models::{SprueDepletionSummary, StepSpruePart};
use tauri::State;

#[tauri::command]
pub fn list_step_sprue_parts(
    db: State<'_, AppDb>,
    step_id: String,
) -> Result<Vec<StepSpruePart>, String> {
    let conn = db.conn()?;
    crate::db::queries::step_sprue_parts::list_for_step(&conn, &step_id)
}

#[tauri::command]
pub fn list_project_sprue_parts(
    db: State<'_, AppDb>,
    project_id: String,
) -> Result<Vec<StepSpruePart>, String> {
    let conn = db.conn()?;
    crate::db::queries::step_sprue_parts::list_for_project(&conn, &project_id)
}

#[tauri::command]
pub fn add_step_sprue_part(
    db: State<'_, AppDb>,
    step_id: String,
    sprue_label: String,
    part_number: Option<String>,
    ai_detected: Option<bool>,
) -> Result<StepSpruePart, String> {
    let conn = db.conn()?;
    crate::db::queries::step_sprue_parts::add_part(
        &conn,
        &step_id,
        &sprue_label,
        part_number.as_deref(),
        ai_detected.unwrap_or(false),
    )
}

#[tauri::command]
pub fn remove_step_sprue_part(db: State<'_, AppDb>, id: String) -> Result<(), String> {
    let conn = db.conn()?;
    crate::db::queries::step_sprue_parts::remove_part(&conn, &id)
}

#[tauri::command]
pub fn set_sprue_part_ticked(
    db: State<'_, AppDb>,
    id: String,
    is_ticked: bool,
) -> Result<(), String> {
    let conn = db.conn()?;
    crate::db::queries::step_sprue_parts::set_ticked(&conn, &id, is_ticked)
}

#[tauri::command]
pub fn remove_ai_sprue_parts_for_step(
    db: State<'_, AppDb>,
    step_id: String,
) -> Result<(), String> {
    let conn = db.conn()?;
    crate::db::queries::step_sprue_parts::remove_ai_detected_for_step(&conn, &step_id)
}

#[tauri::command]
pub fn sprue_depletion_summary(
    db: State<'_, AppDb>,
    project_id: String,
) -> Result<Vec<SprueDepletionSummary>, String> {
    let conn = db.conn()?;
    crate::db::queries::step_sprue_parts::depletion_summary(&conn, &project_id)
}
