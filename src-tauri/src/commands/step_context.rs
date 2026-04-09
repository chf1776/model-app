use crate::db::AppDb;
use crate::models::StepContext;
use tauri::State;

#[tauri::command]
pub fn get_step_context(db: State<'_, AppDb>, step_id: String) -> Result<StepContext, String> {
    let conn = db.conn()?;
    let tags = crate::db::queries::tags::list_for_step(&conn, &step_id)?;
    let relations = crate::db::queries::step_relations::list_for_step(&conn, &step_id)?;
    let paint_refs = crate::db::queries::step_paint_refs::list_for_step(&conn, &step_id)?;
    let sprue_parts = crate::db::queries::step_sprue_parts::list_for_step(&conn, &step_id)?;
    let reference_images = crate::db::queries::reference_images::list_for_step(&conn, &step_id)?;
    let annotations = crate::db::queries::annotations::get(&conn, &step_id)?;

    Ok(StepContext {
        tags,
        relations,
        paint_refs,
        sprue_parts,
        reference_images,
        annotations,
    })
}
