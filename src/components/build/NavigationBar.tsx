import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAppStore } from "@/store";
import { getOrderedTrackSteps } from "./tree-utils";

export function NavigationBar() {
  const steps = useAppStore((s) => s.steps);
  const tracks = useAppStore((s) => s.tracks);
  const activeStepId = useAppStore((s) => s.activeStepId);
  const activeTrackId = useAppStore((s) => s.activeTrackId);
  const setActiveStep = useAppStore((s) => s.setActiveStep);

  const activeTrack = tracks.find((t) => t.id === activeTrackId);
  const trackSteps = getOrderedTrackSteps(steps, activeTrackId);
  // Count only root steps for navigation
  const rootSteps = trackSteps.filter((s) => !s.parent_step_id);

  const currentIndex = rootSteps.findIndex((s) => s.id === activeStepId);
  const total = rootSteps.length;

  const goPrev = () => {
    if (currentIndex > 0) {
      setActiveStep(rootSteps[currentIndex - 1].id);
    }
  };

  const goNext = () => {
    if (currentIndex < total - 1) {
      setActiveStep(rootSteps[currentIndex + 1].id);
    }
  };

  if (total === 0) return null;

  return (
    <div className="flex h-[30px] items-center justify-center gap-2 border-t border-border bg-background/80 backdrop-blur-sm">
      <button
        onClick={goPrev}
        disabled={currentIndex <= 0}
        className="rounded p-0.5 text-text-tertiary hover:bg-muted hover:text-text-secondary disabled:opacity-30 disabled:hover:bg-transparent"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
      </button>
      <span className="flex items-center gap-1.5 text-[11px] text-text-secondary">
        <span className="tabular-nums">
          Step {currentIndex >= 0 ? currentIndex + 1 : "—"} of {total}
        </span>
        {activeTrack && (
          <>
            <span
              className="inline-block h-[6px] w-[6px] rounded-full"
              style={{ backgroundColor: activeTrack.color }}
            />
            <span className="text-text-tertiary">{activeTrack.name}</span>
          </>
        )}
      </span>
      <button
        onClick={goNext}
        disabled={currentIndex >= total - 1}
        className="rounded p-0.5 text-text-tertiary hover:bg-muted hover:text-text-secondary disabled:opacity-30 disabled:hover:bg-transparent"
      >
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
