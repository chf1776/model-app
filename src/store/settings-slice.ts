import type { StateCreator } from "zustand";
import type { AppStore } from "./index";
import { SETTINGS_DEFAULTS } from "@/shared/types";
import * as api from "@/api";

export interface SettingsSlice {
  settings: Record<string, string>;
  settingsLoaded: boolean;
  loadSettings: () => Promise<void>;
  updateSetting: (key: string, value: string) => Promise<void>;
}

export const createSettingsSlice: StateCreator<AppStore, [], [], SettingsSlice> = (
  set,
  _get,
) => ({
  settings: { ...SETTINGS_DEFAULTS },
  settingsLoaded: false,

  loadSettings: async () => {
    try {
      const pairs = await api.getAllSettings();
      const loaded: Record<string, string> = { ...SETTINGS_DEFAULTS };
      for (const [key, value] of pairs) {
        loaded[key] = value;
      }
      set({ settings: loaded, settingsLoaded: true });
    } catch {
      set({ settingsLoaded: true });
    }
  },

  updateSetting: async (key, value) => {
    set((s) => ({
      settings: { ...s.settings, [key]: value },
    }));
    api.setSetting(key, value).catch(() => {});
  },
});
