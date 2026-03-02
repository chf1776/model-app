use crate::models::{CreateKitInput, Kit, UpdateKitInput};
use rusqlite::{params, Connection};
use std::time::{SystemTime, UNIX_EPOCH};
use uuid::Uuid;

fn now() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs() as i64
}

pub fn list_all(conn: &Connection) -> Result<Vec<Kit>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT id, name, manufacturer, scale, kit_number, box_art_path,
                    status, category, scalemates_url, retailer_url, price, currency,
                    notes, created_at, updated_at
             FROM kits ORDER BY updated_at DESC",
        )
        .map_err(|e| e.to_string())?;

    let kits = stmt
        .query_map([], |row| {
            Ok(Kit {
                id: row.get(0)?,
                name: row.get(1)?,
                manufacturer: row.get(2)?,
                scale: row.get(3)?,
                kit_number: row.get(4)?,
                box_art_path: row.get(5)?,
                status: row.get(6)?,
                category: row.get(7)?,
                scalemates_url: row.get(8)?,
                retailer_url: row.get(9)?,
                price: row.get(10)?,
                currency: row.get(11)?,
                notes: row.get(12)?,
                created_at: row.get(13)?,
                updated_at: row.get(14)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(kits)
}

pub fn insert(conn: &Connection, input: CreateKitInput) -> Result<Kit, String> {
    let id = Uuid::new_v4().to_string();
    let ts = now();
    let status = input.status.unwrap_or_else(|| "shelf".to_string());

    let currency = input.currency.or(Some("USD".to_string()));

    conn.execute(
        "INSERT INTO kits (id, name, manufacturer, scale, kit_number, status, category,
                           scalemates_url, price, currency, retailer_url, notes, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)",
        params![
            id,
            input.name,
            input.manufacturer,
            input.scale,
            input.kit_number,
            status,
            input.category,
            input.scalemates_url,
            input.price,
            currency,
            input.retailer_url,
            input.notes,
            ts,
            ts,
        ],
    )
    .map_err(|e| e.to_string())?;

    Ok(Kit {
        id,
        name: input.name,
        manufacturer: input.manufacturer,
        scale: input.scale,
        kit_number: input.kit_number,
        box_art_path: None,
        status,
        category: input.category,
        scalemates_url: input.scalemates_url,
        retailer_url: input.retailer_url,
        price: input.price,
        currency,
        notes: input.notes,
        created_at: ts,
        updated_at: ts,
    })
}

pub fn update(conn: &Connection, input: UpdateKitInput) -> Result<Kit, String> {
    // First fetch the existing kit
    let existing = get_by_id(conn, &input.id)?;

    let name = input.name.unwrap_or(existing.name);
    let manufacturer = input.manufacturer.or(existing.manufacturer);
    let scale = input.scale.or(existing.scale);
    let kit_number = input.kit_number.or(existing.kit_number);
    let box_art_path = input.box_art_path.or(existing.box_art_path);
    let status = input.status.unwrap_or(existing.status);
    let category = input.category.or(existing.category);
    let scalemates_url = input.scalemates_url.or(existing.scalemates_url);
    let retailer_url = input.retailer_url.or(existing.retailer_url);
    let price = input.price.or(existing.price);
    let currency = input.currency.or(existing.currency);
    let notes = input.notes.or(existing.notes);

    conn.execute(
        "UPDATE kits SET name=?1, manufacturer=?2, scale=?3, kit_number=?4,
                box_art_path=?5, status=?6, category=?7, scalemates_url=?8,
                retailer_url=?9, price=?10, currency=?11, notes=?12
         WHERE id=?13",
        params![
            name,
            manufacturer,
            scale,
            kit_number,
            box_art_path,
            status,
            category,
            scalemates_url,
            retailer_url,
            price,
            currency,
            notes,
            input.id,
        ],
    )
    .map_err(|e| e.to_string())?;

    get_by_id(conn, &input.id)
}

pub fn get_by_id(conn: &Connection, id: &str) -> Result<Kit, String> {
    conn.query_row(
        "SELECT id, name, manufacturer, scale, kit_number, box_art_path,
                status, category, scalemates_url, retailer_url, price, currency,
                notes, created_at, updated_at
         FROM kits WHERE id = ?1",
        params![id],
        |row| {
            Ok(Kit {
                id: row.get(0)?,
                name: row.get(1)?,
                manufacturer: row.get(2)?,
                scale: row.get(3)?,
                kit_number: row.get(4)?,
                box_art_path: row.get(5)?,
                status: row.get(6)?,
                category: row.get(7)?,
                scalemates_url: row.get(8)?,
                retailer_url: row.get(9)?,
                price: row.get(10)?,
                currency: row.get(11)?,
                notes: row.get(12)?,
                created_at: row.get(13)?,
                updated_at: row.get(14)?,
            })
        },
    )
    .map_err(|e| e.to_string())
}

pub fn delete(conn: &Connection, id: &str) -> Result<(), String> {
    conn.execute("DELETE FROM kits WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}
