import type { StateCreator } from "zustand";
import type { DryingTimer } from "@/shared/types";
import { getSettingBool } from "@/shared/types";
import type { AppStore } from "./index";
import * as api from "@/api";
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification";

export interface TimerSlice {
  activeTimers: DryingTimer[];
  loadTimers: () => Promise<void>;
  addTimer: (
    stepId: string | null,
    label: string,
    durationMin: number,
  ) => Promise<DryingTimer>;
  removeTimer: (id: string) => Promise<void>;
  tickTimers: () => void;
}

async function fireNotification(title: string, body: string) {
  try {
    let granted = await isPermissionGranted();
    if (!granted) {
      const perm = await requestPermission();
      granted = perm === "granted";
    }
    if (granted) {
      sendNotification({ title, body });
    }
  } catch {
    // Notification not available — silently ignore
  }
}

function handleTimerExpired(
  t: DryingTimer,
  title: string,
  get: () => AppStore,
) {
  fireNotification(title, `${t.label} is done drying`);
  if (get().activeProjectId && getSettingBool(get().settings, "auto_log_timer_expiry")) {
    api
      .addBuildLogEntry({
        projectId: get().activeProjectId!,
        entryType: "note",
        body: `Drying timer completed: ${t.label} (${t.duration_min} min)`,
      })
      .catch(() => {});
  }
  api.deleteDryingTimer(t.id).catch((e) => console.warn("Failed to delete expired timer:", e));
}

export const createTimerSlice: StateCreator<AppStore, [], [], TimerSlice> = (
  set,
  get,
) => ({
  activeTimers: [],
  loadTimers: async () => {
    const timers = await api.listDryingTimers();
    const now = Math.floor(Date.now() / 1000);

    // Check for already-expired timers (crash recovery)
    const expired = timers.filter(
      (t) => now >= t.started_at + t.duration_min * 60,
    );
    const active = timers.filter(
      (t) => now < t.started_at + t.duration_min * 60,
    );

    set({ activeTimers: active });

    for (const t of expired) {
      handleTimerExpired(t, "Timer Expired", get);
    }
  },

  addTimer: async (stepId, label, durationMin) => {
    const timer = await api.createDryingTimer({
      step_id: stepId,
      label,
      duration_min: durationMin,
    });
    set((s) => ({ activeTimers: [...s.activeTimers, timer] }));
    return timer;
  },

  removeTimer: async (id) => {
    await api.deleteDryingTimer(id);
    set((s) => ({
      activeTimers: s.activeTimers.filter((t) => t.id !== id),
    }));
  },

  tickTimers: () => {
    const state = get();
    const now = Math.floor(Date.now() / 1000);
    const expired: DryingTimer[] = [];
    const remaining: DryingTimer[] = [];

    for (const t of state.activeTimers) {
      if (now >= t.started_at + t.duration_min * 60) {
        expired.push(t);
      } else {
        remaining.push(t);
      }
    }

    if (expired.length === 0) {
      return;
    }

    set({ activeTimers: remaining });

    for (const t of expired) {
      handleTimerExpired(t, "Timer Complete", get);
    }
  },

});
