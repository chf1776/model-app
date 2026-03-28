use crate::db::AppDb;
use crate::models::{SprueRef, StepSpruePart};
use crate::services::ai_detection;
use tauri::State;

#[derive(serde::Serialize)]
pub struct DetectionResponse {
    pub parts: Vec<StepSpruePart>,
    pub new_sprue_refs: Vec<SprueRef>,
}

#[tauri::command]
pub fn detect_step_sprues(
    db: State<'_, AppDb>,
    step_id: String,
) -> Result<DetectionResponse, String> {
    // Phase 1: Read from DB (hold lock briefly)
    let (page_path, crop_x, crop_y, crop_w, crop_h, api_key, model, project_id) = {
        let conn = db.conn()?;

        let step = crate::db::queries::steps::get_by_id(&conn, &step_id)?;

        let source_page_id = step.source_page_id.as_deref()
            .ok_or("Step has no source page")?;
        let page = crate::db::queries::instruction_pages::get_by_id(&conn, source_page_id)?;

        let crop_x = step.crop_x.ok_or("Step has no crop")?;
        let crop_y = step.crop_y.ok_or("Step has no crop")?;
        let crop_w = step.crop_w.ok_or("Step has no crop")?;
        let crop_h = step.crop_h.ok_or("Step has no crop")?;

        let api_key = crate::db::queries::settings::get(&conn, "ai_api_key")
            .unwrap_or_default();
        if api_key.is_empty() {
            return Err("No API key configured".to_string());
        }

        let model = crate::db::queries::settings::get(&conn, "ai_model")
            .unwrap_or_else(|_| "claude-haiku-4-5-20251001".to_string());

        // Get project_id via track
        let track = crate::db::queries::tracks::get_by_id(&conn, &step.track_id)?;

        // Mark as detected immediately to prevent duplicate triggers
        crate::db::queries::steps::set_sprues_detected(&conn, &step_id, true)?;

        (page.file_path, crop_x, crop_y, crop_w, crop_h, api_key, model, track.project_id)
    };
    // Lock is released here

    // Phase 2: Crop image and call API (no DB lock held)
    let image_base64 = ai_detection::crop_and_encode(
        &page_path, crop_x, crop_y, crop_w, crop_h,
    )?;

    let detected_parts = match ai_detection::detect_parts(&api_key, &model, &image_base64) {
        Ok(parts) => parts,
        Err(e) => {
            // Reset sprues_detected on failure so user can retry
            if let Ok(conn) = db.conn() {
                let _ = crate::db::queries::steps::set_sprues_detected(&conn, &step_id, false);
            }
            if e == ai_detection::INVALID_API_KEY {
                return Err(ai_detection::INVALID_API_KEY.to_string());
            }
            return Err(format!("Detection failed: {e}"));
        }
    };

    if detected_parts.is_empty() {
        return Ok(DetectionResponse {
            parts: Vec::new(),
            new_sprue_refs: Vec::new(),
        });
    }

    // Phase 3: Insert results into DB (re-acquire lock)
    let conn = db.conn()?;

    let existing_refs = crate::db::queries::sprue_refs::list_for_project(&conn, &project_id)?;
    let mut existing_labels: std::collections::HashSet<String> =
        existing_refs.iter().map(|r| r.label.clone()).collect();

    let mut inserted_parts = Vec::new();
    let mut new_sprue_refs = Vec::new();

    for part in &detected_parts {
        if !existing_labels.contains(&part.sprue) {
            let color = crate::db::queries::sprue_refs::get_next_color(&conn, &project_id)?;
            let new_ref = crate::db::queries::sprue_refs::insert(
                &conn,
                &project_id,
                None, None, None, None, None, None,
                &part.sprue,
                &color,
            )?;
            existing_labels.insert(part.sprue.clone());
            new_sprue_refs.push(new_ref);
        }

        // INSERT OR IGNORE handles duplicates
        let sprue_part = crate::db::queries::step_sprue_parts::add_part(
            &conn,
            &step_id,
            &part.sprue,
            part.number.as_deref(),
            true, // ai_detected
        )?;
        inserted_parts.push(sprue_part);
    }

    Ok(DetectionResponse {
        parts: inserted_parts,
        new_sprue_refs,
    })
}

#[tauri::command]
pub fn redetect_step_sprues(
    db: State<'_, AppDb>,
    step_id: String,
) -> Result<(), String> {
    let conn = db.conn()?;
    // Remove AI-detected parts (preserve manual ones)
    crate::db::queries::step_sprue_parts::remove_ai_detected_for_step(&conn, &step_id)?;
    // Reset flag so detection can re-trigger
    crate::db::queries::steps::set_sprues_detected(&conn, &step_id, false)?;
    Ok(())
}

#[tauri::command]
pub fn test_ai_connection(
    db: State<'_, AppDb>,
) -> Result<(), String> {
    let conn = db.conn()?;

    let api_key = crate::db::queries::settings::get(&conn, "ai_api_key")
        .unwrap_or_default();
    if api_key.is_empty() {
        return Err("No API key configured".to_string());
    }

    let model = crate::db::queries::settings::get(&conn, "ai_model")
        .unwrap_or_else(|_| "claude-haiku-4-5-20251001".to_string());

    ai_detection::test_api_key(&api_key, &model)
}
