import type { StateCreator } from "zustand";
import type {
  BuildLogEntry,
  ProgressPhoto,
  MilestonePhoto,
  GalleryPhoto,
  PhotoSourceType,
  Accessory,
  Paint,
  PaletteEntry,
  PaletteComponent,
  StepPaintRefInfo,
} from "@/shared/types";
import type { AppStore } from "./index";
import * as api from "@/api";

export type OverviewCardName = "project_info" | "gallery" | "build_log" | "materials";

export interface OverviewSlice {
  overviewBuildLog: BuildLogEntry[];
  overviewProgressPhotos: ProgressPhoto[];
  overviewMilestonePhotos: MilestonePhoto[];
  overviewGalleryPhotos: GalleryPhoto[];
  overviewAccessories: Accessory[];
  overviewPaints: Paint[];
  overviewPaletteEntries: PaletteEntry[];
  overviewStepPaintRefs: StepPaintRefInfo[];
  overviewLoading: boolean;
  focusedCard: OverviewCardName | null;
  setFocusedCard: (card: OverviewCardName | null) => void;
  addOverviewBuildLogEntry: (entry: BuildLogEntry) => void;
  addOverviewGalleryPhoto: (photo: GalleryPhoto) => void;
  removeOverviewGalleryPhoto: (id: string) => void;
  updateOverviewGalleryCaption: (id: string, caption: string | null) => void;
  toggleOverviewPhotoStar: (photoType: PhotoSourceType, id: string) => void;
  addOverviewPaletteEntry: (entry: PaletteEntry) => void;
  updateOverviewPaletteEntry: (entry: PaletteEntry) => void;
  removeOverviewPaletteEntry: (id: string) => void;
  updateOverviewPaletteComponents: (entryId: string, components: PaletteComponent[]) => void;
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
  overviewGalleryPhotos: [],
  overviewAccessories: [],
  overviewPaints: [],
  overviewPaletteEntries: [],
  overviewStepPaintRefs: [],
  overviewLoading: false,
  focusedCard: null,
  setFocusedCard: (card) => set({ focusedCard: card }),
  addOverviewBuildLogEntry: (entry) =>
    set((s) => ({ overviewBuildLog: [entry, ...s.overviewBuildLog] })),
  addOverviewGalleryPhoto: (photo) =>
    set((s) => ({ overviewGalleryPhotos: [photo, ...s.overviewGalleryPhotos] })),
  removeOverviewGalleryPhoto: (id) =>
    set((s) => ({
      overviewGalleryPhotos: s.overviewGalleryPhotos.filter((p) => p.id !== id),
    })),
  updateOverviewGalleryCaption: (id, caption) =>
    set((s) => ({
      overviewGalleryPhotos: s.overviewGalleryPhotos.map((p) =>
        p.id === id ? { ...p, caption } : p,
      ),
    })),
  toggleOverviewPhotoStar: (photoType, id) =>
    set((s) => {
      if (photoType === "progress") {
        return {
          overviewProgressPhotos: s.overviewProgressPhotos.map((p) =>
            p.id === id ? { ...p, is_starred: !p.is_starred } : p,
          ),
        };
      }
      if (photoType === "milestone") {
        return {
          overviewMilestonePhotos: s.overviewMilestonePhotos.map((p) =>
            p.id === id ? { ...p, is_starred: !p.is_starred } : p,
          ),
        };
      }
      if (photoType === "gallery") {
        return {
          overviewGalleryPhotos: s.overviewGalleryPhotos.map((p) =>
            p.id === id ? { ...p, is_starred: !p.is_starred } : p,
          ),
        };
      }
      return {};
    }),

  addOverviewPaletteEntry: (entry) =>
    set((s) => ({ overviewPaletteEntries: [...s.overviewPaletteEntries, entry] })),
  updateOverviewPaletteEntry: (entry) =>
    set((s) => ({
      overviewPaletteEntries: s.overviewPaletteEntries.map((e) =>
        e.id === entry.id ? entry : e,
      ),
    })),
  removeOverviewPaletteEntry: (id) =>
    set((s) => ({
      overviewPaletteEntries: s.overviewPaletteEntries.filter((e) => e.id !== id),
    })),
  updateOverviewPaletteComponents: (entryId, components) =>
    set((s) => ({
      overviewPaletteEntries: s.overviewPaletteEntries.map((e) =>
        e.id === entryId ? { ...e, components } : e,
      ),
    })),

  loadOverviewData: async (projectId) => {
    set({ overviewLoading: true });
    try {
      const [buildLog, progressPhotos, milestonePhotos, galleryPhotos, accessories, paints, paletteEntries, stepPaintRefs] =
        await Promise.all([
          api.listBuildLogEntries(projectId),
          api.listProjectProgressPhotos(projectId),
          api.listProjectMilestonePhotos(projectId),
          api.listGalleryPhotos(projectId),
          api.listAccessoriesForProject(projectId),
          api.listPaintsForProject(projectId),
          api.listPaletteEntries(projectId),
          api.listProjectStepPaintRefs(projectId),
        ]);
      set({
        overviewBuildLog: buildLog,
        overviewProgressPhotos: progressPhotos,
        overviewMilestonePhotos: milestonePhotos,
        overviewGalleryPhotos: galleryPhotos,
        overviewAccessories: accessories,
        overviewPaints: paints,
        overviewPaletteEntries: paletteEntries,
        overviewStepPaintRefs: stepPaintRefs,
        overviewLoading: false,
      });
    } catch (err) {
      console.error("Failed to load overview data:", err);
      set({ overviewLoading: false });
    }
  },

  clearOverviewData: () =>
    set({
      overviewBuildLog: [],
      overviewProgressPhotos: [],
      overviewMilestonePhotos: [],
      overviewGalleryPhotos: [],
      overviewAccessories: [],
      overviewPaints: [],
      overviewPaletteEntries: [],
      overviewStepPaintRefs: [],
    }),
});
