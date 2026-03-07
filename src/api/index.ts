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
  Track,
  CreateTrackInput,
  UpdateTrackInput,
  Step,
  CreateStepInput,
  UpdateStepInput,
  Tag,
  StepRelation,
  ReferenceImage,
  ProgressPhoto,
  MilestonePhoto,
  BuildLogEntry,
  BuildLogEntryType,
  DryingTimer,
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

export async function listAccessoriesForProject(
  projectId: string,
): Promise<Accessory[]> {
  return invoke<Accessory[]>("list_accessories_for_project", { projectId });
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

export async function listPaintsForProject(projectId: string): Promise<Paint[]> {
  return invoke<Paint[]>("list_paints_for_project", { projectId });
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

// ── Tracks ──────────────────────────────────────────────────────────────────

export async function listTracks(projectId: string): Promise<Track[]> {
  return invoke<Track[]>("list_tracks", { projectId });
}

export async function createTrack(input: CreateTrackInput): Promise<Track> {
  return invoke<Track>("create_track", { input });
}

export async function updateTrack(input: UpdateTrackInput): Promise<Track> {
  return invoke<Track>("update_track", { input });
}

export async function deleteTrack(id: string): Promise<void> {
  return invoke<void>("delete_track", { id });
}

export async function setTrackJoinPoint(
  id: string,
  joinPointStepId: string | null,
  joinPointNotes: string | null,
): Promise<Track> {
  return invoke<Track>("set_track_join_point", {
    id,
    joinPointStepId,
    joinPointNotes,
  });
}

export async function reorderTracks(
  projectId: string,
  orderedIds: string[],
): Promise<void> {
  return invoke<void>("reorder_tracks", { projectId, orderedIds });
}

// ── Steps ───────────────────────────────────────────────────────────────────

export async function listSteps(trackId: string): Promise<Step[]> {
  return invoke<Step[]>("list_steps", { trackId });
}

export async function listProjectSteps(projectId: string): Promise<Step[]> {
  return invoke<Step[]>("list_project_steps", { projectId });
}

export async function createStep(input: CreateStepInput): Promise<Step> {
  return invoke<Step>("create_step", { input });
}

export async function updateStep(input: UpdateStepInput): Promise<Step> {
  return invoke<Step>("update_step", { input });
}

export async function deleteStep(id: string): Promise<void> {
  return invoke<void>("delete_step", { id });
}

export async function deleteStepAndReorder(id: string): Promise<void> {
  return invoke<void>("delete_step_and_reorder", { id });
}

export async function reorderSteps(
  trackId: string,
  orderedIds: string[],
): Promise<void> {
  return invoke<void>("reorder_steps", { trackId, orderedIds });
}

export async function setStepParent(
  id: string,
  parentStepId: string | null,
): Promise<Step> {
  return invoke<Step>("set_step_parent", { id, parentStepId });
}

export async function reorderChildrenSteps(
  trackId: string,
  parentStepId: string,
  orderedIds: string[],
): Promise<void> {
  return invoke<void>("reorder_children_steps", {
    trackId,
    parentStepId,
    orderedIds,
  });
}

// ── Tags ────────────────────────────────────────────────────────────────────

export async function listTags(): Promise<Tag[]> {
  return invoke<Tag[]>("list_tags");
}

export async function listStepTags(stepId: string): Promise<Tag[]> {
  return invoke<Tag[]>("list_step_tags", { stepId });
}

export async function setStepTags(
  stepId: string,
  tagNames: string[],
): Promise<Tag[]> {
  return invoke<Tag[]>("set_step_tags", { stepId, tagNames });
}

// ── Step Relations ───────────────────────────────────────────────────────────

export async function listStepRelations(stepId: string): Promise<StepRelation[]> {
  return invoke<StepRelation[]>("list_step_relations", { stepId });
}

export async function setStepRelations(
  stepId: string,
  relations: { target_step_id: string; relation_type: string }[],
): Promise<StepRelation[]> {
  return invoke<StepRelation[]>("set_step_relations", { stepId, relations });
}

// ── Reference Images ─────────────────────────────────────────────────────────

export async function listReferenceImages(stepId: string): Promise<ReferenceImage[]> {
  return invoke<ReferenceImage[]>("list_reference_images", { stepId });
}

export async function addReferenceImage(
  stepId: string,
  sourcePath: string,
  caption?: string | null,
): Promise<ReferenceImage> {
  return invoke<ReferenceImage>("add_reference_image", {
    stepId,
    sourcePath,
    caption: caption ?? null,
  });
}

export async function updateReferenceImageCaption(
  id: string,
  caption: string | null,
): Promise<ReferenceImage> {
  return invoke<ReferenceImage>("update_reference_image_caption", { id, caption });
}

export async function deleteReferenceImage(id: string): Promise<void> {
  return invoke<void>("delete_reference_image", { id });
}

// ── Progress Photos ──────────────────────────────────────────────────────────

export async function addProgressPhoto(
  stepId: string,
  sourcePath: string,
): Promise<ProgressPhoto> {
  return invoke<ProgressPhoto>("add_progress_photo", { stepId, sourcePath });
}

export async function listProjectProgressPhotos(projectId: string): Promise<ProgressPhoto[]> {
  return invoke<ProgressPhoto[]>("list_project_progress_photos", { projectId });
}

export async function listProgressPhotos(stepId: string): Promise<ProgressPhoto[]> {
  return invoke<ProgressPhoto[]>("list_progress_photos", { stepId });
}

// ── Milestone Photos ────────────────────────────────────────────────────────

export async function listProjectMilestonePhotos(projectId: string): Promise<MilestonePhoto[]> {
  return invoke<MilestonePhoto[]>("list_project_milestone_photos", { projectId });
}

export async function addMilestonePhoto(
  trackId: string,
  sourcePath: string,
): Promise<MilestonePhoto> {
  return invoke<MilestonePhoto>("add_milestone_photo", { trackId, sourcePath });
}

// ── Build Log ───────────────────────────────────────────────────────────────

export async function listBuildLogEntries(projectId: string): Promise<BuildLogEntry[]> {
  return invoke<BuildLogEntry[]>("list_build_log_entries", { projectId });
}

export async function addBuildLogEntry(opts: {
  projectId: string;
  entryType: BuildLogEntryType;
  body?: string | null;
  stepId?: string | null;
  trackId?: string | null;
  stepNumber?: number | null;
  isTrackCompletion?: boolean | null;
  trackStepCount?: number | null;
}): Promise<BuildLogEntry> {
  return invoke<BuildLogEntry>("add_build_log_entry", {
    projectId: opts.projectId,
    entryType: opts.entryType,
    body: opts.body ?? null,
    stepId: opts.stepId ?? null,
    trackId: opts.trackId ?? null,
    stepNumber: opts.stepNumber ?? null,
    isTrackCompletion: opts.isTrackCompletion ?? null,
    trackStepCount: opts.trackStepCount ?? null,
  });
}

// ── Drying Timers ────────────────────────────────────────────────────────────

export async function listDryingTimers(): Promise<DryingTimer[]> {
  return invoke<DryingTimer[]>("list_drying_timers");
}

export async function createDryingTimer(input: {
  step_id: string | null;
  label: string;
  duration_min: number;
}): Promise<DryingTimer> {
  return invoke<DryingTimer>("create_drying_timer", { input });
}

export async function deleteDryingTimer(id: string): Promise<void> {
  return invoke<void>("delete_drying_timer", { id });
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

export async function saveBuildMode(
  projectId: string,
  buildMode: string,
): Promise<void> {
  return invoke<void>("save_build_mode", { projectId, buildMode });
}

export async function saveActiveTrack(
  projectId: string,
  activeTrackId: string | null,
): Promise<void> {
  return invoke<void>("save_active_track", { projectId, activeTrackId });
}

export async function saveViewState(
  projectId: string,
  zoom: number,
  panX: number,
  panY: number,
): Promise<void> {
  return invoke<void>("save_view_state", { projectId, zoom, panX, panY });
}
