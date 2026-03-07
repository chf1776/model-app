use crate::models::{Accessory, CreateAccessoryInput, UpdateAccessoryInput};
use crate::util::now;
use rusqlite::{params, Connection};
use uuid::Uuid;

fn row_to_accessory(row: &rusqlite::Row) -> rusqlite::Result<Accessory> {
    Ok(Accessory {
        id: row.get(0)?,
        name: row.get(1)?,
        accessory_type: row.get(2)?,
        manufacturer: row.get(3)?,
        brand: row.get(4)?,
        reference_code: row.get(5)?,
        parent_kit_id: row.get(6)?,
        status: row.get(7)?,
        price: row.get(8)?,
        currency: row.get(9)?,
        buy_url: row.get(10)?,
        image_path: row.get(11)?,
        notes: row.get(12)?,
        created_at: row.get(13)?,
        updated_at: row.get(14)?,
        parent_kit_name: row.get(15)?,
    })
}

const SELECT_WITH_JOIN: &str =
    "SELECT a.id, a.name, a.type, a.manufacturer, a.brand, a.reference_code,
            a.parent_kit_id, a.status, a.price, a.currency, a.buy_url,
            a.image_path, a.notes, a.created_at, a.updated_at, k.name AS parent_kit_name
     FROM accessories a
     LEFT JOIN kits k ON a.parent_kit_id = k.id";

pub fn list_all(conn: &Connection) -> Result<Vec<Accessory>, String> {
    let mut stmt = conn
        .prepare(&format!("{SELECT_WITH_JOIN} ORDER BY a.updated_at DESC"))
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |row| row_to_accessory(row))
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(rows)
}

pub fn list_by_kit(conn: &Connection, kit_id: &str) -> Result<Vec<Accessory>, String> {
    let mut stmt = conn
        .prepare(&format!(
            "{SELECT_WITH_JOIN} WHERE a.parent_kit_id = ?1 ORDER BY a.updated_at DESC"
        ))
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map(params![kit_id], |row| row_to_accessory(row))
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(rows)
}

pub fn list_by_project(conn: &Connection, project_id: &str) -> Result<Vec<Accessory>, String> {
    let mut stmt = conn
        .prepare(&format!(
            "{SELECT_WITH_JOIN} WHERE a.id IN (SELECT accessory_id FROM project_accessories WHERE project_id = ?1) ORDER BY a.name"
        ))
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map(params![project_id], |row| row_to_accessory(row))
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(rows)
}

pub fn get_by_id(conn: &Connection, id: &str) -> Result<Accessory, String> {
    conn.query_row(
        &format!("{SELECT_WITH_JOIN} WHERE a.id = ?1"),
        params![id],
        |row| row_to_accessory(row),
    )
    .map_err(|e| e.to_string())
}

pub fn insert(conn: &Connection, input: CreateAccessoryInput) -> Result<Accessory, String> {
    let id = Uuid::new_v4().to_string();
    let ts = now();
    let status = input.status.unwrap_or_else(|| "shelf".to_string());

    conn.execute(
        "INSERT INTO accessories (id, name, type, manufacturer, brand, reference_code,
                                  parent_kit_id, status, price, currency, buy_url,
                                  image_path, notes, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15)",
        params![
            id,
            input.name,
            input.accessory_type,
            input.manufacturer,
            input.brand,
            input.reference_code,
            input.parent_kit_id,
            status,
            input.price,
            input.currency,
            input.buy_url,
            input.image_path,
            input.notes,
            ts,
            ts,
        ],
    )
    .map_err(|e| e.to_string())?;

    get_by_id(conn, &id)
}

pub fn update(conn: &Connection, input: UpdateAccessoryInput) -> Result<Accessory, String> {
    let existing = get_by_id(conn, &input.id)?;

    let name = input.name.unwrap_or(existing.name);
    let accessory_type = input.accessory_type.unwrap_or(existing.accessory_type);
    let manufacturer = input.manufacturer.or(existing.manufacturer);
    let brand = input.brand.or(existing.brand);
    let reference_code = input.reference_code.or(existing.reference_code);
    let parent_kit_id = input.parent_kit_id.or(existing.parent_kit_id);
    let status = input.status.unwrap_or(existing.status);
    let price = input.price.or(existing.price);
    let currency = input.currency.or(existing.currency);
    let buy_url = input.buy_url.or(existing.buy_url);
    let image_path = input.image_path.or(existing.image_path);
    let notes = input.notes.or(existing.notes);

    conn.execute(
        "UPDATE accessories SET name=?1, type=?2, manufacturer=?3, brand=?4,
                reference_code=?5, parent_kit_id=?6, status=?7,
                price=?8, currency=?9, buy_url=?10, image_path=?11, notes=?12
         WHERE id=?13",
        params![
            name,
            accessory_type,
            manufacturer,
            brand,
            reference_code,
            parent_kit_id,
            status,
            price,
            currency,
            buy_url,
            image_path,
            notes,
            input.id,
        ],
    )
    .map_err(|e| e.to_string())?;

    get_by_id(conn, &input.id)
}

pub fn delete(conn: &Connection, id: &str) -> Result<(), String> {
    conn.execute("DELETE FROM accessories WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}
