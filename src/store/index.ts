import { create } from "zustand";
import {
  type CollectionSlice,
  createCollectionSlice,
} from "./collection-slice";
import { type BuildSlice, createBuildSlice } from "./build-slice";
import { type UiSlice, createUiSlice } from "./ui-slice";

export type AppStore = CollectionSlice & BuildSlice & UiSlice;

export const useAppStore = create<AppStore>()((...a) => ({
  ...createCollectionSlice(...a),
  ...createBuildSlice(...a),
  ...createUiSlice(...a),
}));
