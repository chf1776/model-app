use crate::models::{CreateProjectInput, Project, UpdateProjectInput};
use crate::util::now;
use rusqlite::{params, Connection};
use uuid::Uuid;

const SELECT_COLS: &str =
    "p.id, p.name, p.kit_id, p.status, p.category,
     p.product_code, p.hero_photo_path, p.start_date, p.completion_date, p.notes,
     p.created_at, p.updated_at,
     k.name, k.scale, k.box_art_path, k.scalemates_url, k.scalemates_id";

fn map_row(row: &rusqlite::Row) -> rusqlite::Result<Project> {
    Ok(Project {
        id: row.get(0)?,
        name: row.get(1)?,
        kit_id: row.get(2)?,
        status: row.get(3)?,
        category: row.get(4)?,
        product_code: row.get(5)?,
        hero_photo_path: row.get(6)?,
        start_date: row.get(7)?,
        completion_date: row.get(8)?,
        notes: row.get(9)?,
        created_at: row.get(10)?,
        updated_at: row.get(11)?,
        kit_name: row.get(12)?,
        kit_scale: row.get(13)?,
        kit_box_art_path: row.get(14)?,
        kit_scalemates_url: row.get(15)?,
        kit_scalemates_id: row.get(16)?,
    })
}

pub fn list_all(conn: &Connection) -> Result<Vec<Project>, String> {
    let mut stmt = conn
        .prepare(&format!(
            "SELECT {SELECT_COLS}
             FROM projects p
             LEFT JOIN kits k ON p.kit_id = k.id
             ORDER BY p.updated_at DESC"
        ))
        .map_err(|e| e.to_string())?;

    let projects = stmt
        .query_map([], |row| map_row(row))
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(projects)
}

pub fn get_by_id(conn: &Connection, id: &str) -> Result<Project, String> {
    conn.query_row(
        &format!(
            "SELECT {SELECT_COLS}
             FROM projects p
             LEFT JOIN kits k ON p.kit_id = k.id
             WHERE p.id = ?1"
        ),
        params![id],
        |row| map_row(row),
    )
    .map_err(|e| e.to_string())
}

pub fn update(conn: &Connection, input: UpdateProjectInput) -> Result<Project, String> {
    let existing = get_by_id(conn, &input.id)?;

    let name = input.name.unwrap_or(existing.name);
    let status = input.status.unwrap_or(existing.status);
    let category = match input.category {
        Some(v) => v,
        None => existing.category,
    };
    let product_code = match input.product_code {
        Some(v) => v,
        None => existing.product_code,
    };
    let notes = match input.notes {
        Some(v) => v,
        None => existing.notes,
    };

    let hero_photo_path = match input.hero_photo_path {
        Some(v) => v,               // Some(Some("path")) or Some(None) — explicit set/clear
        None => existing.hero_photo_path, // absent — keep existing
    };

    let completion_date = match input.completion_date {
        Some(v) => v,
        None => existing.completion_date,
    };

    conn.execute(
        "UPDATE projects SET name=?1, status=?2, category=?3,
                product_code=?4, hero_photo_path=?5, completion_date=?6, notes=?7
         WHERE id=?8",
        params![
            name,
            status,
            category,
            product_code,
            hero_photo_path,
            completion_date,
            notes,
            input.id,
        ],
    )
    .map_err(|e| e.to_string())?;

    get_by_id(conn, &input.id)
}

pub fn insert(conn: &Connection, input: &CreateProjectInput, kit_id: &str) -> Result<Project, String> {
    let id = Uuid::new_v4().to_string();
    let ts = now();

    conn.execute(
        "INSERT INTO projects (id, name, kit_id, status, category,
                               product_code, start_date, created_at, updated_at)
         VALUES (?1, ?2, ?3, 'active', ?4, ?5, ?6, ?7, ?8)",
        params![
            id,
            input.name,
            kit_id,
            input.category,
            input.product_code,
            ts,
            ts,
            ts,
        ],
    )
    .map_err(|e| e.to_string())?;

    // Create project_ui_state
    conn.execute(
        "INSERT INTO project_ui_state (project_id, updated_at) VALUES (?1, ?2)",
        params![id, ts],
    )
    .map_err(|e| e.to_string())?;

    get_by_id(conn, &id)
}

pub fn delete(conn: &Connection, id: &str) -> Result<(), String> {
    conn.execute("DELETE FROM projects WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}
