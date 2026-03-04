use crate::models::{CreateStepInput, Step, UpdateStepInput};
use crate::util::now;
use rusqlite::{params, Connection};
use uuid::Uuid;

fn map_step(row: &rusqlite::Row) -> rusqlite::Result<Step> {
    Ok(Step {
        id: row.get(0)?,
        track_id: row.get(1)?,
        parent_step_id: row.get(2)?,
        title: row.get(3)?,
        display_order: row.get(4)?,
        source_page_id: row.get(5)?,
        crop_x: row.get(6)?,
        crop_y: row.get(7)?,
        crop_w: row.get(8)?,
        crop_h: row.get(9)?,
        is_full_page: row.get(10)?,
        source_type: row.get(11)?,
        source_name: row.get(12)?,
        adhesive_type: row.get(13)?,
        drying_time_min: row.get(14)?,
        pre_paint: row.get(15)?,
        quantity: row.get(16)?,
        is_completed: row.get(17)?,
        completed_at: row.get(18)?,
        quantity_current: row.get(19)?,
        replaces_step_id: row.get(20)?,
        notes: row.get(21)?,
        created_at: row.get(22)?,
        updated_at: row.get(23)?,
    })
}

const SELECT_COLS: &str =
    "id, track_id, parent_step_id, title, display_order, source_page_id,
     crop_x, crop_y, crop_w, crop_h, is_full_page, source_type, source_name,
     adhesive_type, drying_time_min, pre_paint, quantity, is_completed,
     completed_at, quantity_current, replaces_step_id, notes, created_at, updated_at";

pub fn list_by_track(conn: &Connection, track_id: &str) -> Result<Vec<Step>, String> {
    let mut stmt = conn
        .prepare(&format!(
            "SELECT {SELECT_COLS} FROM steps WHERE track_id = ?1 ORDER BY display_order"
        ))
        .map_err(|e| e.to_string())?;

    let steps = stmt
        .query_map(params![track_id], |row| map_step(row))
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(steps)
}

pub fn list_by_project(conn: &Connection, project_id: &str) -> Result<Vec<Step>, String> {
    let mut stmt = conn
        .prepare(&format!(
            "SELECT s.id, s.track_id, s.parent_step_id, s.title, s.display_order, s.source_page_id,
                    s.crop_x, s.crop_y, s.crop_w, s.crop_h, s.is_full_page, s.source_type, s.source_name,
                    s.adhesive_type, s.drying_time_min, s.pre_paint, s.quantity, s.is_completed,
                    s.completed_at, s.quantity_current, s.replaces_step_id, s.notes, s.created_at, s.updated_at
             FROM steps s
             JOIN tracks t ON s.track_id = t.id
             WHERE t.project_id = ?1
             ORDER BY t.display_order, s.display_order"
        ))
        .map_err(|e| e.to_string())?;

    let steps = stmt
        .query_map(params![project_id], |row| map_step(row))
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(steps)
}

pub fn get_by_id(conn: &Connection, id: &str) -> Result<Step, String> {
    conn.query_row(
        &format!("SELECT {SELECT_COLS} FROM steps WHERE id = ?1"),
        params![id],
        |row| map_step(row),
    )
    .map_err(|e| e.to_string())
}

pub fn insert(conn: &Connection, input: CreateStepInput) -> Result<Step, String> {
    let id = Uuid::new_v4().to_string();
    let ts = now();

    let is_full_page = input.is_full_page.unwrap_or(false);
    let source_type = input.source_type.unwrap_or_else(|| "base_kit".to_string());
    let pre_paint = input.pre_paint.unwrap_or(false);

    let max_order: i32 = conn
        .query_row(
            "SELECT COALESCE(MAX(display_order), -1) FROM steps WHERE track_id = ?1",
            params![input.track_id],
            |row| row.get(0),
        )
        .unwrap_or(-1);

    conn.execute(
        "INSERT INTO steps (id, track_id, title, display_order, source_page_id,
                            crop_x, crop_y, crop_w, crop_h, is_full_page, source_type,
                            source_name, adhesive_type, drying_time_min, pre_paint,
                            quantity, notes, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19)",
        params![
            id,
            input.track_id,
            input.title,
            max_order + 1,
            input.source_page_id,
            input.crop_x,
            input.crop_y,
            input.crop_w,
            input.crop_h,
            is_full_page,
            source_type,
            input.source_name,
            input.adhesive_type,
            input.drying_time_min,
            pre_paint,
            input.quantity,
            input.notes,
            ts,
            ts,
        ],
    )
    .map_err(|e| e.to_string())?;

    get_by_id(conn, &id)
}

pub fn update(conn: &Connection, input: UpdateStepInput) -> Result<Step, String> {
    let existing = get_by_id(conn, &input.id)?;
    let ts = now();

    // Handle track reassignment
    let track_changed = input.track_id.as_ref().is_some_and(|tid| *tid != existing.track_id);
    let track_id = input.track_id.unwrap_or_else(|| existing.track_id.clone());
    let display_order = if track_changed {
        let max_order: i32 = conn
            .query_row(
                "SELECT COALESCE(MAX(display_order), -1) FROM steps WHERE track_id = ?1",
                params![track_id],
                |row| row.get(0),
            )
            .unwrap_or(-1);
        max_order + 1
    } else {
        existing.display_order
    };

    let title = input.title.unwrap_or(existing.title);
    let parent_step_id = input.parent_step_id.or(existing.parent_step_id);
    let source_page_id = input.source_page_id.or(existing.source_page_id);
    let crop_x = input.crop_x.or(existing.crop_x);
    let crop_y = input.crop_y.or(existing.crop_y);
    let crop_w = input.crop_w.or(existing.crop_w);
    let crop_h = input.crop_h.or(existing.crop_h);
    let is_full_page = input.is_full_page.unwrap_or(existing.is_full_page);
    let source_type = input.source_type.unwrap_or(existing.source_type);
    let source_name = input.source_name.or(existing.source_name);
    let adhesive_type = input.adhesive_type.or(existing.adhesive_type);
    let drying_time_min = input.drying_time_min.or(existing.drying_time_min);
    let pre_paint = input.pre_paint.unwrap_or(existing.pre_paint);
    let quantity = input.quantity.or(existing.quantity);
    let is_completed = input.is_completed.unwrap_or(existing.is_completed);
    let notes = input.notes.or(existing.notes);

    // Set completed_at when marking complete
    let completed_at = if is_completed && !existing.is_completed {
        Some(ts)
    } else if !is_completed {
        None
    } else {
        existing.completed_at
    };

    conn.execute(
        "UPDATE steps SET track_id = ?1, display_order = ?2, title = ?3,
                parent_step_id = ?4, source_page_id = ?5,
                crop_x = ?6, crop_y = ?7, crop_w = ?8, crop_h = ?9,
                is_full_page = ?10, source_type = ?11, source_name = ?12,
                adhesive_type = ?13, drying_time_min = ?14, pre_paint = ?15,
                quantity = ?16, is_completed = ?17, completed_at = ?18,
                notes = ?19, updated_at = ?20
         WHERE id = ?21",
        params![
            track_id,
            display_order,
            title,
            parent_step_id,
            source_page_id,
            crop_x,
            crop_y,
            crop_w,
            crop_h,
            is_full_page,
            source_type,
            source_name,
            adhesive_type,
            drying_time_min,
            pre_paint,
            quantity,
            is_completed,
            completed_at,
            notes,
            ts,
            input.id,
        ],
    )
    .map_err(|e| e.to_string())?;

    get_by_id(conn, &input.id)
}

pub fn delete(conn: &Connection, id: &str) -> Result<(), String> {
    conn.execute("DELETE FROM steps WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn delete_and_reorder(conn: &Connection, id: &str) -> Result<(), String> {
    // Get step's track_id before deleting
    let track_id: String = conn
        .query_row("SELECT track_id FROM steps WHERE id = ?1", params![id], |row| row.get(0))
        .map_err(|e| e.to_string())?;

    delete(conn, id)?;

    // Get remaining step IDs in order and normalize display_order
    let mut stmt = conn
        .prepare("SELECT id FROM steps WHERE track_id = ?1 ORDER BY display_order")
        .map_err(|e| e.to_string())?;
    let remaining_ids: Vec<String> = stmt
        .query_map(params![track_id], |row| row.get(0))
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    reorder(conn, &track_id, remaining_ids)
}

pub fn reorder(conn: &Connection, track_id: &str, ordered_ids: Vec<String>) -> Result<(), String> {
    let ts = now();
    for (i, id) in ordered_ids.iter().enumerate() {
        conn.execute(
            "UPDATE steps SET display_order = ?1, updated_at = ?2 WHERE id = ?3 AND track_id = ?4",
            params![i as i32, ts, id, track_id],
        )
        .map_err(|e| e.to_string())?;
    }
    Ok(())
}
