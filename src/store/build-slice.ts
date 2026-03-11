import type { StateCreator } from "zustand";
import type { Project, UpdateProjectInput, InstructionSource, InstructionPage, Track, Step, Tag, StepRelation, ReferenceImage, Annotation, AnnotationTool, PaletteEntry } from "@/shared/types";
import { getEffectiveDryingMinutes, ANNOTATION_TOOL_LABELS } from "@/shared/types";
import type { AppStore } from "./index";
import * as api from "@/api";
import { toast } from "sonner";
import { flattenTrackSteps } from "@/components/build/tree-utils";

export type CanvasMode = "view" | "crop";
export type BuildMode = "setup" | "building";

const MAX_ANNOTATION_UNDO = 50;

/** Push current annotations to undo stack and clear redo. Returns partial state for set(). */
function annotationUndoSnapshot(
  s: { annotationUndoStacks: Record<string, Annotation[][]>; annotationRedoStacks: Record<string, Annotation[][]> },
  stepId: string,
  current: Annotation[],
) {
  return {
    annotationUndoStacks: {
      ...s.annotationUndoStacks,
      [stepId]: [...(s.annotationUndoStacks[stepId] ?? []), current].slice(-MAX_ANNOTATION_UNDO),
    },
    annotationRedoStacks: { ...s.annotationRedoStacks, [stepId]: [] },
  };
}
export type NavMode = "track" | "page";

export interface BuildSlice {
  activeProjectId: string | null;
  project: Project | null;
  projects: Project[];
  loadProjects: () => Promise<void>;
  setActiveProject: (id: string) => Promise<void>;
  updateProject: (input: UpdateProjectInput) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;
  clearActiveProject: () => void;
  loadActiveProject: () => Promise<void>;

  // Tracks
  tracks: Track[];
  activeTrackId: string | null;
  expandedTrackIds: string[];
  loadTracks: (projectId: string) => Promise<void>;
  addTrack: (track: Track) => void;
  updateTrackStore: (track: Track) => void;
  removeTrack: (id: string) => void;
  setActiveTrack: (id: string | null) => void;
  setExpandedTrack: (id: string) => void;
  toggleTrackExpanded: (id: string) => void;
  expandAllTracks: () => void;
  collapseAllTracks: () => void;

  // Steps
  steps: Step[];
  activeStepId: string | null;
  loadSteps: (projectId: string) => Promise<void>;
  addStep: (step: Step) => void;
  updateStepStore: (step: Step) => void;
  removeStep: (id: string) => void;
  setActiveStep: (id: string | null) => void;

  // Multi-select
  selectedStepIds: string[];
  selectionAnchorId: string | null;
  selectStep: (id: string) => void;
  toggleStepInSelection: (id: string) => void;
  shiftSelectSteps: (id: string) => void;
  clearSelectedSteps: () => void;

  // Tags
  stepTags: Record<string, Tag[]>;
  loadStepTags: (stepId: string) => Promise<void>;
  setStepTags: (stepId: string, tagNames: string[]) => Promise<void>;

  // Step relations
  stepRelations: Record<string, StepRelation[]>;
  loadStepRelations: (stepId: string) => Promise<void>;
  setStepRelations: (stepId: string, relations: { target_step_id: string; relation_type: string }[]) => Promise<void>;

  // Step paint refs
  stepPaintRefs: Record<string, string[]>;
  projectPaletteEntries: PaletteEntry[];
  loadStepPaintRefs: (stepId: string) => Promise<void>;
  setStepPaintRefs: (stepId: string, entryIds: string[]) => Promise<void>;

  // Reference images
  stepReferenceImages: Record<string, ReferenceImage[]>;
  loadStepReferenceImages: (stepId: string) => Promise<void>;
  addReferenceImageStore: (img: ReferenceImage) => void;
  updateReferenceImageStore: (img: ReferenceImage) => void;
  removeReferenceImageStore: (stepId: string, id: string) => void;

  // Annotations
  annotationMode: AnnotationTool;
  annotationColor: string;
  annotationStrokeWidth: number;
  stepAnnotations: Record<string, Annotation[]>;
  loadAnnotations: (stepId: string) => Promise<void>;
  saveAnnotationsDebounced: (stepId: string) => void;
  addAnnotation: (stepId: string, annotation: Annotation) => void;
  removeAnnotation: (stepId: string, annotationId: string) => void;
  clearAnnotations: (stepId: string) => void;
  updateAnnotation: (stepId: string, annotationId: string, updates: Partial<Annotation>) => void;
  setAnnotationMode: (mode: AnnotationTool) => void;
  setAnnotationColor: (color: string) => void;
  setAnnotationStrokeWidth: (width: number) => void;
  // Annotation undo/redo (per-step snapshot stacks)
  annotationUndoStacks: Record<string, Annotation[][]>;
  annotationRedoStacks: Record<string, Annotation[][]>;
  undoAnnotation: (stepId: string) => void;
  redoAnnotation: (stepId: string) => void;
  // Undo
  undoStack: string[];
  pushUndo: (stepId: string) => void;
  undoLastCrop: () => Promise<void>;

  // Instruction sources
  instructionSources: InstructionSource[];
  loadInstructionSources: (projectId: string) => Promise<void>;
  addInstructionSource: (source: InstructionSource) => void;
  removeInstructionSource: (id: string) => void;

  // Current page state
  currentSourceId: string | null;
  currentSourcePages: InstructionPage[];
  currentPageIndex: number;
  setCurrentSource: (sourceId: string) => Promise<void>;
  setCurrentPageIndex: (index: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  rotatePage: () => Promise<void>;

  // Viewer state
  viewerZoom: number;
  viewerPanX: number;
  viewerPanY: number;
  fitToViewTrigger: number;
  focusCropTrigger: number;
  setViewerZoom: (zoom: number) => void;
  setViewerPan: (x: number, y: number) => void;
  resetViewerState: () => void;
  requestFitToView: () => void;

  // Build mode
  buildMode: BuildMode;
  setBuildMode: (mode: BuildMode) => void;
  completeActiveStep: () => Promise<void>;

  // Nav mode
  navMode: NavMode;
  setNavMode: (mode: NavMode) => void;

  // Milestone
  pendingMilestone: { trackId: string; trackName: string; trackColor: string } | null;
  dismissMilestone: () => void;

  // Canvas mode
  canvasMode: CanvasMode;
  setCanvasMode: (mode: CanvasMode) => void;

  // Processing state
  isProcessingPdf: boolean;
  setIsProcessingPdf: (processing: boolean) => void;
}

const DEFAULT_PAGE_STATE = {
  currentSourceId: null as string | null,
  currentSourcePages: [] as InstructionPage[],
  currentPageIndex: 0,
};

const DEFAULT_BUILD_STATE = {
  tracks: [] as Track[],
  activeTrackId: null as string | null,
  expandedTrackIds: [] as string[],
  steps: [] as Step[],
  activeStepId: null as string | null,
  selectedStepIds: [] as string[],
  selectionAnchorId: null as string | null,
  undoStack: [] as string[],
  stepTags: {} as Record<string, Tag[]>,
  stepPaintRefs: {} as Record<string, string[]>,
  projectPaletteEntries: [] as PaletteEntry[],
  stepRelations: {} as Record<string, StepRelation[]>,
  stepReferenceImages: {} as Record<string, ReferenceImage[]>,
  stepAnnotations: {} as Record<string, Annotation[]>,
  annotationMode: null as AnnotationTool,
  annotationColor: "#ef4444",
  annotationStrokeWidth: 0.003,
  annotationUndoStacks: {} as Record<string, Annotation[][]>,
  annotationRedoStacks: {} as Record<string, Annotation[][]>,
  buildMode: "setup" as BuildMode,
  navMode: "track" as NavMode,
  pendingMilestone: null as { trackId: string; trackName: string; trackColor: string } | null,
};

const DEFAULT_VIEWER_STATE = {
  viewerZoom: 1,
  viewerPanX: 0,
  viewerPanY: 0,
};

export const createBuildSlice: StateCreator<AppStore, [], [], BuildSlice> = (
  set,
  get,
) => ({
  activeProjectId: null,
  project: null,
  projects: [],

  ...DEFAULT_BUILD_STATE,

  // Instruction sources
  instructionSources: [],
  ...DEFAULT_PAGE_STATE,

  // Viewer state
  ...DEFAULT_VIEWER_STATE,
  fitToViewTrigger: 0,
  focusCropTrigger: 0,

  // Canvas mode
  canvasMode: "view" as CanvasMode,

  // Processing state
  isProcessingPdf: false,

  loadProjects: async () => {
    const projects = await api.listProjects();
    set({ projects });
  },

  updateProject: async (input) => {
    const updated = await api.updateProject(input);
    set((s) => ({
      project: updated,
      projects: s.projects.map((p) => (p.id === updated.id ? updated : p)),
    }));
    return updated;
  },

  deleteProject: async (id) => {
    await api.deleteProject(id);
    const state = get();
    if (state.activeProjectId === id) {
      set({
        activeProjectId: null,
        project: null,
        ...DEFAULT_BUILD_STATE,
        instructionSources: [],
        ...DEFAULT_PAGE_STATE,
      });
    }
    // Reload projects list
    const projects = await api.listProjects();
    set({ projects });
  },

  setActiveProject: async (id) => {
    await api.setActiveProject(id);
    const [project, uiState] = await Promise.all([
      api.getProject(id),
      api.getProjectUiState(id),
    ]);
    set({
      activeProjectId: id,
      project,
      ...DEFAULT_BUILD_STATE,
      buildMode: uiState.build_mode === "building" ? "building" : "setup",
      navMode: uiState.nav_mode === "page" ? "page" : "track",
      activeTrackId: uiState.active_track_id ?? null,
      canvasMode: "view" as CanvasMode,
      ...DEFAULT_PAGE_STATE,
      ...DEFAULT_VIEWER_STATE,
    });
    // Load instruction sources, tracks, steps, and palette entries for the new project
    const [,,,paletteEntries] = await Promise.all([
      get().loadInstructionSources(id),
      get().loadTracks(id),
      get().loadSteps(id),
      api.listPaletteEntries(id),
    ]);
    set({ projectPaletteEntries: paletteEntries });
  },

  clearActiveProject: () =>
    set({
      activeProjectId: null,
      project: null,
      ...DEFAULT_BUILD_STATE,
      instructionSources: [],
      ...DEFAULT_PAGE_STATE,
    }),

  loadActiveProject: async () => {
    const project = await api.getActiveProject();
    if (project) {
      const uiState = await api.getProjectUiState(project.id);
      set({
        activeProjectId: project.id,
        project,
        buildMode: uiState.build_mode === "building" ? "building" : "setup",
        navMode: uiState.nav_mode === "page" ? "page" : "track",
        activeTrackId: uiState.active_track_id ?? null,
      });
      // Fire all loads in parallel
      const [,,,paletteEntries] = await Promise.all([
        get().loadInstructionSources(project.id),
        get().loadTracks(project.id),
        get().loadSteps(project.id),
        api.listPaletteEntries(project.id),
      ]);
      set({ projectPaletteEntries: paletteEntries });
    }
  },

  loadTracks: async (projectId) => {
    const tracks = await api.listTracks(projectId);
    set({ tracks });
  },

  addTrack: (track) => {
    set((s) => ({ tracks: [...s.tracks, track] }));
  },

  updateTrackStore: (track) => {
    set((s) => ({
      tracks: s.tracks.map((t) => (t.id === track.id ? track : t)),
    }));
  },

  removeTrack: (id) => {
    set((s) => ({
      tracks: s.tracks.filter((t) => t.id !== id),
      activeTrackId: s.activeTrackId === id ? null : s.activeTrackId,
      expandedTrackIds: s.expandedTrackIds.filter((eid) => eid !== id),
    }));
  },

  setActiveTrack: (id) => {
    if (id) {
      set((s) => ({
        activeTrackId: id,
        expandedTrackIds: s.expandedTrackIds.includes(id)
          ? s.expandedTrackIds
          : [...s.expandedTrackIds, id],
      }));
    } else {
      set({ activeTrackId: null });
    }
    // Persist to DB (fire-and-forget)
    const projectId = get().activeProjectId;
    if (projectId) {
      api.saveActiveTrack(projectId, id);
    }
  },

  setExpandedTrack: (id) => {
    set({ activeTrackId: id, expandedTrackIds: [id] });
  },

  toggleTrackExpanded: (id) => {
    set((s) => {
      const isExpanded = s.expandedTrackIds.includes(id);
      if (isExpanded) {
        return {
          expandedTrackIds: s.expandedTrackIds.filter((eid) => eid !== id),
        };
      }
      return {
        activeTrackId: id,
        expandedTrackIds: [...s.expandedTrackIds, id],
      };
    });
  },

  expandAllTracks: () => {
    set((s) => ({
      expandedTrackIds: s.tracks.map((t) => t.id),
    }));
  },

  collapseAllTracks: () => {
    set({ expandedTrackIds: [] });
  },

  loadSteps: async (projectId) => {
    const steps = await api.listProjectSteps(projectId);
    set({ steps });
  },

  addStep: (step) => {
    set((s) => ({ steps: [...s.steps, step] }));
  },

  updateStepStore: (step) => {
    set((s) => ({
      steps: s.steps.map((st) => (st.id === step.id ? step : st)),
    }));
  },

  removeStep: (id) => {
    set((s) => {
      // Clean up per-step cached data to prevent memory leaks
      const { [id]: _tags, ...restTags } = s.stepTags;
      const { [id]: _paintRefs, ...restPaintRefs } = s.stepPaintRefs;
      const { [id]: _rels, ...restRelations } = s.stepRelations;
      const { [id]: _refs, ...restReferenceImages } = s.stepReferenceImages;
      const { [id]: _anns, ...restAnnotations } = s.stepAnnotations;
      const { [id]: _undo, ...restUndoStacks } = s.annotationUndoStacks;
      const { [id]: _redo, ...restRedoStacks } = s.annotationRedoStacks;
      return {
        steps: s.steps.filter((st) => st.id !== id),
        activeStepId: s.activeStepId === id ? null : s.activeStepId,
        selectedStepIds: s.selectedStepIds.filter((sid) => sid !== id),
        selectionAnchorId: s.selectionAnchorId === id ? null : s.selectionAnchorId,
        stepTags: restTags,
        stepPaintRefs: restPaintRefs,
        stepRelations: restRelations,
        stepReferenceImages: restReferenceImages,
        stepAnnotations: restAnnotations,
        annotationUndoStacks: restUndoStacks,
        annotationRedoStacks: restRedoStacks,
      };
    });
  },

  setActiveStep: (id) => {
    if (id) {
      const state = get();
      const step = state.steps.find((s) => s.id === id);
      if (step) {
        const update: Record<string, unknown> = { activeStepId: id };
        const trackChanged = step.track_id !== state.activeTrackId;
        if (trackChanged) {
          update.activeTrackId = step.track_id;
        }
        if (!state.expandedTrackIds.includes(step.track_id)) {
          update.expandedTrackIds = [...state.expandedTrackIds, step.track_id];
        }
        if (step.source_page_id) {
          const pageIdx = state.currentSourcePages.findIndex(
            (p) => p.id === step.source_page_id,
          );
          if (pageIdx >= 0 && pageIdx !== state.currentPageIndex) {
            update.currentPageIndex = pageIdx;
          }
        }
        // Reset viewer so CropCanvas re-centers on the new step
        if (state.buildMode === "building") {
          Object.assign(update, DEFAULT_VIEWER_STATE);
          // Load annotations for building mode
          if (step.crop_x != null && !state.stepAnnotations[step.id]) {
            get().loadAnnotations(step.id);
          }
          // Toast reminder when annotation tool persists across step change
          if (state.annotationMode && state.activeStepId && state.activeStepId !== id) {
            toast.info(`${ANNOTATION_TOOL_LABELS[state.annotationMode]} tool active`, { duration: 1500 });
          }
        }
        // In setup mode, trigger canvas to center on the crop region
        if (state.buildMode === "setup" && step.crop_x != null) {
          update.focusCropTrigger = state.focusCropTrigger + 1;
        }
        set(update);
        // Persist track change to DB
        if (trackChanged && state.activeProjectId) {
          api.saveActiveTrack(state.activeProjectId, step.track_id);
        }
      } else {
        set({ activeStepId: id });
      }
    } else {
      set({ activeStepId: null });
    }
  },

  selectStep: (id) => {
    set({ selectedStepIds: [], selectionAnchorId: id });
    get().setActiveStep(id);
  },

  toggleStepInSelection: (id) => {
    const { selectedStepIds, activeStepId } = get();
    let next: string[];
    if (selectedStepIds.length === 0 && activeStepId && activeStepId !== id) {
      // First Cmd+click: seed with previously active step + clicked step
      next = [activeStepId, id];
    } else if (selectedStepIds.includes(id)) {
      next = selectedStepIds.filter((sid) => sid !== id);
    } else {
      next = [...selectedStepIds, id];
    }
    set({ selectedStepIds: next, selectionAnchorId: id, activeStepId: id });
  },

  shiftSelectSteps: (id) => {
    const { selectionAnchorId, steps } = get();
    const anchor = selectionAnchorId;
    if (!anchor) {
      // No anchor — treat as plain click
      get().selectStep(id);
      return;
    }
    // Find both steps and ensure they share a track
    const anchorStep = steps.find((s) => s.id === anchor);
    const targetStep = steps.find((s) => s.id === id);
    if (!anchorStep || !targetStep || anchorStep.track_id !== targetStep.track_id) {
      // Different tracks or missing — treat as plain click
      get().selectStep(id);
      return;
    }
    // Get ordered steps for this track
    const trackSteps = steps
      .filter((s) => s.track_id === anchorStep.track_id)
      .sort((a, b) => a.display_order - b.display_order);
    const anchorIdx = trackSteps.findIndex((s) => s.id === anchor);
    const targetIdx = trackSteps.findIndex((s) => s.id === id);
    const lo = Math.min(anchorIdx, targetIdx);
    const hi = Math.max(anchorIdx, targetIdx);
    const rangeIds = trackSteps.slice(lo, hi + 1).map((s) => s.id);
    set({ selectedStepIds: rangeIds, activeStepId: id });
    // Anchor stays unchanged
  },

  clearSelectedSteps: () => {
    set({ selectedStepIds: [], selectionAnchorId: null });
  },

  pushUndo: (stepId) => {
    set((s) => ({
      undoStack: [...s.undoStack.slice(-19), stepId],
    }));
  },

  undoLastCrop: async () => {
    const { undoStack, activeProjectId } = get();
    if (undoStack.length === 0) return;

    const stepId = undoStack[undoStack.length - 1];
    set((s) => ({ undoStack: s.undoStack.slice(0, -1) }));

    try {
      await api.deleteStepAndReorder(stepId);
      get().removeStep(stepId);
      if (activeProjectId) {
        await Promise.all([get().loadTracks(activeProjectId), get().loadSteps(activeProjectId)]);
      }
    } catch (e) {
      toast.error(`Undo failed: ${e}`);
    }
  },

  loadStepTags: async (stepId) => {
    const tags = await api.listStepTags(stepId);
    set((s) => ({ stepTags: { ...s.stepTags, [stepId]: tags } }));
  },

  setStepTags: async (stepId, tagNames) => {
    const tags = await api.setStepTags(stepId, tagNames);
    set((s) => ({ stepTags: { ...s.stepTags, [stepId]: tags } }));
  },

  loadStepPaintRefs: async (stepId) => {
    const refs = await api.listStepPaintRefs(stepId);
    set((s) => ({ stepPaintRefs: { ...s.stepPaintRefs, [stepId]: refs } }));
  },

  setStepPaintRefs: async (stepId, entryIds) => {
    const refs = await api.setStepPaintRefs(stepId, entryIds);
    set((s) => ({ stepPaintRefs: { ...s.stepPaintRefs, [stepId]: refs } }));
  },

  loadStepRelations: async (stepId) => {
    const relations = await api.listStepRelations(stepId);
    set((s) => ({ stepRelations: { ...s.stepRelations, [stepId]: relations } }));
  },

  setStepRelations: async (stepId, relations) => {
    const result = await api.setStepRelations(stepId, relations);
    set((s) => ({ stepRelations: { ...s.stepRelations, [stepId]: result } }));
  },

  loadStepReferenceImages: async (stepId) => {
    const images = await api.listReferenceImages(stepId);
    set((s) => ({ stepReferenceImages: { ...s.stepReferenceImages, [stepId]: images } }));
  },

  addReferenceImageStore: (img) => {
    set((s) => ({
      stepReferenceImages: {
        ...s.stepReferenceImages,
        [img.step_id]: [...(s.stepReferenceImages[img.step_id] ?? []), img],
      },
    }));
  },

  updateReferenceImageStore: (img) => {
    set((s) => ({
      stepReferenceImages: {
        ...s.stepReferenceImages,
        [img.step_id]: (s.stepReferenceImages[img.step_id] ?? []).map((i) =>
          i.id === img.id ? img : i,
        ),
      },
    }));
  },

  removeReferenceImageStore: (stepId, id) => {
    set((s) => ({
      stepReferenceImages: {
        ...s.stepReferenceImages,
        [stepId]: (s.stepReferenceImages[stepId] ?? []).filter((i) => i.id !== id),
      },
    }));
  },

  // ── Annotations ─────────────────────────────────────────────────────────

  loadAnnotations: async (stepId) => {
    try {
      const annotations = await api.getAnnotations(stepId);
      set((s) => ({ stepAnnotations: { ...s.stepAnnotations, [stepId]: annotations ?? [] } }));
    } catch {
      set((s) => ({ stepAnnotations: { ...s.stepAnnotations, [stepId]: [] } }));
    }
  },

  saveAnnotationsDebounced: (() => {
    const timers = new Map<string, ReturnType<typeof setTimeout>>();
    return (stepId: string) => {
      const existing = timers.get(stepId);
      if (existing) clearTimeout(existing);
      timers.set(stepId, setTimeout(() => {
        timers.delete(stepId);
        const annotations = get().stepAnnotations[stepId];
        if (annotations) {
          api.saveAnnotations(stepId, annotations).catch(() => {});
        }
      }, 500));
    };
  })(),

  addAnnotation: (stepId, annotation) => {
    const current = get().stepAnnotations[stepId] ?? [];
    set((s) => ({
      stepAnnotations: { ...s.stepAnnotations, [stepId]: [...current, annotation] },
      ...annotationUndoSnapshot(s, stepId, current),
    }));
    get().saveAnnotationsDebounced(stepId);
  },

  removeAnnotation: (stepId, annotationId) => {
    const current = get().stepAnnotations[stepId] ?? [];
    set((s) => ({
      stepAnnotations: { ...s.stepAnnotations, [stepId]: current.filter((a) => a.id !== annotationId) },
      ...annotationUndoSnapshot(s, stepId, current),
    }));
    get().saveAnnotationsDebounced(stepId);
  },

  clearAnnotations: (stepId) => {
    const current = get().stepAnnotations[stepId] ?? [];
    if (current.length === 0) return;
    set((s) => ({
      stepAnnotations: { ...s.stepAnnotations, [stepId]: [] },
      ...annotationUndoSnapshot(s, stepId, current),
    }));
    get().saveAnnotationsDebounced(stepId);
  },

  updateAnnotation: (stepId, annotationId, updates) => {
    const current = get().stepAnnotations[stepId] ?? [];
    set((s) => ({
      stepAnnotations: {
        ...s.stepAnnotations,
        [stepId]: current.map((a) =>
          a.id === annotationId ? { ...a, ...updates } as Annotation : a,
        ),
      },
      ...annotationUndoSnapshot(s, stepId, current),
    }));
    get().saveAnnotationsDebounced(stepId);
  },

  setAnnotationMode: (mode) => set({ annotationMode: mode }),
  setAnnotationColor: (color) => set({ annotationColor: color }),
  setAnnotationStrokeWidth: (width) => set({ annotationStrokeWidth: width }),

  undoAnnotation: (stepId) => {
    const undoStack = get().annotationUndoStacks[stepId] ?? [];
    if (undoStack.length === 0) return;
    const current = get().stepAnnotations[stepId] ?? [];
    const previous = undoStack[undoStack.length - 1];
    set((s) => ({
      stepAnnotations: { ...s.stepAnnotations, [stepId]: previous },
      annotationUndoStacks: {
        ...s.annotationUndoStacks,
        [stepId]: undoStack.slice(0, -1),
      },
      annotationRedoStacks: {
        ...s.annotationRedoStacks,
        [stepId]: [...(s.annotationRedoStacks[stepId] ?? []), current],
      },
    }));
    get().saveAnnotationsDebounced(stepId);
  },

  redoAnnotation: (stepId) => {
    const redoStack = get().annotationRedoStacks[stepId] ?? [];
    if (redoStack.length === 0) return;
    const current = get().stepAnnotations[stepId] ?? [];
    const next = redoStack[redoStack.length - 1];
    set((s) => ({
      stepAnnotations: { ...s.stepAnnotations, [stepId]: next },
      annotationRedoStacks: {
        ...s.annotationRedoStacks,
        [stepId]: redoStack.slice(0, -1),
      },
      annotationUndoStacks: {
        ...s.annotationUndoStacks,
        [stepId]: [...(s.annotationUndoStacks[stepId] ?? []), current],
      },
    }));
    get().saveAnnotationsDebounced(stepId);
  },
  loadInstructionSources: async (projectId) => {
    const sources = await api.listInstructionSources(projectId);
    set({ instructionSources: sources });
    // Auto-select first source if none selected
    const state = get();
    if (!state.currentSourceId && sources.length > 0) {
      state.setCurrentSource(sources[0].id);
    }
  },

  addInstructionSource: (source) => {
    set((s) => ({
      instructionSources: [...s.instructionSources, source],
    }));
  },

  removeInstructionSource: (id) => {
    set((s) => {
      const filtered = s.instructionSources.filter((src) => src.id !== id);
      const needNewSource = s.currentSourceId === id;
      return {
        instructionSources: filtered,
        ...(needNewSource
          ? {
              currentSourceId: filtered.length > 0 ? filtered[0].id : null,
              currentSourcePages: [],
              currentPageIndex: 0,
            }
          : {}),
      };
    });
    // If we switched source, load its pages
    const state = get();
    if (state.currentSourceId && state.currentSourcePages.length === 0) {
      state.setCurrentSource(state.currentSourceId);
    }
  },

  setCurrentSource: async (sourceId) => {
    const pages = await api.listInstructionPages(sourceId);
    set({
      currentSourceId: sourceId,
      currentSourcePages: pages,
      currentPageIndex: 0,
      ...DEFAULT_VIEWER_STATE,
    });
  },

  setCurrentPageIndex: (index) => {
    set({ currentPageIndex: index });
  },

  nextPage: () => {
    const { currentPageIndex, currentSourcePages } = get();
    if (currentPageIndex < currentSourcePages.length - 1) {
      set({ currentPageIndex: currentPageIndex + 1 });
    }
  },

  prevPage: () => {
    const { currentPageIndex } = get();
    if (currentPageIndex > 0) {
      set({ currentPageIndex: currentPageIndex - 1 });
    }
  },

  rotatePage: async () => {
    const { currentSourcePages, currentPageIndex } = get();
    const page = currentSourcePages[currentPageIndex];
    if (!page) return;
    const newRotation = (page.rotation + 90) % 360;
    await api.setPageRotation(page.id, newRotation);
    // Update local state
    const updatedPages = currentSourcePages.map((p, i) =>
      i === currentPageIndex ? { ...p, rotation: newRotation } : p,
    );
    set({ currentSourcePages: updatedPages });
  },

  setViewerZoom: (zoom) => {
    set({ viewerZoom: Math.max(0.05, Math.min(10.0, zoom)) });
  },

  setViewerPan: (x, y) => {
    set({ viewerPanX: x, viewerPanY: y });
  },

  resetViewerState: () => {
    set(DEFAULT_VIEWER_STATE);
  },

  requestFitToView: () => {
    set((s) => ({ fitToViewTrigger: s.fitToViewTrigger + 1 }));
  },

  completeActiveStep: async () => {
    const state = get();
    const { activeStepId, steps, activeTrackId, activeProjectId } = state;
    if (!activeStepId) return;
    const step = steps.find((s) => s.id === activeStepId);
    if (!step) return;

    try {
      const updated = await api.updateStep({
        id: step.id,
        is_completed: !step.is_completed,
      });
      get().updateStepStore(updated);

      if (activeProjectId) {
        // Await track reload so we can check milestone
        await get().loadTracks(activeProjectId);
      }

      // On completion (not un-completion)
      if (!step.is_completed) {
        // Log step_complete
        if (activeProjectId) {
          api.addBuildLogEntry({
            projectId: activeProjectId,
            entryType: "step_complete",
            stepId: step.id,
            trackId: step.track_id,
          }).catch(() => {});
        }

        // Auto-start drying timer if step has adhesive/drying time
        const dryingMin = getEffectiveDryingMinutes(step);
        const alreadyHasTimer = get().activeTimers.some((t) => t.step_id === step.id);
        if (dryingMin && !alreadyHasTimer) {
          get().addTimer(step.id, step.title, dryingMin).then((created) => {
            toast.info(`Drying timer started: ${dryingMin} min`, {
              action: {
                label: "Dismiss",
                onClick: () => { get().removeTimer(created.id); },
              },
              duration: 5000,
            });
          }).catch(() => {});
        }

        // Check for milestone: track fully complete
        const freshTracks = get().tracks;
        const track = freshTracks.find((t) => t.id === step.track_id);
        if (track && track.completed_count === track.step_count && track.step_count > 0) {
          // Milestone detected — log it and show dialog (skip auto-advance)
          if (activeProjectId) {
            api.addBuildLogEntry({
              projectId: activeProjectId,
              entryType: "milestone",
              trackId: track.id,
              isTrackCompletion: true,
              trackStepCount: track.step_count,
            }).catch(() => {});
          }
          set({
            pendingMilestone: { trackId: track.id, trackName: track.name, trackColor: track.color },
          });
          return;
        }

        // Auto-advance to next incomplete step
        const flatSteps = flattenTrackSteps(get().steps, activeTrackId);
        const currentIdx = flatSteps.findIndex((s) => s.id === step.id);
        const candidates = [
          ...flatSteps.slice(currentIdx + 1),
          ...flatSteps.slice(0, currentIdx),
        ];
        const nextIncomplete = candidates.find((s) => !s.is_completed);
        if (nextIncomplete) {
          get().setActiveStep(nextIncomplete.id);
        }
      }
    } catch (e) {
      toast.error(`Failed to update step: ${e}`);
    }
  },

  dismissMilestone: () => {
    const { steps, tracks } = get();
    set({ pendingMilestone: null });
    // Auto-advance: find next track's first incomplete step
    const sortedTracks = [...tracks].sort((a, b) => a.display_order - b.display_order);
    for (const t of sortedTracks) {
      const trackSteps = flattenTrackSteps(steps, t.id);
      const nextIncomplete = trackSteps.find((s) => !s.is_completed);
      if (nextIncomplete) {
        get().setActiveStep(nextIncomplete.id);
        return;
      }
    }
  },

  setBuildMode: async (mode) => {
    const state = get();
    const projectId = state.activeProjectId;
    if (!projectId) return;

    const updates: Partial<BuildSlice> = { buildMode: mode };

    // Force canvas back to view mode and reset viewer when entering building
    if (mode === "building") {
      updates.canvasMode = "view" as CanvasMode;
      Object.assign(updates, DEFAULT_VIEWER_STATE);

      // Auto-select first incomplete step if none active
      if (!state.activeStepId) {
        const firstIncomplete = state.steps.find((s) => !s.is_completed);
        if (firstIncomplete) {
          updates.activeStepId = firstIncomplete.id;
          updates.activeTrackId = firstIncomplete.track_id;
        }
      }
    }

    // Clear annotation toolbar when switching modes
    if (mode === "setup") {
      updates.annotationMode = null as AnnotationTool;
    }

    set(updates);

    // Load annotations for active step when entering building mode
    if (mode === "building") {
      const activeId = (updates as Record<string, unknown>).activeStepId as string ?? state.activeStepId;
      if (activeId) {
        const step = state.steps.find((s) => s.id === activeId);
        if (step?.crop_x != null && !state.stepAnnotations[activeId]) {
          get().loadAnnotations(activeId);
        }
      }
    }
    try {
      await api.saveBuildMode(projectId, mode);
    } catch (e) {
      toast.error(`Failed to save build mode: ${e}`);
    }
  },

  setNavMode: async (mode) => {
    const projectId = get().activeProjectId;
    set({ navMode: mode });
    if (projectId) {
      try {
        await api.saveNavMode(projectId, mode);
      } catch (e) {
        toast.error(`Failed to save nav mode: ${e}`);
      }
    }
  },

  setCanvasMode: (mode) => {
    // Block crop mode in building mode
    if (mode === "crop" && get().buildMode === "building") return;
    if (mode === "crop" && !get().activeTrackId) {
      toast.info("Select a track first");
      return;
    }
    set({ canvasMode: mode });
  },

  setIsProcessingPdf: (processing) => {
    set({ isProcessingPdf: processing });
  },
});
