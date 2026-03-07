import { create } from "zustand";
import {
  type CollectionSlice,
  createCollectionSlice,
} from "./collection-slice";
import { type BuildSlice, createBuildSlice } from "./build-slice";
import { type UiSlice, createUiSlice } from "./ui-slice";
import {
  type OverviewSlice,
  createOverviewSlice,
} from "./overview-slice";

export type AppStore = CollectionSlice & BuildSlice & UiSlice & OverviewSlice;

export const useAppStore = create<AppStore>()((...a) => ({
  ...createCollectionSlice(...a),
  ...createBuildSlice(...a),
  ...createUiSlice(...a),
  ...createOverviewSlice(...a),
}));
