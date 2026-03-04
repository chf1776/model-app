import type { StateCreator } from "zustand";
import type { Project, InstructionSource, InstructionPage, Track, Step } from "@/shared/types";
import type { AppStore } from "./index";
import * as api from "@/api";
import { toast } from "sonner";

export type CanvasMode = "view" | "crop";

export interface BuildSlice {
  activeProjectId: string | null;
  project: Project | null;
  projects: Project[];
  loadProjects: () => Promise<void>;
  setActiveProject: (id: string) => Promise<void>;
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
  setViewerZoom: (zoom: number) => void;
  setViewerPan: (x: number, y: number) => void;
  resetViewerState: () => void;
  requestFitToView: () => void;

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

  // Canvas mode
  canvasMode: "view" as CanvasMode,

  // Processing state
  isProcessingPdf: false,

  loadProjects: async () => {
    const projects = await api.listProjects();
    set({ projects });
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
    const project = await api.getProject(id);
    set({
      activeProjectId: id,
      project,
      ...DEFAULT_BUILD_STATE,
      canvasMode: "view" as CanvasMode,
      ...DEFAULT_PAGE_STATE,
      ...DEFAULT_VIEWER_STATE,
    });
    // Load instruction sources, tracks, and steps for the new project
    get().loadInstructionSources(id);
    get().loadTracks(id);
    get().loadSteps(id);
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
      set({ activeProjectId: project.id, project });
      get().loadInstructionSources(project.id);
      get().loadTracks(project.id);
      get().loadSteps(project.id);
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
    set((s) => ({
      steps: s.steps.filter((st) => st.id !== id),
      activeStepId: s.activeStepId === id ? null : s.activeStepId,
      selectedStepIds: s.selectedStepIds.filter((sid) => sid !== id),
      selectionAnchorId: s.selectionAnchorId === id ? null : s.selectionAnchorId,
    }));
  },

  setActiveStep: (id) => {
    if (id) {
      const state = get();
      const step = state.steps.find((s) => s.id === id);
      if (step) {
        const update: Record<string, unknown> = { activeStepId: id };
        if (step.track_id !== state.activeTrackId) {
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
        set(update);
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
    set({ viewerZoom: Math.max(0.1, Math.min(5.0, zoom)) });
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

  setCanvasMode: (mode) => {
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
