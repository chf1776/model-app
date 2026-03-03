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
  build_mode: "setup" | "building";
  nav_mode: "track" | "page";
  image_zoom: number;
  image_pan_x: number;
  image_pan_y: number;
  updated_at: number;
}

export type Zone = "collection" | "build" | "overview";

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
