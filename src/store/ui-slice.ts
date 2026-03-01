import type { StateCreator } from "zustand";
import type { Zone } from "@/shared/types";
import type { AppStore } from "./index";

export interface UiSlice {
  activeZone: Zone;
  setActiveZone: (zone: Zone) => void;
}

export const createUiSlice: StateCreator<AppStore, [], [], UiSlice> = (
  set,
) => ({
  activeZone: "collection",
  setActiveZone: (zone) => set({ activeZone: zone }),
});
