import type { StateCreator } from "zustand";
import type { Project, InstructionSource, InstructionPage } from "@/shared/types";
import type { AppStore } from "./index";
import * as api from "@/api";

export interface BuildSlice {
  activeProjectId: string | null;
  project: Project | null;
  projects: Project[];
  loadProjects: () => Promise<void>;
  setActiveProject: (id: string) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  clearActiveProject: () => void;
  loadActiveProject: () => Promise<void>;

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

  // Viewer state
  viewerZoom: number;
  viewerPanX: number;
  viewerPanY: number;
  fitToViewCounter: number;
  setViewerZoom: (zoom: number) => void;
  setViewerPan: (x: number, y: number) => void;
  resetViewerState: () => void;
  requestFitToView: () => void;

  // Processing state
  isProcessingPdf: boolean;
  setIsProcessingPdf: (processing: boolean) => void;
}

export const createBuildSlice: StateCreator<AppStore, [], [], BuildSlice> = (
  set,
  get,
) => ({
  activeProjectId: null,
  project: null,
  projects: [],

  // Instruction sources
  instructionSources: [],
  currentSourceId: null,
  currentSourcePages: [],
  currentPageIndex: 0,

  // Viewer state
  viewerZoom: 1,
  viewerPanX: 0,
  viewerPanY: 0,
  fitToViewCounter: 0,

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
        instructionSources: [],
        currentSourceId: null,
        currentSourcePages: [],
        currentPageIndex: 0,
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
      // Reset page state when switching projects
      currentSourceId: null,
      currentSourcePages: [],
      currentPageIndex: 0,
      viewerZoom: 1,
      viewerPanX: 0,
      viewerPanY: 0,
    });
    // Load instruction sources for the new project
    get().loadInstructionSources(id);
  },

  clearActiveProject: () =>
    set({
      activeProjectId: null,
      project: null,
      instructionSources: [],
      currentSourceId: null,
      currentSourcePages: [],
      currentPageIndex: 0,
    }),

  loadActiveProject: async () => {
    const project = await api.getActiveProject();
    if (project) {
      set({ activeProjectId: project.id, project });
      get().loadInstructionSources(project.id);
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
      viewerZoom: 1,
      viewerPanX: 0,
      viewerPanY: 0,
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

  setViewerZoom: (zoom) => {
    set({ viewerZoom: Math.max(0.1, Math.min(5.0, zoom)) });
  },

  setViewerPan: (x, y) => {
    set({ viewerPanX: x, viewerPanY: y });
  },

  resetViewerState: () => {
    set({ viewerZoom: 1, viewerPanX: 0, viewerPanY: 0 });
  },

  requestFitToView: () => {
    set((s) => ({ fitToViewCounter: s.fitToViewCounter + 1 }));
  },

  setIsProcessingPdf: (processing) => {
    set({ isProcessingPdf: processing });
  },
});
