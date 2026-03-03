import type { StateCreator } from "zustand";
import type {
  Kit,
  KitStatus,
  Accessory,
  AccessoryType,
  AccessoryStatus,
  Paint,
  PaintGroupBy,
  PaintViewMode,
  PaintGroupExpandedState,
} from "@/shared/types";
import type { AppStore } from "./index";
import * as api from "@/api";

export interface CollectionSlice {
  kits: Kit[];
  accessories: Accessory[];
  paints: Paint[];
  paintProjectMap: Record<string, { project_id: string; project_name: string }[]>;
  activeEntityTab: "kits" | "accessories" | "paints";
  statusFilter: KitStatus | "all";
  kitGroupBy: "status" | "category" | "manufacturer";
  kitSearch: string;
  paintGroupBy: PaintGroupBy;
  paintViewMode: PaintViewMode;
  paintSearch: string;
  selectedPaintId: string | null;
  paintGroupExpanded: PaintGroupExpandedState;
  accessoryStatusFilter: "all" | AccessoryStatus;
  accessoryTypeFilter: "all" | AccessoryType;
  accessoryGroupBy: "type" | "parent_kit";
  accessorySearch: string;
  setActiveEntityTab: (tab: "kits" | "accessories" | "paints") => void;
  setStatusFilter: (filter: KitStatus | "all") => void;
  setKitGroupBy: (groupBy: "status" | "category" | "manufacturer") => void;
  setKitSearch: (search: string) => void;
  setPaintGroupBy: (groupBy: PaintGroupBy) => void;
  setPaintViewMode: (mode: PaintViewMode) => void;
  setPaintSearch: (search: string) => void;
  setSelectedPaintId: (id: string | null) => void;
  setPaintGroupExpandedBase: (base: boolean) => void;
  togglePaintGroupExpanded: (groupKey: string) => void;
  setAccessoryStatusFilter: (filter: "all" | AccessoryStatus) => void;
  setAccessoryTypeFilter: (filter: "all" | AccessoryType) => void;
  setAccessoryGroupBy: (groupBy: "type" | "parent_kit") => void;
  setAccessorySearch: (search: string) => void;
  loadKits: () => Promise<void>;
  addKit: (kit: Kit) => void;
  updateKit: (kit: Kit) => void;
  removeKit: (id: string) => void;
  loadAccessories: () => Promise<void>;
  addAccessory: (accessory: Accessory) => void;
  updateAccessory: (accessory: Accessory) => void;
  removeAccessory: (id: string) => void;
  loadPaints: () => Promise<void>;
  addPaint: (paint: Paint) => void;
  updatePaint: (paint: Paint) => void;
  removePaint: (id: string) => void;
  loadPaintProjectMap: () => Promise<void>;
  updatePaintProjectMap: (
    paintId: string,
    projects: { project_id: string; project_name: string }[],
  ) => void;
}

export const createCollectionSlice: StateCreator<
  AppStore,
  [],
  [],
  CollectionSlice
> = (set) => ({
  kits: [],
  accessories: [],
  paints: [],
  paintProjectMap: {},
  activeEntityTab: "kits",
  statusFilter: "all",
  kitGroupBy: "status",
  kitSearch: "",
  paintGroupBy: "color_family",
  paintViewMode: "list",
  paintSearch: "",
  selectedPaintId: null,
  paintGroupExpanded: { base: true, overrides: {} },
  accessoryStatusFilter: "all",
  accessoryTypeFilter: "all",
  accessoryGroupBy: "type",
  accessorySearch: "",

  setActiveEntityTab: (tab) => set({ activeEntityTab: tab }),
  setStatusFilter: (filter) => set({ statusFilter: filter }),
  setKitGroupBy: (groupBy) => set({ kitGroupBy: groupBy }),
  setKitSearch: (search) => set({ kitSearch: search }),
  setPaintGroupBy: (groupBy) =>
    set((state) => ({
      paintGroupBy: groupBy,
      paintGroupExpanded: { base: state.paintGroupExpanded.base, overrides: {} },
    })),
  setPaintViewMode: (mode) => set({ paintViewMode: mode }),
  setPaintSearch: (search) => set({ paintSearch: search }),
  setSelectedPaintId: (id) => set({ selectedPaintId: id }),
  setPaintGroupExpandedBase: (base) =>
    set({ paintGroupExpanded: { base, overrides: {} } }),
  togglePaintGroupExpanded: (groupKey) =>
    set((state) => {
      const { base, overrides } = state.paintGroupExpanded;
      const current = overrides[groupKey] ?? base;
      return {
        paintGroupExpanded: {
          base,
          overrides: { ...overrides, [groupKey]: !current },
        },
      };
    }),
  setAccessoryStatusFilter: (filter) => set({ accessoryStatusFilter: filter }),
  setAccessoryTypeFilter: (filter) => set({ accessoryTypeFilter: filter }),
  setAccessoryGroupBy: (groupBy) => set({ accessoryGroupBy: groupBy }),
  setAccessorySearch: (search) => set({ accessorySearch: search }),

  loadKits: async () => {
    const kits = await api.listKits();
    set({ kits });
  },

  addKit: (kit) =>
    set((state) => ({ kits: [kit, ...state.kits] })),

  updateKit: (kit) =>
    set((state) => ({
      kits: state.kits.map((k) => (k.id === kit.id ? kit : k)),
    })),

  removeKit: (id) =>
    set((state) => ({
      kits: state.kits.filter((k) => k.id !== id),
    })),

  loadAccessories: async () => {
    const accessories = await api.listAccessories();
    set({ accessories });
  },

  addAccessory: (accessory) =>
    set((state) => ({ accessories: [accessory, ...state.accessories] })),

  updateAccessory: (accessory) =>
    set((state) => ({
      accessories: state.accessories.map((a) =>
        a.id === accessory.id ? accessory : a,
      ),
    })),

  removeAccessory: (id) =>
    set((state) => ({
      accessories: state.accessories.filter((a) => a.id !== id),
    })),

  loadPaints: async () => {
    const paints = await api.listPaints();
    set({ paints });
  },

  addPaint: (paint) =>
    set((state) => ({ paints: [paint, ...state.paints] })),

  updatePaint: (paint) =>
    set((state) => ({
      paints: state.paints.map((p) => (p.id === paint.id ? paint : p)),
    })),

  removePaint: (id) =>
    set((state) => ({
      paints: state.paints.filter((p) => p.id !== id),
      selectedPaintId:
        state.selectedPaintId === id ? null : state.selectedPaintId,
    })),

  loadPaintProjectMap: async () => {
    const mappings = await api.listPaintProjectMappings();
    const map: Record<string, { project_id: string; project_name: string }[]> = {};
    for (const m of mappings) {
      if (!map[m.paint_id]) map[m.paint_id] = [];
      map[m.paint_id].push({ project_id: m.project_id, project_name: m.project_name });
    }
    set({ paintProjectMap: map });
  },

  updatePaintProjectMap: (paintId, projects) =>
    set((state) => ({
      paintProjectMap: { ...state.paintProjectMap, [paintId]: projects },
    })),
});
