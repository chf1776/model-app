import type { StateCreator } from "zustand";
import type { Project } from "@/shared/types";
import type { AppStore } from "./index";
import * as api from "@/api";

export interface BuildSlice {
  activeProjectId: string | null;
  project: Project | null;
  projects: Project[];
  loadProjects: () => Promise<void>;
  setActiveProject: (id: string) => Promise<void>;
  clearActiveProject: () => void;
  loadActiveProject: () => Promise<void>;
}

export const createBuildSlice: StateCreator<AppStore, [], [], BuildSlice> = (
  set,
) => ({
  activeProjectId: null,
  project: null,
  projects: [],

  loadProjects: async () => {
    const projects = await api.listProjects();
    set({ projects });
  },

  setActiveProject: async (id) => {
    await api.setActiveProject(id);
    const project = await api.getProject(id);
    set({ activeProjectId: id, project });
  },

  clearActiveProject: () =>
    set({ activeProjectId: null, project: null }),

  loadActiveProject: async () => {
    const project = await api.getActiveProject();
    if (project) {
      set({ activeProjectId: project.id, project });
    }
  },
});
