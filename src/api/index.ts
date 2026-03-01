import { invoke } from "@tauri-apps/api/core";
import type {
  Kit,
  KitFile,
  CreateKitInput,
  UpdateKitInput,
  Project,
  CreateProjectInput,
} from "@/shared/types";

// ── Kits ────────────────────────────────────────────────────────────────────

export async function listKits(): Promise<Kit[]> {
  return invoke<Kit[]>("list_kits");
}

export async function createKit(input: CreateKitInput): Promise<Kit> {
  return invoke<Kit>("create_kit", { input });
}

export async function updateKit(input: UpdateKitInput): Promise<Kit> {
  return invoke<Kit>("update_kit", { input });
}

export async function deleteKit(id: string): Promise<void> {
  return invoke<void>("delete_kit", { id });
}

// ── Kit Files ──────────────────────────────────────────────────────────────

export async function listKitFiles(kitId: string): Promise<KitFile[]> {
  return invoke<KitFile[]>("list_kit_files", { kitId });
}

export async function attachKitFile(
  kitId: string,
  sourcePath: string,
  label: string | null,
): Promise<KitFile> {
  return invoke<KitFile>("attach_kit_file", { kitId, sourcePath, label });
}

export async function deleteKitFile(fileId: string): Promise<void> {
  return invoke<void>("delete_kit_file", { fileId });
}

// ── Projects ────────────────────────────────────────────────────────────────

export async function listProjects(): Promise<Project[]> {
  return invoke<Project[]>("list_projects");
}

export async function getProject(id: string): Promise<Project> {
  return invoke<Project>("get_project", { id });
}

export async function createProject(
  input: CreateProjectInput,
): Promise<Project> {
  return invoke<Project>("create_project", { input });
}

export async function setActiveProject(id: string): Promise<void> {
  return invoke<void>("set_active_project", { id });
}

export async function getActiveProject(): Promise<Project | null> {
  return invoke<Project | null>("get_active_project");
}

// ── Settings ────────────────────────────────────────────────────────────────

export async function getSetting(key: string): Promise<string> {
  return invoke<string>("get_setting", { key });
}

export async function setSetting(key: string, value: string): Promise<void> {
  return invoke<void>("set_setting", { key, value });
}

// ── Media ───────────────────────────────────────────────────────────────────

export async function saveBoxArt(
  kitId: string,
  sourcePath: string,
): Promise<string> {
  return invoke<string>("save_box_art", {
    kitId,
    sourcePath,
  });
}
