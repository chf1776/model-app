use rusqlite::Connection;
use std::fs;
use std::path::{Path, PathBuf};

pub struct RasterizedPage {
    pub page_index: usize,
    pub file_path: PathBuf,
    pub width: u32,
    pub height: u32,
}

pub fn rasterize_pdf(
    pdf_path: &Path,
    output_dir: &Path,
    dpi: u32,
) -> Result<Vec<RasterizedPage>, String> {
    fs::create_dir_all(output_dir)
        .map_err(|e| format!("Failed to create output dir: {e}"))?;

    let doc = mupdf::document::Document::open(pdf_path.to_str().unwrap_or_default())
        .map_err(|e| format!("Failed to open PDF: {e}"))?;

    let page_count = doc.page_count().map_err(|e| format!("Failed to get page count: {e}"))?;
    let scale = dpi as f32 / 72.0;
    let matrix = mupdf::Matrix::new_scale(scale, scale);

    let mut pages = Vec::with_capacity(page_count as usize);

    for i in 0..page_count {
        let page = doc
            .load_page(i)
            .map_err(|e| format!("Failed to load page {i}: {e}"))?;

        let pixmap = page
            .to_pixmap(&matrix, &mupdf::Colorspace::device_rgb(), true, true)
            .map_err(|e| format!("Failed to render page {i}: {e}"))?;

        let filename = format!("page-{:03}.png", i + 1);
        let output_path = output_dir.join(&filename);

        pixmap
            .save_as(output_path.to_str().unwrap_or_default(), mupdf::ImageFormat::PNG)
            .map_err(|e| format!("Failed to save page {i} as PNG: {e}"))?;

        let width = pixmap.width() as u32;
        let height = pixmap.height() as u32;

        pages.push(RasterizedPage {
            page_index: i as usize,
            file_path: output_path,
            width,
            height,
        });
    }

    Ok(pages)
}

/// Rasterize a PDF and persist pages to the database, updating the source record.
/// Returns the page count on success.
pub fn rasterize_and_persist(
    conn: &Connection,
    source_id: &str,
    pdf_path: &Path,
    pages_dir: &Path,
    dpi: u32,
) -> Result<i32, String> {
    let rasterized = rasterize_pdf(pdf_path, pages_dir, dpi)?;

    let page_data: Vec<(usize, String, u32, u32)> = rasterized
        .iter()
        .map(|p| {
            (
                p.page_index,
                p.file_path.to_string_lossy().to_string(),
                p.width,
                p.height,
            )
        })
        .collect();

    crate::db::queries::instruction_pages::insert_batch(conn, source_id, &page_data)?;

    let page_count = rasterized.len() as i32;
    let file_path_str = pdf_path.to_string_lossy().to_string();
    crate::db::queries::instruction_sources::update_after_processing(
        conn, source_id, page_count, &file_path_str,
    )?;

    Ok(page_count)
}
