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
  loadTracks: (projectId: string) => Promise<void>;
  addTrack: (track: Track) => void;
  updateTrackStore: (track: Track) => void;
  removeTrack: (id: string) => void;
  setActiveTrack: (id: string | null) => void;

  // Steps
  steps: Step[];
  activeStepId: string | null;
  loadSteps: (projectId: string) => Promise<void>;
  addStep: (step: Step) => void;
  updateStepStore: (step: Step) => void;
  removeStep: (id: string) => void;
  setActiveStep: (id: string | null) => void;

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

  // Tracks
  tracks: [],
  activeTrackId: null,

  // Steps
  steps: [],
  activeStepId: null,

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
        tracks: [],
        activeTrackId: null,
        steps: [],
        activeStepId: null,
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
      tracks: [],
      activeTrackId: null,
      steps: [],
      activeStepId: null,
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
      tracks: [],
      activeTrackId: null,
      steps: [],
      activeStepId: null,
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
    }));
  },

  setActiveTrack: (id) => {
    set({ activeTrackId: id });
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
    }));
  },

  setActiveStep: (id) => {
    set({ activeStepId: id });
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
