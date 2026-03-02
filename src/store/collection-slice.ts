import type { StateCreator } from "zustand";
import type { Kit, KitStatus, Accessory } from "@/shared/types";
import type { AppStore } from "./index";
import * as api from "@/api";

export interface CollectionSlice {
  kits: Kit[];
  accessories: Accessory[];
  activeEntityTab: "kits" | "accessories" | "paints";
  statusFilter: KitStatus | "all";
  setActiveEntityTab: (tab: "kits" | "accessories" | "paints") => void;
  setStatusFilter: (filter: KitStatus | "all") => void;
  loadKits: () => Promise<void>;
  addKit: (kit: Kit) => void;
  updateKit: (kit: Kit) => void;
  removeKit: (id: string) => void;
  loadAccessories: () => Promise<void>;
  addAccessory: (accessory: Accessory) => void;
  updateAccessory: (accessory: Accessory) => void;
  removeAccessory: (id: string) => void;
}

export const createCollectionSlice: StateCreator<
  AppStore,
  [],
  [],
  CollectionSlice
> = (set) => ({
  kits: [],
  accessories: [],
  activeEntityTab: "kits",
  statusFilter: "all",

  setActiveEntityTab: (tab) => set({ activeEntityTab: tab }),
  setStatusFilter: (filter) => set({ statusFilter: filter }),

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
});
