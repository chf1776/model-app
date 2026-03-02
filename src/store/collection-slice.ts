import type { StateCreator } from "zustand";
import type {
  Kit,
  KitStatus,
  Accessory,
  Paint,
  PaintGroupBy,
  PaintViewMode,
} from "@/shared/types";
import type { AppStore } from "./index";
import * as api from "@/api";

export interface CollectionSlice {
  kits: Kit[];
  accessories: Accessory[];
  paints: Paint[];
  activeEntityTab: "kits" | "accessories" | "paints";
  statusFilter: KitStatus | "all";
  paintGroupBy: PaintGroupBy;
  paintViewMode: PaintViewMode;
  selectedPaintId: string | null;
  setActiveEntityTab: (tab: "kits" | "accessories" | "paints") => void;
  setStatusFilter: (filter: KitStatus | "all") => void;
  setPaintGroupBy: (groupBy: PaintGroupBy) => void;
  setPaintViewMode: (mode: PaintViewMode) => void;
  setSelectedPaintId: (id: string | null) => void;
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
  activeEntityTab: "kits",
  statusFilter: "all",
  paintGroupBy: "color_family",
  paintViewMode: "list",
  selectedPaintId: null,

  setActiveEntityTab: (tab) => set({ activeEntityTab: tab }),
  setStatusFilter: (filter) => set({ statusFilter: filter }),
  setPaintGroupBy: (groupBy) => set({ paintGroupBy: groupBy }),
  setPaintViewMode: (mode) => set({ paintViewMode: mode }),
  setSelectedPaintId: (id) => set({ selectedPaintId: id }),

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
});
