use crate::db::AppDb;
use std::fs;
use std::path::{Path, PathBuf};
use uuid::Uuid;

/// Copy a file into the app stash directory with a prefixed filename.
/// Returns the absolute path of the stashed copy.
pub fn save_to_stash(
    app_data: &Path,
    source_path: &str,
    prefix: &str,
    entity_id: &str,
) -> Result<String, String> {
    let stash_dir = AppDb::stash_dir(&app_data.to_path_buf());

    let source = PathBuf::from(source_path);
    let ext = source
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("jpg");

    let filename = format!("{}_{}_{}.{}", prefix, entity_id, Uuid::new_v4(), ext);
    let dest = stash_dir.join(&filename);

    fs::copy(&source, &dest).map_err(|e| format!("Failed to copy image: {e}"))?;

    Ok(dest.to_string_lossy().to_string())
}
