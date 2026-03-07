import { useEffect, useRef } from "react";
import { useAppStore } from "@/store";

export function useTimerTick() {
  const activeTimers = useAppStore((s) => s.activeTimers);
  const tickTimers = useAppStore((s) => s.tickTimers);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (activeTimers.length > 0 && !intervalRef.current) {
      intervalRef.current = setInterval(() => {
        tickTimers();
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
}
