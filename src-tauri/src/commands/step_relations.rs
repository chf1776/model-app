use crate::db::AppDb;
use crate::models::StepRelation;
use serde::Deserialize;
use tauri::State;

#[derive(Debug, Deserialize)]
pub struct RelationInput {
    pub target_step_id: String,
    pub relation_type: String,
}

#[tauri::command]
pub fn list_project_step_relations(
    db: State<'_, AppDb>,
    project_id: String,
) -> Result<Vec<StepRelation>, String> {
    let conn = db.conn()?;
    crate::db::queries::step_relations::list_for_project(&conn, &project_id)
}

#[tauri::command]
pub fn list_step_relations(
    db: State<'_, AppDb>,
    step_id: String,
) -> Result<Vec<StepRelation>, String> {
    let conn = db.conn()?;
    crate::db::queries::step_relations::list_for_step(&conn, &step_id)
}

#[tauri::command]
pub fn set_step_relations(
    db: State<'_, AppDb>,
    step_id: String,
    relations: Vec<RelationInput>,
) -> Result<Vec<StepRelation>, String> {
    let conn = db.conn()?;
    let tuples: Vec<(String, String)> = relations
        .into_iter()
        .map(|r| (r.target_step_id, r.relation_type))
        .collect();
    crate::db::queries::step_relations::set_step_relations(&conn, &step_id, tuples)
}
