import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAppStore } from "@/store";
import { getOrderedTrackSteps } from "./tree-utils";

export function NavigationBar() {
  const steps = useAppStore((s) => s.steps);
  const activeStepId = useAppStore((s) => s.activeStepId);
  const activeTrackId = useAppStore((s) => s.activeTrackId);
  const setActiveStep = useAppStore((s) => s.setActiveStep);

  const trackSteps = getOrderedTrackSteps(steps, activeTrackId);

  const currentIndex = trackSteps.findIndex((s) => s.id === activeStepId);
  const total = trackSteps.length;

  const goPrev = () => {
    if (currentIndex > 0) {
      setActiveStep(trackSteps[currentIndex - 1].id);
    }
  };

  const goNext = () => {
    if (currentIndex < total - 1) {
      setActiveStep(trackSteps[currentIndex + 1].id);
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
      <span className="text-[11px] tabular-nums text-text-secondary">
        Step {currentIndex >= 0 ? currentIndex + 1 : "—"} of {total}
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
