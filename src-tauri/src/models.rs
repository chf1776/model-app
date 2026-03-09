use serde::{Deserialize, Serialize};

// ── Kit ──────────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Kit {
    pub id: String,
    pub name: String,
    pub manufacturer: Option<String>,
    pub scale: Option<String>,
    pub kit_number: Option<String>,
    pub box_art_path: Option<String>,
    pub status: String,
    pub category: Option<String>,
    pub scalemates_url: Option<String>,
    pub retailer_url: Option<String>,
    pub price: Option<f64>,
    pub currency: Option<String>,
    pub notes: Option<String>,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Deserialize)]
pub struct CreateKitInput {
    pub name: String,
    pub manufacturer: Option<String>,
    pub scale: Option<String>,
    pub kit_number: Option<String>,
    pub status: Option<String>,
    pub category: Option<String>,
    pub scalemates_url: Option<String>,
    pub price: Option<f64>,
    pub currency: Option<String>,
    pub retailer_url: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateKitInput {
    pub id: String,
    pub name: Option<String>,
    pub manufacturer: Option<String>,
    pub scale: Option<String>,
    pub kit_number: Option<String>,
    pub box_art_path: Option<String>,
    pub status: Option<String>,
    pub category: Option<String>,
    pub scalemates_url: Option<String>,
    pub retailer_url: Option<String>,
    pub price: Option<f64>,
    pub currency: Option<String>,
    pub notes: Option<String>,
}

// ── Accessory ────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Accessory {
    pub id: String,
    pub name: String,
    #[serde(rename = "type")]
    pub accessory_type: String,
    pub manufacturer: Option<String>,
    pub brand: Option<String>,
    pub reference_code: Option<String>,
    pub parent_kit_id: Option<String>,
    pub status: String,
    pub price: Option<f64>,
    pub currency: Option<String>,
    pub buy_url: Option<String>,
    pub image_path: Option<String>,
    pub notes: Option<String>,
    pub created_at: i64,
    pub updated_at: i64,
    // Joined field
    pub parent_kit_name: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateAccessoryInput {
    pub name: String,
    #[serde(rename = "type")]
    pub accessory_type: String,
    pub manufacturer: Option<String>,
    pub brand: Option<String>,
    pub reference_code: Option<String>,
    pub parent_kit_id: Option<String>,
    pub status: Option<String>,
    pub price: Option<f64>,
    pub currency: Option<String>,
    pub buy_url: Option<String>,
    pub image_path: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateAccessoryInput {
    pub id: String,
    pub name: Option<String>,
    #[serde(rename = "type")]
    pub accessory_type: Option<String>,
    pub manufacturer: Option<String>,
    pub brand: Option<String>,
    pub reference_code: Option<String>,
    pub parent_kit_id: Option<String>,
    pub status: Option<String>,
    pub price: Option<f64>,
    pub currency: Option<String>,
    pub buy_url: Option<String>,
    pub image_path: Option<String>,
    pub notes: Option<String>,
}

// ── Paint ────────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Paint {
    pub id: String,
    pub brand: String,
    pub name: String,
    pub reference_code: Option<String>,
    #[serde(rename = "type")]
    pub paint_type: String,
    pub finish: Option<String>,
    pub color: Option<String>,
    pub color_family: Option<String>,
    pub status: String,
    pub price: Option<f64>,
    pub currency: Option<String>,
    pub buy_url: Option<String>,
    pub price_updated_at: Option<i64>,
    pub notes: Option<String>,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Deserialize)]
pub struct CreatePaintInput {
    pub brand: String,
    pub name: String,
    #[serde(rename = "type")]
    pub paint_type: String,
    pub reference_code: Option<String>,
    pub finish: Option<String>,
    pub color: Option<String>,
    pub color_family: Option<String>,
    pub status: Option<String>,
    pub price: Option<f64>,
    pub currency: Option<String>,
    pub buy_url: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdatePaintInput {
    pub id: String,
    pub brand: Option<String>,
    pub name: Option<String>,
    #[serde(rename = "type")]
    pub paint_type: Option<String>,
    pub reference_code: Option<String>,
    pub finish: Option<String>,
    pub color: Option<String>,
    pub color_family: Option<String>,
    pub status: Option<String>,
    pub price: Option<f64>,
    pub currency: Option<String>,
    pub buy_url: Option<String>,
    pub notes: Option<String>,
}

// ── Kit File ─────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KitFile {
    pub id: String,
    pub kit_id: String,
    pub file_path: String,
    pub file_type: String,
    pub label: Option<String>,
    pub display_order: i32,
    pub created_at: i64,
}

// ── Project ──────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Project {
    pub id: String,
    pub name: String,
    pub kit_id: Option<String>,
    pub status: String,
    pub category: Option<String>,
    pub scalemates_url: Option<String>,
    pub product_code: Option<String>,
    pub hero_photo_path: Option<String>,
    pub start_date: Option<i64>,
    pub completion_date: Option<i64>,
    pub notes: Option<String>,
    pub created_at: i64,
    pub updated_at: i64,
    // Joined fields
    pub kit_name: Option<String>,
    pub kit_scale: Option<String>,
    pub kit_box_art_path: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateProjectInput {
    pub name: String,
    pub kit_id: Option<String>,
    // For inline kit creation
    pub new_kit_name: Option<String>,
    pub new_kit_manufacturer: Option<String>,
    pub new_kit_scale: Option<String>,
    pub category: Option<String>,
    pub scalemates_url: Option<String>,
    pub product_code: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateProjectInput {
    pub id: String,
    pub name: Option<String>,
    pub status: Option<String>,
    pub category: Option<String>,
    pub scalemates_url: Option<String>,
    pub product_code: Option<String>,
    pub notes: Option<String>,
    #[serde(default, deserialize_with = "deserialize_optional_nullable")]
    pub hero_photo_path: Option<Option<String>>,
    #[serde(default, deserialize_with = "deserialize_optional_nullable")]
    pub completion_date: Option<Option<i64>>,
}

// ── Instruction Source ──────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InstructionSource {
    pub id: String,
    pub project_id: String,
    pub name: String,
    pub original_filename: String,
    pub file_path: String,
    pub page_count: i32,
    pub display_order: i32,
    pub created_at: i64,
}

// ── Instruction Page ────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InstructionPage {
    pub id: String,
    pub source_id: String,
    pub page_index: i32,
    pub file_path: String,
    pub width: i32,
    pub height: i32,
    pub rotation: i32,
}

// ── Track ───────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Track {
    pub id: String,
    pub project_id: String,
    pub name: String,
    pub color: String,
    pub display_order: i32,
    pub is_standalone: bool,
    pub join_point_step_id: Option<String>,
    pub join_point_notes: Option<String>,
    pub step_count: i32,
    pub completed_count: i32,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Deserialize)]
pub struct CreateTrackInput {
    pub project_id: String,
    pub name: String,
    pub color: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateTrackInput {
    pub id: String,
    pub name: Option<String>,
    pub color: Option<String>,
}

// ── Tag ─────────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Tag {
    pub id: String,
    pub name: String,
    pub created_at: i64,
}

// ── Step ────────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Step {
    pub id: String,
    pub track_id: String,
    pub parent_step_id: Option<String>,
    pub title: String,
    pub display_order: i32,
    pub source_page_id: Option<String>,
    pub crop_x: Option<f64>,
    pub crop_y: Option<f64>,
    pub crop_w: Option<f64>,
    pub crop_h: Option<f64>,
    pub is_full_page: bool,
    pub source_type: String,
    pub source_name: Option<String>,
    pub adhesive_type: Option<String>,
    pub drying_time_min: Option<i32>,
    pub pre_paint: bool,
    pub quantity: Option<i32>,
    pub is_completed: bool,
    pub completed_at: Option<i64>,
    pub quantity_current: i32,
    pub replaces_step_id: Option<String>,
    pub notes: Option<String>,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Deserialize)]
pub struct CreateStepInput {
    pub track_id: String,
    pub title: String,
    pub parent_step_id: Option<String>,
    pub source_page_id: Option<String>,
    pub crop_x: Option<f64>,
    pub crop_y: Option<f64>,
    pub crop_w: Option<f64>,
    pub crop_h: Option<f64>,
    pub is_full_page: Option<bool>,
    pub source_type: Option<String>,
    pub source_name: Option<String>,
    pub adhesive_type: Option<String>,
    pub drying_time_min: Option<i32>,
    pub pre_paint: Option<bool>,
    pub quantity: Option<i32>,
    pub notes: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateStepInput {
    pub id: String,
    pub track_id: Option<String>,
    pub title: Option<String>,
    pub parent_step_id: Option<String>,
    pub source_page_id: Option<String>,
    pub crop_x: Option<f64>,
    pub crop_y: Option<f64>,
    pub crop_w: Option<f64>,
    pub crop_h: Option<f64>,
    pub is_full_page: Option<bool>,
    pub source_type: Option<String>,
    pub source_name: Option<String>,
    pub adhesive_type: Option<String>,
    pub drying_time_min: Option<i32>,
    pub pre_paint: Option<bool>,
    pub quantity: Option<i32>,
    pub quantity_current: Option<i32>,
    pub is_completed: Option<bool>,
    #[serde(default, deserialize_with = "deserialize_optional_nullable")]
    pub replaces_step_id: Option<Option<String>>,
    pub notes: Option<String>,
}

/// Deserialize a field that can be absent (None), null (Some(None)), or a value (Some(Some(v))).
fn deserialize_optional_nullable<'de, D, T>(deserializer: D) -> Result<Option<Option<T>>, D::Error>
where
    D: serde::Deserializer<'de>,
    T: serde::Deserialize<'de>,
{
    Ok(Some(Option::deserialize(deserializer)?))
}

// ── Step Relation ────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StepRelation {
    pub id: String,
    pub from_step_id: String,
    pub to_step_id: String,
    pub relation_type: String,
}

// ── Reference Image ─────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReferenceImage {
    pub id: String,
    pub step_id: String,
    pub file_path: String,
    pub caption: Option<String>,
    pub display_order: i32,
    pub created_at: i64,
}

// ── Progress Photo ──────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProgressPhoto {
    pub id: String,
    pub step_id: String,
    pub file_path: String,
    pub captured_at: i64,
    pub created_at: i64,
    pub is_starred: bool,
}

// ── Milestone Photo ─────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MilestonePhoto {
    pub id: String,
    pub track_id: String,
    pub file_path: String,
    pub captured_at: i64,
    pub created_at: i64,
    pub is_starred: bool,
}

// ── Gallery Photo ───────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GalleryPhoto {
    pub id: String,
    pub project_id: String,
    pub file_path: String,
    pub caption: Option<String>,
    pub is_starred: bool,
    pub created_at: i64,
}

// ── Build Log Entry ─────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BuildLogEntry {
    pub id: String,
    pub project_id: String,
    pub entry_type: String,
    pub body: Option<String>,
    pub photo_path: Option<String>,
    pub caption: Option<String>,
    pub step_id: Option<String>,
    pub track_id: Option<String>,
    pub step_number: Option<i32>,
    pub is_track_completion: bool,
    pub track_step_count: Option<i32>,
    pub created_at: i64,
}

#[derive(Debug, Deserialize)]
pub struct CreateBuildLogEntryInput {
    pub project_id: String,
    pub entry_type: String,
    pub body: Option<String>,
    pub step_id: Option<String>,
    pub track_id: Option<String>,
    pub step_number: Option<i32>,
    pub is_track_completion: Option<bool>,
    pub track_step_count: Option<i32>,
}

// ── Drying Timer ────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DryingTimer {
    pub id: String,
    pub step_id: Option<String>,
    pub label: String,
    pub duration_min: i32,
    pub started_at: i64,
}

#[derive(Debug, Deserialize)]
pub struct CreateDryingTimerInput {
    pub step_id: Option<String>,
    pub label: String,
    pub duration_min: i32,
}

// ── Annotations ─────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StepAnnotations {
    pub step_id: String,
    pub data: String,
    pub updated_at: i64,
    pub created_at: i64,
}

// ── Project UI State ────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectUiState {
    pub project_id: String,
    pub active_step_id: Option<String>,
    pub active_track_id: Option<String>,
    pub build_mode: String,
    pub nav_mode: String,
    pub image_zoom: f64,
    pub image_pan_x: f64,
    pub image_pan_y: f64,
    pub updated_at: i64,
}
