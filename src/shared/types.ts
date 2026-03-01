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
