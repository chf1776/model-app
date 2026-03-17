use crate::db::AppDb;
use crate::models::KitFile;
use crate::services::scalemates::{self, ScalematesKitData};
use std::io::Write;
use tauri::{Manager, State};
use uuid::Uuid;

#[tauri::command]
pub fn fetch_scalemates_data(url: String) -> Result<ScalematesKitData, String> {
    if !url.contains("scalemates.com/kits/") {
        return Err("Not a valid Scalemates kit URL. The URL should contain 'scalemates.com/kits/'.".to_string());
    }

    let client = scalemates::build_client()?;

    let response = client
        .get(&url)
        .send()
        .map_err(|e| {
            if e.is_timeout() {
                "Couldn't reach Scalemates. The request timed out.".to_string()
            } else if e.is_connect() {
                "Couldn't reach Scalemates. Check your internet connection.".to_string()
            } else {
                format!("Couldn't reach Scalemates: {e}")
            }
        })?;

    if !response.status().is_success() {
        return Err(format!(
            "Scalemates returned an error. The page may not exist or the site may be down."
        ));
    }

    let html = response
        .text()
        .map_err(|e| format!("Failed to read Scalemates response: {e}"))?;

    Ok(scalemates::parse_kit_page(&html, &url))
}

#[tauri::command]
pub fn download_scalemates_manual(
    app: tauri::AppHandle,
    db: State<'_, AppDb>,
    kit_id: String,
    pdf_url: String,
    label: String,
    source_kit_name: Option<String>,
    source_kit_year: Option<String>,
) -> Result<KitFile, String> {
    let client = scalemates::build_client()?;

    // Download PDF (no mutex held)
    let response = client
        .get(&pdf_url)
        .send()
        .map_err(|e| format!("Failed to download manual: {e}"))?;

    if !response.status().is_success() {
        return Err("Failed to download the instruction manual. The link may have expired.".to_string());
    }

    let bytes = response
        .bytes()
        .map_err(|e| format!("Failed to read manual data: {e}"))?;

    // Write to temp file
    let app_data = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let stash_dir = AppDb::stash_dir(&app_data);
    let filename = format!("kitf_{}_{}.pdf", kit_id, Uuid::new_v4());
    let dest = stash_dir.join(&filename);

    let mut file = std::fs::File::create(&dest)
        .map_err(|e| format!("Failed to save manual: {e}"))?;
    file.write_all(&bytes)
        .map_err(|e| format!("Failed to write manual: {e}"))?;

    let dest_str = dest.to_string_lossy().to_string();

    // Now acquire mutex and insert
    // Exact-match manuals get "Scalemates" as origin; related boxings keep their kit name
    let effective_name = source_kit_name.as_deref().unwrap_or("Scalemates");
    let conn = db.conn()?;
    crate::db::queries::kit_files::insert_with_provenance(
        &conn,
        &kit_id,
        &dest_str,
        "pdf",
        Some(&label),
        Some(effective_name),
        source_kit_year.as_deref(),
    )
}

#[tauri::command]
pub fn download_scalemates_box_art(
    app: tauri::AppHandle,
    db: State<'_, AppDb>,
    kit_id: String,
    image_url: String,
) -> Result<String, String> {
    let client = scalemates::build_client()?;

    // Download image (no mutex held)
    let response = client
        .get(&image_url)
        .send()
        .map_err(|e| format!("Failed to download box art: {e}"))?;

    if !response.status().is_success() {
        return Err("Failed to download box art image.".to_string());
    }

    // Determine extension from URL or content-type
    let content_type = response
        .headers()
        .get("content-type")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("")
        .to_string();

    let ext = if image_url.contains(".png") || content_type.contains("png") {
        "png"
    } else if image_url.contains(".webp") || content_type.contains("webp") {
        "webp"
    } else {
        "jpg"
    };

    let bytes = response
        .bytes()
        .map_err(|e| format!("Failed to read image data: {e}"))?;

    // Write to stash using box art naming pattern (no prefix, matches save_box_art)
    let app_data = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let stash_dir = AppDb::stash_dir(&app_data);
    let filename = format!("{}_{}.{}", kit_id, Uuid::new_v4(), ext);
    let dest = stash_dir.join(&filename);

    let mut file = std::fs::File::create(&dest)
        .map_err(|e| format!("Failed to save box art: {e}"))?;
    file.write_all(&bytes)
        .map_err(|e| format!("Failed to write box art: {e}"))?;

    let dest_str = dest.to_string_lossy().to_string();

    // Update kit record (acquire mutex)
    let conn = db.conn()?;
    conn.execute(
        "UPDATE kits SET box_art_path = ?1 WHERE id = ?2",
        rusqlite::params![dest_str, kit_id],
    )
    .map_err(|e| e.to_string())?;

    Ok(dest_str)
}
