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
