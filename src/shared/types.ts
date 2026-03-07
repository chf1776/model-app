export interface Kit {
  id: string;
  name: string;
  manufacturer: string | null;
  scale: string | null;
  kit_number: string | null;
  box_art_path: string | null;
  status: KitStatus;
  category: KitCategory | null;
  scalemates_url: string | null;
  retailer_url: string | null;
  price: number | null;
  currency: string | null;
  notes: string | null;
  created_at: number;
  updated_at: number;
}

export type KitStatus = "wishlist" | "shelf" | "building" | "paused" | "completed";
export type KitCategory =
  | "ship"
  | "aircraft"
  | "armor"
  | "vehicle"
  | "figure"
  | "sci_fi"
  | "other";

export interface CreateKitInput {
  name: string;
  manufacturer?: string | null;
  scale?: string | null;
  kit_number?: string | null;
  status?: KitStatus | null;
  category?: KitCategory | null;
  scalemates_url?: string | null;
  price?: number | null;
  currency?: string | null;
  retailer_url?: string | null;
  notes?: string | null;
}

export interface UpdateKitInput {
  id: string;
  name?: string | null;
  manufacturer?: string | null;
  scale?: string | null;
  kit_number?: string | null;
  box_art_path?: string | null;
  status?: KitStatus | null;
  category?: KitCategory | null;
  scalemates_url?: string | null;
  retailer_url?: string | null;
  price?: number | null;
  currency?: string | null;
  notes?: string | null;
}

export interface KitFile {
  id: string;
  kit_id: string;
  file_path: string;
  file_type: "pdf" | "image";
  label: string | null;
  display_order: number;
  created_at: number;
}

export interface Project {
  id: string;
  name: string;
  kit_id: string | null;
  status: ProjectStatus;
  category: KitCategory | null;
  scalemates_url: string | null;
  product_code: string | null;
  start_date: number | null;
  completion_date: number | null;
  notes: string | null;
  created_at: number;
  updated_at: number;
  kit_name: string | null;
  kit_scale: string | null;
  kit_box_art_path: string | null;
}

export type ProjectStatus = "active" | "paused" | "completed" | "archived";

export interface CreateProjectInput {
  name: string;
  kit_id?: string | null;
  new_kit_name?: string | null;
  new_kit_manufacturer?: string | null;
  new_kit_scale?: string | null;
  category?: KitCategory | null;
  scalemates_url?: string | null;
  product_code?: string | null;
}

// ── Accessories ──────────────────────────────────────────────────────────────

export type AccessoryType = "pe" | "resin_3d" | "decal" | "other";
export type AccessoryStatus = "shelf" | "wishlist";

export interface Accessory {
  id: string;
  name: string;
  type: AccessoryType;
  manufacturer: string | null;
  brand: string | null;
  reference_code: string | null;
  parent_kit_id: string | null;
  status: AccessoryStatus;
  price: number | null;
  currency: string | null;
  buy_url: string | null;
  image_path: string | null;
  notes: string | null;
  created_at: number;
  updated_at: number;
  parent_kit_name: string | null;
}

export interface CreateAccessoryInput {
  name: string;
  type: AccessoryType;
  manufacturer?: string | null;
  brand?: string | null;
  reference_code?: string | null;
  parent_kit_id?: string | null;
  status?: AccessoryStatus | null;
  price?: number | null;
  currency?: string | null;
  buy_url?: string | null;
  image_path?: string | null;
  notes?: string | null;
}

export interface UpdateAccessoryInput {
  id: string;
  name?: string | null;
  type?: AccessoryType | null;
  manufacturer?: string | null;
  brand?: string | null;
  reference_code?: string | null;
  parent_kit_id?: string | null;
  status?: AccessoryStatus | null;
  price?: number | null;
  currency?: string | null;
  buy_url?: string | null;
  image_path?: string | null;
  notes?: string | null;
}

export const ACCESSORY_TYPE_COLORS: Record<AccessoryType, string> = {
  pe: "#7B5EA7",
  resin_3d: "#C47A2A",
  decal: "#3A7CA5",
  other: "#5B8A3C",
};

export const ACCESSORY_TYPE_LABELS: Record<AccessoryType, string> = {
  pe: "Photo-Etch",
  resin_3d: "Resin / 3D",
  decal: "Decals",
  other: "Other",
};

// ── Paints ──────────────────────────────────────────────────────────────────

export type PaintType = "acrylic" | "enamel" | "lacquer" | "oil";
export type PaintFinish = "flat" | "semi_gloss" | "gloss" | "metallic" | "clear" | "satin";
export type PaintStatus = "owned" | "wishlist";
export type ColorFamily =
  | "reds_oranges"
  | "yellows"
  | "greens"
  | "blues"
  | "purples"
  | "browns"
  | "greys"
  | "whites"
  | "blacks";

export interface Paint {
  id: string;
  brand: string;
  name: string;
  reference_code: string | null;
  type: PaintType;
  finish: PaintFinish | null;
  color: string | null;
  color_family: ColorFamily | null;
  status: PaintStatus;
  price: number | null;
  currency: string | null;
  buy_url: string | null;
  price_updated_at: number | null;
  notes: string | null;
  created_at: number;
  updated_at: number;
}

export interface CreatePaintInput {
  brand: string;
  name: string;
  type: PaintType;
  reference_code?: string | null;
  finish?: PaintFinish | null;
  color?: string | null;
  color_family?: ColorFamily | null;
  status?: PaintStatus | null;
  price?: number | null;
  currency?: string | null;
  buy_url?: string | null;
  notes?: string | null;
}

export interface UpdatePaintInput {
  id: string;
  brand?: string | null;
  name?: string | null;
  type?: PaintType | null;
  reference_code?: string | null;
  finish?: PaintFinish | null;
  color?: string | null;
  color_family?: ColorFamily | null;
  status?: PaintStatus | null;
  price?: number | null;
  currency?: string | null;
  buy_url?: string | null;
  notes?: string | null;
}

export const PAINT_TYPE_LABELS: Record<PaintType, string> = {
  acrylic: "Acrylic",
  enamel: "Enamel",
  lacquer: "Lacquer",
  oil: "Oil",
};

export const PAINT_FINISH_LABELS: Record<PaintFinish, string> = {
  flat: "Flat",
  semi_gloss: "Semi-Gloss",
  gloss: "Gloss",
  metallic: "Metallic",
  clear: "Clear",
  satin: "Satin",
};

export const COLOR_FAMILY_LABELS: Record<ColorFamily, string> = {
  reds_oranges: "Reds & Oranges",
  yellows: "Yellows",
  greens: "Greens",
  blues: "Blues",
  purples: "Purples",
  browns: "Browns",
  greys: "Greys",
  whites: "Whites",
  blacks: "Blacks",
};

export const COLOR_FAMILY_ORDER: ColorFamily[] = [
  "reds_oranges",
  "yellows",
  "greens",
  "blues",
  "purples",
  "browns",
  "greys",
  "whites",
  "blacks",
];

export type PaintGroupBy = "color_family" | "brand" | "project";

export interface PaintProjectMapping {
  paint_id: string;
  project_id: string;
  project_name: string;
}
export type PaintViewMode = "list" | "grid";
export interface PaintGroupExpandedState {
  base: boolean;
  overrides: Record<string, boolean>;
}

// ── Tracks ──────────────────────────────────────────────────────────────────

export interface Track {
  id: string;
  project_id: string;
  name: string;
  color: string;
  display_order: number;
  is_standalone: boolean;
  join_point_step_id: string | null;
  join_point_notes: string | null;
  step_count: number;
  completed_count: number;
  created_at: number;
  updated_at: number;
}

export interface CreateTrackInput {
  project_id: string;
  name: string;
  color?: string | null;
}

export interface UpdateTrackInput {
  id: string;
  name?: string | null;
  color?: string | null;
}

export const TRACK_COLORS = [
  { value: "#C2553A", label: "Terracotta" },
  { value: "#3A7CA5", label: "Steel Blue" },
  { value: "#5B8A3C", label: "Olive" },
  { value: "#C49A2A", label: "Gold" },
  { value: "#7B5EA7", label: "Purple" },
  { value: "#C47A2A", label: "Burnt Orange" },
  { value: "#2A8A7A", label: "Teal" },
  { value: "#8B5E6B", label: "Mauve" },
] as const;

// ── Tags ────────────────────────────────────────────────────────────────────

export interface Tag {
  id: string;
  name: string;
  created_at: number;
}

export const PREDEFINED_TAGS = [
  "Dry Fit",
  "Paint First",
  "Filler Needed",
  "Masking",
  "Decals",
  "Clear Coat",
  "Weathering",
  "Rigging",
  "Fragile",
  "Optional",
] as const;

// ── Steps ───────────────────────────────────────────────────────────────────

export type SourceType = "base_kit" | "photo_etch" | "resin_3d" | "aftermarket" | "custom_scratch";
export type AdhesiveType = "none" | "liquid_cement" | "tube_cement" | "ca_thin" | "ca_medium_thick" | "epoxy" | "pva" | "custom";

export const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
  base_kit: "Base Kit",
  photo_etch: "Photo-Etch",
  resin_3d: "Resin / 3D",
  aftermarket: "Aftermarket",
  custom_scratch: "Scratch-Built",
};

export const ADHESIVE_TYPE_LABELS: Record<AdhesiveType, string> = {
  none: "None",
  liquid_cement: "Liquid Cement",
  tube_cement: "Tube Cement",
  ca_thin: "CA (Thin)",
  ca_medium_thick: "CA (Medium/Thick)",
  epoxy: "Epoxy",
  pva: "PVA / White Glue",
  custom: "Custom",
};

export interface Step {
  id: string;
  track_id: string;
  parent_step_id: string | null;
  title: string;
  display_order: number;
  source_page_id: string | null;
  crop_x: number | null;
  crop_y: number | null;
  crop_w: number | null;
  crop_h: number | null;
  is_full_page: boolean;
  source_type: SourceType;
  source_name: string | null;
  adhesive_type: AdhesiveType | null;
  drying_time_min: number | null;
  pre_paint: boolean;
  quantity: number | null;
  is_completed: boolean;
  completed_at: number | null;
  quantity_current: number;
  replaces_step_id: string | null;
  notes: string | null;
  created_at: number;
  updated_at: number;
}

export interface CreateStepInput {
  track_id: string;
  title: string;
  parent_step_id?: string | null;
  source_page_id?: string | null;
  crop_x?: number | null;
  crop_y?: number | null;
  crop_w?: number | null;
  crop_h?: number | null;
  is_full_page?: boolean | null;
  source_type?: SourceType | null;
  source_name?: string | null;
  adhesive_type?: AdhesiveType | null;
  drying_time_min?: number | null;
  pre_paint?: boolean | null;
  quantity?: number | null;
  notes?: string | null;
}

export interface UpdateStepInput {
  id: string;
  track_id?: string | null;
  title?: string | null;
  parent_step_id?: string | null;
  source_page_id?: string | null;
  crop_x?: number | null;
  crop_y?: number | null;
  crop_w?: number | null;
  crop_h?: number | null;
  is_full_page?: boolean | null;
  source_type?: SourceType | null;
  source_name?: string | null;
  adhesive_type?: AdhesiveType | null;
  drying_time_min?: number | null;
  pre_paint?: boolean | null;
  quantity?: number | null;
  quantity_current?: number | null;
  is_completed?: boolean | null;
  replaces_step_id?: string | null;
  notes?: string | null;
}

// ── Step Relations ──────────────────────────────────────────────────────────

export type StepRelationType = "blocked_by" | "blocks_access_to";

export interface StepRelation {
  id: string;
  from_step_id: string;
  to_step_id: string;
  relation_type: StepRelationType;
}

// ── Reference Images ─────────────────────────────────────────────────────────

export interface ReferenceImage {
  id: string;
  step_id: string;
  file_path: string;
  caption: string | null;
  display_order: number;
  created_at: number;
}

// ── Progress Photos ─────────────────────────────────────────────────────────

export interface ProgressPhoto {
  id: string;
  step_id: string;
  file_path: string;
  captured_at: number;
  created_at: number;
}

// ── Milestone Photos ────────────────────────────────────────────────────────

export interface MilestonePhoto {
  id: string;
  track_id: string;
  file_path: string;
  captured_at: number;
  created_at: number;
}

// ── Build Log Entries ───────────────────────────────────────────────────────

export type BuildLogEntryType = "step_complete" | "note" | "photo" | "milestone" | "build_complete";

export interface BuildLogEntry {
  id: string;
  project_id: string;
  entry_type: BuildLogEntryType;
  body: string | null;
  photo_path: string | null;
  caption: string | null;
  step_id: string | null;
  track_id: string | null;
  step_number: number | null;
  is_track_completion: boolean;
  track_step_count: number | null;
  created_at: number;
}

// ── Drying Timers ───────────────────────────────────────────────────────────

export interface DryingTimer {
  id: string;
  step_id: string | null;
  label: string;
  duration_min: number;
  started_at: number;
}

// Practical "safe to handle" times based on manufacturer specs and modeller consensus
export const ADHESIVE_DEFAULT_MINUTES: Partial<Record<AdhesiveType, number>> = {
  liquid_cement: 10,    // extra-thin poly cement: 5–10 min handling time
  tube_cement: 20,      // thick poly cement: 15–20 min handling time
  ca_thin: 2,           // thin CA: sets 1–3 sec, safe to handle ~2 min
  ca_medium_thick: 5,   // medium/thick CA: sets 10–60 sec, safe ~5 min
  epoxy: 30,            // 5-min epoxy: sets 5–10 min, safe to handle ~30 min
  pva: 30,              // PVA/white glue: firm hold in ~30 min
};

export function getEffectiveDryingMinutes(step: Step): number | null {
  if (step.drying_time_min && step.drying_time_min > 0) return step.drying_time_min;
  if (step.adhesive_type) return ADHESIVE_DEFAULT_MINUTES[step.adhesive_type] ?? null;
  return null;
}

export function parsePositiveMinutes(input: string): number | null {
  const n = parseInt(input, 10);
  return n > 0 ? n : null;
}

// ── Instruction Sources ──────────────────────────────────────────────────────

export interface InstructionSource {
  id: string;
  project_id: string;
  name: string;
  original_filename: string;
  file_path: string;
  page_count: number;
  display_order: number;
  created_at: number;
}

export interface InstructionPage {
  id: string;
  source_id: string;
  page_index: number;
  file_path: string;
  width: number;
  height: number;
  rotation: number;
}

export interface ProjectUiState {
  project_id: string;
  active_step_id: string | null;
  active_track_id: string | null;
  build_mode: "setup" | "building";
  nav_mode: "track" | "page";
  image_zoom: number;
  image_pan_x: number;
  image_pan_y: number;
  updated_at: number;
}

export type Zone = "collection" | "build" | "overview";

export const IMAGE_FILE_FILTER = {
  name: "Images",
  extensions: ["png", "jpg", "jpeg", "webp"],
};

export const KIT_CATEGORIES: { value: KitCategory; label: string }[] = [
  { value: "ship", label: "Ship" },
  { value: "aircraft", label: "Aircraft" },
  { value: "armor", label: "Armor" },
  { value: "vehicle", label: "Vehicle" },
  { value: "figure", label: "Figure" },
  { value: "sci_fi", label: "Sci-Fi" },
  { value: "other", label: "Other" },
];

export const COMMON_SCALES = [
  "1/350",
  "1/700",
  "1/72",
  "1/48",
  "1/35",
  "1/144",
  "1/32",
];

export const STATUS_COLORS: Record<KitStatus, string> = {
  building: "var(--color-status-building)",
  shelf: "var(--color-status-shelf)",
  wishlist: "var(--color-status-wishlist)",
  completed: "var(--color-status-completed)",
  paused: "var(--color-status-building)",
};

export const STATUS_LABELS: Record<KitStatus, string> = {
  building: "Building",
  shelf: "On Shelf",
  wishlist: "Wishlist",
  completed: "Completed",
  paused: "Paused",
};
