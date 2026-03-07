import { useMemo, useRef, useEffect, forwardRef } from "react";
import { ChevronDown, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAppStore } from "@/store";
import type { Step, InstructionPage } from "@/shared/types";

export function PageRail() {
  const instructionSources = useAppStore((s) => s.instructionSources);
  const currentSourceId = useAppStore((s) => s.currentSourceId);
  const currentSourcePages = useAppStore((s) => s.currentSourcePages);
  const currentPageIndex = useAppStore((s) => s.currentPageIndex);
  const setCurrentSource = useAppStore((s) => s.setCurrentSource);
  const setCurrentPageIndex = useAppStore((s) => s.setCurrentPageIndex);
  const steps = useAppStore((s) => s.steps);
  const setActiveStep = useAppStore((s) => s.setActiveStep);
  const activeStepId = useAppStore((s) => s.activeStepId);

  const currentSource = instructionSources.find((s) => s.id === currentSourceId);

  // Build page -> steps mapping
  const pageStepsMap = useMemo(() => {
    const map = new Map<string, Step[]>();
    for (const step of steps) {
      if (step.source_page_id) {
        const arr = map.get(step.source_page_id) ?? [];
        arr.push(step);
        map.set(step.source_page_id, arr);
      }
    }
    return map;
  }, [steps]);

  // Auto-scroll active page into view
  const activePageRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    activePageRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [currentPageIndex]);

  if (instructionSources.length === 0) {
    return (
      <div className="flex w-[200px] shrink-0 flex-col items-center justify-center border-r border-border bg-sidebar p-4 text-center">
        <p className="text-[11px] text-text-tertiary">
          Upload instructions in Setup mode to use page view.
        </p>
      </div>
    );
  }

  return (
    <div className="flex w-[200px] shrink-0 flex-col border-r border-border bg-sidebar">
      {/* Source selector header */}
      <div className="border-b border-border px-2 py-2">
        {instructionSources.length === 1 ? (
          <div className="flex items-center gap-2 px-1">
            <span className="truncate text-xs font-semibold text-text-primary">
              {currentSource?.name}
            </span>
            <span className="ml-auto text-[10px] tabular-nums text-text-tertiary">
              {currentSourcePages.length} pages
            </span>
          </div>
        ) : (
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex w-full items-center gap-2 rounded px-1 py-0.5 hover:bg-muted">
                <span className="truncate text-xs font-semibold text-text-primary">
                  {currentSource?.name ?? "Select source"}
                </span>
                <span className="ml-auto text-[10px] tabular-nums text-text-tertiary">
                  {currentSourcePages.length}p
                </span>
                <ChevronDown className="h-3 w-3 shrink-0 text-text-tertiary" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-1" align="start">
              {instructionSources.map((src) => (
                <button
                  key={src.id}
                  onClick={() => setCurrentSource(src.id)}
                  className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs ${
                    src.id === currentSourceId
                      ? "bg-accent/10 font-semibold"
                      : "hover:bg-muted"
                  }`}
                >
                  <span className="truncate">{src.name}</span>
                  <span className="ml-auto text-[10px] tabular-nums text-text-tertiary">
                    {src.page_count}p
                  </span>
                </button>
              ))}
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* Page list */}
      <div className="flex-1 overflow-y-auto">
        <div className="py-1">
          {currentSourcePages.map((page, idx) => {
            const pageSteps = pageStepsMap.get(page.id) ?? [];
            const completedCount = pageSteps.filter((s) => s.is_completed).length;
            const isActive = idx === currentPageIndex;
            const hasActiveStep = pageSteps.some((s) => s.id === activeStepId);
            const allComplete = pageSteps.length > 0 && completedCount === pageSteps.length;

            return (
              <PageRow
                key={page.id}
                ref={isActive ? activePageRef : undefined}
                page={page}
                pageNumber={idx + 1}
                isActive={isActive}
                stepCount={pageSteps.length}
                completedCount={completedCount}
                allComplete={allComplete}
                hasActiveStep={hasActiveStep}
                onClick={() => setCurrentPageIndex(idx)}
                steps={pageSteps}
                onStepClick={setActiveStep}
                activeStepId={activeStepId}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Page Row ────────────────────────────────────────────────────────────────

interface PageRowProps {
  page: InstructionPage;
  pageNumber: number;
  isActive: boolean;
  stepCount: number;
  completedCount: number;
  allComplete: boolean;
  hasActiveStep: boolean;
  onClick: () => void;
  steps: Step[];
  onStepClick: (id: string) => void;
  activeStepId: string | null;
}

const PageRow = forwardRef<HTMLButtonElement, PageRowProps>(
  function PageRow(
    { pageNumber, isActive, stepCount, completedCount, allComplete, onClick, steps, onStepClick, activeStepId },
    ref,
  ) {
    const showSteps = isActive && steps.length > 0;

    return (
      <div>
        <button
          ref={ref}
          onClick={onClick}
          className={`flex w-full items-center gap-2 px-2 py-1.5 text-left transition-colors ${
            isActive
              ? "bg-accent/8 border-l-2 border-accent"
              : "border-l-2 border-transparent hover:bg-muted/50"
          }`}
        >
          <span
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-semibold ${
              allComplete
                ? "bg-success/15 text-success"
                : isActive
                  ? "bg-accent/15 text-accent"
                  : "bg-muted text-text-tertiary"
            }`}
          >
            {allComplete ? <Check className="h-3 w-3" /> : pageNumber}
          </span>
          <span
            className={`flex-1 text-[11px] ${
              isActive ? "font-semibold text-accent" : "text-text-primary"
            }`}
          >
            Page {pageNumber}
          </span>
          {stepCount > 0 && (
            <span className="text-[10px] tabular-nums text-text-tertiary">
              {completedCount}/{stepCount}
            </span>
          )}
        </button>

        {/* Step list under active page */}
        {showSteps && (
          <div className="ml-3 border-l border-border pl-1">
            {steps
              .sort((a, b) => a.display_order - b.display_order)
              .map((step) => (
                <button
                  key={step.id}
                  onClick={() => onStepClick(step.id)}
                  className={`flex w-full items-center gap-1.5 px-2 py-1 text-left ${
                    step.id === activeStepId
                      ? "bg-accent/5"
                      : "hover:bg-muted/30"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                      step.is_completed ? "bg-success" : "border border-border bg-transparent"
                    }`}
                  />
                  <span
                    className={`truncate text-[10px] ${
                      step.is_completed
                        ? "text-text-tertiary line-through"
                        : step.id === activeStepId
                          ? "font-medium text-accent"
                          : "text-text-primary"
                    }`}
                  >
                    {step.title}
                  </span>
                </button>
              ))}
          </div>
        )}
      </div>
    );
  },
);
