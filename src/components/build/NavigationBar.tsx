import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAppStore } from "@/store";
import { ANNOTATION_TOOL_LABELS } from "@/shared/types";
import { flattenTrackSteps, getStepLabel, getReplacedStepIds } from "./tree-utils";

export function NavigationBar() {
  const navMode = useAppStore((s) => s.navMode);

  if (navMode === "page") {
    return <PageNavigationBar />;
  }

  return <TrackNavigationBar />;
}

function TrackNavigationBar() {
  const steps = useAppStore((s) => s.steps);
  const tracks = useAppStore((s) => s.tracks);
  const activeStepId = useAppStore((s) => s.activeStepId);
  const activeTrackId = useAppStore((s) => s.activeTrackId);
  const setActiveStep = useAppStore((s) => s.setActiveStep);
  const annotationMode = useAppStore((s) => s.annotationMode);

  const activeTrack = tracks.find((t) => t.id === activeTrackId);

  const replacedIds = useMemo(() => getReplacedStepIds(steps), [steps]);

  const flatSteps = useMemo(
    () => flattenTrackSteps(steps, activeTrackId, { excludeReplacedIds: replacedIds }),
    [steps, activeTrackId, replacedIds],
  );

  const currentIndex = flatSteps.findIndex((s) => s.id === activeStepId);
  const activeStep = currentIndex >= 0 ? flatSteps[currentIndex] : null;

  const { label, rootCount } = activeStep
    ? getStepLabel(activeStep, steps, { excludeReplacedIds: replacedIds })
    : { label: "—", rootCount: 0 };

  const goPrev = () => {
    if (currentIndex > 0) {
      setActiveStep(flatSteps[currentIndex - 1].id);
    }
  };

  const goNext = () => {
    if (currentIndex < flatSteps.length - 1) {
      setActiveStep(flatSteps[currentIndex + 1].id);
    }
  };

  if (flatSteps.length === 0) return null;

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
          {label} of {rootCount} steps
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
        {annotationMode && (
          <span className="text-accent">
            {ANNOTATION_TOOL_LABELS[annotationMode]}
          </span>
        )}
      </span>
      <button
        onClick={goNext}
        disabled={currentIndex >= flatSteps.length - 1}
        className="rounded p-0.5 text-text-tertiary hover:bg-muted hover:text-text-secondary disabled:opacity-30 disabled:hover:bg-transparent"
      >
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function PageNavigationBar() {
  const currentSourcePages = useAppStore((s) => s.currentSourcePages);
  const currentPageIndex = useAppStore((s) => s.currentPageIndex);
  const setCurrentPageIndex = useAppStore((s) => s.setCurrentPageIndex);
  const steps = useAppStore((s) => s.steps);

  const currentPage = currentSourcePages[currentPageIndex];
  const pageSteps = currentPage
    ? steps.filter((s) => s.source_page_id === currentPage.id)
    : [];
  const completedCount = pageSteps.filter((s) => s.is_completed).length;

  const goPrev = () => {
    if (currentPageIndex > 0) setCurrentPageIndex(currentPageIndex - 1);
  };
  const goNext = () => {
    if (currentPageIndex < currentSourcePages.length - 1) setCurrentPageIndex(currentPageIndex + 1);
  };

  if (currentSourcePages.length === 0) return null;

  return (
    <div className="flex h-[30px] items-center justify-center gap-2 border-t border-border bg-background/80 backdrop-blur-sm">
      <button
        onClick={goPrev}
        disabled={currentPageIndex <= 0}
        className="rounded p-0.5 text-text-tertiary hover:bg-muted hover:text-text-secondary disabled:opacity-30 disabled:hover:bg-transparent"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
      </button>
      <span className="flex items-center gap-1.5 text-[11px] text-text-secondary">
        <span className="tabular-nums">
          Page {currentPageIndex + 1} of {currentSourcePages.length}
        </span>
        {pageSteps.length > 0 && (
          <span className="text-text-tertiary">
            ({completedCount}/{pageSteps.length} steps)
          </span>
        )}
      </span>
      <button
        onClick={goNext}
        disabled={currentPageIndex >= currentSourcePages.length - 1}
        className="rounded p-0.5 text-text-tertiary hover:bg-muted hover:text-text-secondary disabled:opacity-30 disabled:hover:bg-transparent"
      >
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
