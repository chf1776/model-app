import { invoke } from "@tauri-apps/api/core";
import type {
  Kit,
  KitFile,
  CreateKitInput,
  UpdateKitInput,
  Accessory,
  CreateAccessoryInput,
  UpdateAccessoryInput,
  Paint,
  CreatePaintInput,
  UpdatePaintInput,
  PaintProjectMapping,
  Project,
  CreateProjectInput,
  InstructionSource,
  InstructionPage,
  ProjectUiState,
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

// ── Accessories ─────────────────────────────────────────────────────────────

export async function listAccessories(): Promise<Accessory[]> {
  return invoke<Accessory[]>("list_accessories");
}

export async function createAccessory(
  input: CreateAccessoryInput,
): Promise<Accessory> {
  return invoke<Accessory>("create_accessory", { input });
}

export async function updateAccessory(
  input: UpdateAccessoryInput,
): Promise<Accessory> {
  return invoke<Accessory>("update_accessory", { input });
}

export async function deleteAccessory(id: string): Promise<void> {
  return invoke<void>("delete_accessory", { id });
}

export async function listAccessoriesForKit(
  kitId: string,
): Promise<Accessory[]> {
  return invoke<Accessory[]>("list_accessories_for_kit", { kitId });
}

// ── Paints ──────────────────────────────────────────────────────────────────

export async function listPaints(): Promise<Paint[]> {
  return invoke<Paint[]>("list_paints");
}

export async function createPaint(input: CreatePaintInput): Promise<Paint> {
  return invoke<Paint>("create_paint", { input });
}

export async function updatePaint(input: UpdatePaintInput): Promise<Paint> {
  return invoke<Paint>("update_paint", { input });
}

export async function deletePaint(id: string): Promise<void> {
  return invoke<void>("delete_paint", { id });
}

// ── Palette Entries (paint ↔ project mappings) ─────────────────────────────

export async function listPaintProjectMappings(): Promise<PaintProjectMapping[]> {
  return invoke<PaintProjectMapping[]>("list_paint_project_mappings");
}

export async function setPaintProjects(
  paintId: string,
  paintName: string,
  projectIds: string[],
): Promise<void> {
  return invoke<void>("set_paint_projects", { paintId, paintName, projectIds });
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

export async function renameProject(id: string, name: string): Promise<void> {
  return invoke<void>("rename_project", { id, name });
}

export async function deleteProject(id: string): Promise<void> {
  return invoke<void>("delete_project", { id });
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

export async function saveAccessoryImage(
  accessoryId: string,
  sourcePath: string,
): Promise<string> {
  return invoke<string>("save_accessory_image", {
    accessoryId,
    sourcePath,
  });
}

export async function saveBoxArt(
  kitId: string,
  sourcePath: string,
): Promise<string> {
  return invoke<string>("save_box_art", {
    kitId,
    sourcePath,
  });
}

// ── Instructions ─────────────────────────────────────────────────────────────

export async function listInstructionSources(
  projectId: string,
): Promise<InstructionSource[]> {
  return invoke<InstructionSource[]>("list_instruction_sources", { projectId });
}

export async function listInstructionPages(
  sourceId: string,
): Promise<InstructionPage[]> {
  return invoke<InstructionPage[]>("list_instruction_pages", { sourceId });
}

export async function uploadInstructionPdf(
  projectId: string,
  sourcePath: string,
  name?: string,
): Promise<InstructionSource> {
  return invoke<InstructionSource>("upload_instruction_pdf", {
    projectId,
    sourcePath,
    name: name ?? null,
  });
}

export async function processInstructionSource(
  sourceId: string,
): Promise<InstructionSource> {
  return invoke<InstructionSource>("process_instruction_source", { sourceId });
}

export async function setPageRotation(
  pageId: string,
  rotation: number,
): Promise<void> {
  return invoke<void>("set_page_rotation", { pageId, rotation });
}

export async function deleteInstructionSource(
  sourceId: string,
): Promise<void> {
  return invoke<void>("delete_instruction_source", { sourceId });
}

export async function getProjectUiState(
  projectId: string,
): Promise<ProjectUiState> {
  return invoke<ProjectUiState>("get_project_ui_state", { projectId });
}

export async function saveViewState(
  projectId: string,
  zoom: number,
  panX: number,
  panY: number,
): Promise<void> {
  return invoke<void>("save_view_state", { projectId, zoom, panX, panY });
}
