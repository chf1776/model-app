import { useEffect, useRef, useState } from "react";
import { useAppStore } from "@/store";

/**
 * Drives timer ticks (1-second interval) when active timers exist.
 * Returns a local tick counter that only re-renders the calling component.
 */
export function useTimerTick(): number {
  const activeTimers = useAppStore((s) => s.activeTimers);
  const tickTimers = useAppStore((s) => s.tickTimers);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [localTick, setLocalTick] = useState(0);

  useEffect(() => {
    if (activeTimers.length > 0 && !intervalRef.current) {
      intervalRef.current = setInterval(() => {
        tickTimers();
        setLocalTick((t) => t + 1);
      }, 1000);
    } else if (activeTimers.length === 0 && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [activeTimers.length, tickTimers]);

  return localTick;
}
