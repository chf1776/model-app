use crate::models::{CreateProjectInput, Project};
use crate::util::now;
use rusqlite::{params, Connection};
use uuid::Uuid;

pub fn list_all(conn: &Connection) -> Result<Vec<Project>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT p.id, p.name, p.kit_id, p.status, p.category, p.scalemates_url,
                    p.product_code, p.start_date, p.completion_date, p.notes,
                    p.created_at, p.updated_at,
                    k.name, k.scale, k.box_art_path
             FROM projects p
             LEFT JOIN kits k ON p.kit_id = k.id
             ORDER BY p.updated_at DESC",
        )
        .map_err(|e| e.to_string())?;

    let projects = stmt
        .query_map([], |row| {
            Ok(Project {
                id: row.get(0)?,
                name: row.get(1)?,
                kit_id: row.get(2)?,
                status: row.get(3)?,
                category: row.get(4)?,
                scalemates_url: row.get(5)?,
                product_code: row.get(6)?,
                start_date: row.get(7)?,
                completion_date: row.get(8)?,
                notes: row.get(9)?,
                created_at: row.get(10)?,
                updated_at: row.get(11)?,
                kit_name: row.get(12)?,
                kit_scale: row.get(13)?,
                kit_box_art_path: row.get(14)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(projects)
}

pub fn get_by_id(conn: &Connection, id: &str) -> Result<Project, String> {
    conn.query_row(
        "SELECT p.id, p.name, p.kit_id, p.status, p.category, p.scalemates_url,
                p.product_code, p.start_date, p.completion_date, p.notes,
                p.created_at, p.updated_at,
                k.name, k.scale, k.box_art_path
         FROM projects p
         LEFT JOIN kits k ON p.kit_id = k.id
         WHERE p.id = ?1",
        params![id],
        |row| {
            Ok(Project {
                id: row.get(0)?,
                name: row.get(1)?,
                kit_id: row.get(2)?,
                status: row.get(3)?,
                category: row.get(4)?,
                scalemates_url: row.get(5)?,
                product_code: row.get(6)?,
                start_date: row.get(7)?,
                completion_date: row.get(8)?,
                notes: row.get(9)?,
                created_at: row.get(10)?,
                updated_at: row.get(11)?,
                kit_name: row.get(12)?,
                kit_scale: row.get(13)?,
                kit_box_art_path: row.get(14)?,
            })
        },
    )
    .map_err(|e| e.to_string())
}

pub fn insert(conn: &Connection, input: &CreateProjectInput, kit_id: &str) -> Result<Project, String> {
    let id = Uuid::new_v4().to_string();
    let ts = now();

    conn.execute(
        "INSERT INTO projects (id, name, kit_id, status, category, scalemates_url,
                               product_code, start_date, created_at, updated_at)
         VALUES (?1, ?2, ?3, 'active', ?4, ?5, ?6, ?7, ?8, ?9)",
        params![
            id,
            input.name,
            kit_id,
            input.category,
            input.scalemates_url,
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
