import type { StateCreator } from "zustand";
import type {
  BuildLogEntry,
  ProgressPhoto,
  MilestonePhoto,
  Accessory,
  Paint,
} from "@/shared/types";
import type { AppStore } from "./index";
import * as api from "@/api";

export interface OverviewSlice {
  overviewBuildLog: BuildLogEntry[];
  overviewProgressPhotos: ProgressPhoto[];
  overviewMilestonePhotos: MilestonePhoto[];
  overviewAccessories: Accessory[];
  overviewPaints: Paint[];
  overviewLoading: boolean;
  loadOverviewData: (projectId: string) => Promise<void>;
  clearOverviewData: () => void;
}

export const createOverviewSlice: StateCreator<
  AppStore,
  [],
  [],
  OverviewSlice
> = (set) => ({
  overviewBuildLog: [],
  overviewProgressPhotos: [],
  overviewMilestonePhotos: [],
  overviewAccessories: [],
  overviewPaints: [],
  overviewLoading: false,

  loadOverviewData: async (projectId) => {
    set({ overviewLoading: true });
    try {
      const [buildLog, progressPhotos, milestonePhotos, accessories, paints] =
        await Promise.all([
          api.listBuildLogEntries(projectId),
          api.listProjectProgressPhotos(projectId),
          api.listProjectMilestonePhotos(projectId),
          api.listAccessoriesForProject(projectId),
          api.listPaintsForProject(projectId),
        ]);
      set({
        overviewBuildLog: buildLog,
        overviewProgressPhotos: progressPhotos,
        overviewMilestonePhotos: milestonePhotos,
        overviewAccessories: accessories,
        overviewPaints: paints,
        overviewLoading: false,
      });
    } catch {
      set({ overviewLoading: false });
    }
  },

  clearOverviewData: () =>
    set({
      overviewBuildLog: [],
      overviewProgressPhotos: [],
      overviewMilestonePhotos: [],
      overviewAccessories: [],
      overviewPaints: [],
    }),
});
