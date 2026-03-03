use crate::models::{Paint, CreatePaintInput, UpdatePaintInput};
use crate::util::now;
use rusqlite::{params, Connection};
use uuid::Uuid;

fn row_to_paint(row: &rusqlite::Row) -> rusqlite::Result<Paint> {
    Ok(Paint {
        id: row.get(0)?,
        brand: row.get(1)?,
        name: row.get(2)?,
        reference_code: row.get(3)?,
        paint_type: row.get(4)?,
        finish: row.get(5)?,
        color: row.get(6)?,
        color_family: row.get(7)?,
        status: row.get(8)?,
        price: row.get(9)?,
        currency: row.get(10)?,
        buy_url: row.get(11)?,
        price_updated_at: row.get(12)?,
        notes: row.get(13)?,
        created_at: row.get(14)?,
        updated_at: row.get(15)?,
    })
}

const SELECT_ALL: &str =
    "SELECT id, brand, name, reference_code, paint_type, finish, color,
            color_family, status, price, currency, buy_url, price_updated_at,
            notes, created_at, updated_at
     FROM paints";

pub fn list_all(conn: &Connection) -> Result<Vec<Paint>, String> {
    let mut stmt = conn
        .prepare(&format!("{SELECT_ALL} ORDER BY updated_at DESC"))
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |row| row_to_paint(row))
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(rows)
}

pub fn get_by_id(conn: &Connection, id: &str) -> Result<Paint, String> {
    conn.query_row(
        &format!("{SELECT_ALL} WHERE id = ?1"),
        params![id],
        |row| row_to_paint(row),
    )
    .map_err(|e| e.to_string())
}

pub fn insert(conn: &Connection, input: CreatePaintInput) -> Result<Paint, String> {
    let id = Uuid::new_v4().to_string();
    let ts = now();
    let status = input.status.unwrap_or_else(|| "owned".to_string());

    conn.execute(
        "INSERT INTO paints (id, brand, name, reference_code, paint_type, finish,
                             color, color_family, status, price, currency, buy_url,
                             notes, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15)",
        params![
            id,
            input.brand,
            input.name,
            input.reference_code,
            input.paint_type,
            input.finish,
            input.color,
            input.color_family,
            status,
            input.price,
            input.currency,
            input.buy_url,
            input.notes,
            ts,
            ts,
        ],
    )
    .map_err(|e| e.to_string())?;

    get_by_id(conn, &id)
}

pub fn update(conn: &Connection, input: UpdatePaintInput) -> Result<Paint, String> {
    let existing = get_by_id(conn, &input.id)?;

    let brand = input.brand.unwrap_or(existing.brand);
    let name = input.name.unwrap_or(existing.name);
    let reference_code = input.reference_code.or(existing.reference_code);
    let paint_type = input.paint_type.unwrap_or(existing.paint_type);
    let finish = input.finish.or(existing.finish);
    let color = input.color.or(existing.color);
    let color_family = input.color_family.or(existing.color_family);
    let status = input.status.unwrap_or(existing.status);
    let price = input.price.or(existing.price);
    let currency = input.currency.or(existing.currency);
    let buy_url = input.buy_url.or(existing.buy_url);
    let notes = input.notes.or(existing.notes);

    conn.execute(
        "UPDATE paints SET brand=?1, name=?2, reference_code=?3, paint_type=?4,
                finish=?5, color=?6, color_family=?7, status=?8,
                price=?9, currency=?10, buy_url=?11, notes=?12
         WHERE id=?13",
        params![
            brand,
            name,
            reference_code,
            paint_type,
            finish,
            color,
            color_family,
            status,
            price,
            currency,
            buy_url,
            notes,
            input.id,
        ],
    )
    .map_err(|e| e.to_string())?;

    get_by_id(conn, &input.id)
}

pub fn delete(conn: &Connection, id: &str) -> Result<(), String> {
    conn.execute("DELETE FROM paints WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}
