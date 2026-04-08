import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/store";
import * as api from "@/api";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Step, StepSpruePart } from "@/shared/types";
import { StepCompletionMarker } from "./StepCompletionMarker";
import { StartTimerButton } from "./panel/TimerSection";
import { SectionLabel, Divider } from "./panel/primitives";
import { SpruePartsGrid } from "./panel/SpruePartsGrid";
import { SubStepsList } from "./panel/SubStepsList";
import { InlineRelationPills } from "./panel/InlineRelationPills";
import { parseStepRelations } from "./tree-utils";
import { isPartFullyTicked, groupPartsBySprue } from "@/shared/utils";
import { getSwatchStyle } from "@/lib/utils";

// ── Component ───────────────────────────────────────────────────────────────

export function PageInfoPanel() {
  const currentSourcePages = useAppStore((s) => s.currentSourcePages);
  const currentPageIndex = useAppStore((s) => s.currentPageIndex);
  const steps = useAppStore((s) => s.steps);
  const tracks = useAppStore((s) => s.tracks);
  const activeStepId = useAppStore((s) => s.activeStepId);
  const setActiveStep = useAppStore((s) => s.setActiveStep);
  const requestStepCompletion = useAppStore((s) => s.requestStepCompletion);
  const updateStepStore = useAppStore((s) => s.updateStepStore);
  const loadTracks = useAppStore((s) => s.loadTracks);
  const activeProjectId = useAppStore((s) => s.activeProjectId);

  // Lazy-load caches
  const stepSprueParts = useAppStore((s) => s.stepSprueParts);
  const loadStepSprueParts = useAppStore((s) => s.loadStepSprueParts);
  const setSpruePartTicked = useAppStore((s) => s.setSpruePartTicked);
  const stepPaintRefs = useAppStore((s) => s.stepPaintRefs);
  const loadStepPaintRefs = useAppStore((s) => s.loadStepPaintRefs);
  const stepRelations = useAppStore((s) => s.stepRelations);
  const loadStepRelations = useAppStore((s) => s.loadStepRelations);
  const projectPaletteEntries = useAppStore((s) => s.projectPaletteEntries);
  const sprueRefs = useAppStore((s) => s.sprueRefs);

  // Local UI state
  const [expandedTrackIds, setExpandedTrackIds] = useState<Set<string>>(new Set());
  const [expandedStepIds, setExpandedStepIds] = useState<Set<string>>(new Set());

  const currentPage = currentSourcePages[currentPageIndex];
  const pageId = currentPage?.id;

  // Steps on this page
  const pageSteps = useMemo(
    () => (pageId ? steps.filter((s) => s.source_page_id === pageId) : []),
    [steps, pageId],
  );

  // Parent → children lookup (avoids O(N²) in render loop)
  const childrenMap = useMemo(() => {
    const map = new Map<string, Step[]>();
    for (const s of steps) {
      if (s.parent_step_id) {
        const arr = map.get(s.parent_step_id) ?? [];
        arr.push(s);
        map.set(s.parent_step_id, arr);
      }
    }
    return map;
  }, [steps]);

  // Group steps by track
  const trackGroups = useMemo(() => {
    const map = new Map<string, Step[]>();
    for (const step of pageSteps) {
      const arr = map.get(step.track_id) ?? [];
      arr.push(step);
      map.set(step.track_id, arr);
    }
    return Array.from(map.entries()).map(([trackId, trackSteps]) => ({
      track: tracks.find((t) => t.id === trackId),
      steps: trackSteps,
    }));
  }, [pageSteps, tracks]);

  // Auto-expand all tracks that have steps
  useEffect(() => {
    if (trackGroups.length > 0) {
      setExpandedTrackIds(new Set(trackGroups.map((g) => g.track?.id ?? "")));
    }
  }, [pageId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Lazy load data for steps on this page
  useEffect(() => {
    if (!pageId) return;
    for (const step of pageSteps) {
      if (!stepSprueParts[step.id]) loadStepSprueParts(step.id);
      if (!stepPaintRefs[step.id]) loadStepPaintRefs(step.id);
      if (!stepRelations[step.id]) loadStepRelations(step.id);
    }
  }, [pageId, pageSteps.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Progress stats ──────────────────────────────────────────────────────

  const stepStats = useMemo(() => {
    const total = pageSteps.length;
    const completed = pageSteps.filter((s) => s.is_completed).length;
    return { total, completed };
  }, [pageSteps]);

  // Aggregate step_sprue_parts from all steps on this page
  const allParts = useMemo((): (StepSpruePart & { _stepId: string })[] => {
    const parts: (StepSpruePart & { _stepId: string })[] = [];
    for (const step of pageSteps) {
      for (const p of stepSprueParts[step.id] ?? []) {
        parts.push({ ...p, _stepId: step.id });
      }
    }
    return parts;
  }, [stepSprueParts, pageSteps]);

  const partStats = useMemo(() => {
    const total = allParts.reduce((sum, p) => sum + p.quantity, 0);
    const ticked = allParts.reduce((sum, p) => sum + Math.min(p.ticked_count, p.quantity), 0);
    return { total, ticked };
  }, [allParts]);

  type PartWithStep = StepSpruePart & { _stepId: string };

  // Group parts by sprue for rendering
  const groupedParts = useMemo(() => groupPartsBySprue<PartWithStep>(allParts), [allParts]);

  // Unique paint entries on this page
  const pagePaints = useMemo(() => {
    const ids = new Set<string>();
    for (const step of pageSteps) {
      for (const id of stepPaintRefs[step.id] ?? []) {
        ids.add(id);
      }
    }
    return projectPaletteEntries.filter((e) => ids.has(e.id));
  }, [pageSteps, stepPaintRefs, projectPaletteEntries]);

  const refMap = useMemo(
    () => new Map(sprueRefs.map((r) => [r.label, r])),
    [sprueRefs],
  );


  // ── Handlers ────────────────────────────────────────────────────────────

  const toggleTrack = (trackId: string) => {
    setExpandedTrackIds((prev) => {
      const next = new Set(prev);
      if (next.has(trackId)) next.delete(trackId);
      else next.add(trackId);
      return next;
    });
  };

  const toggleStepExpand = (stepId: string) => {
    setExpandedStepIds((prev) => {
      const next = new Set(prev);
      if (next.has(stepId)) next.delete(stepId);
      else next.add(stepId);
      return next;
    });
  };

  const handleToggleSubStep = async (child: Step) => {
    try {
      const updated = await api.updateStep({
        id: child.id,
        is_completed: !child.is_completed,
      });
      updateStepStore(updated);
      if (activeProjectId) loadTracks(activeProjectId);
    } catch (e) {
      toast.error(`Failed to update step: ${e}`);
    }
  };

  const handleTickPart = (part: StepSpruePart & { _stepId: string }) => {
    const fullyTicked = isPartFullyTicked(part);
    const nextCount = fullyTicked ? 0 : part.ticked_count + 1;
    setSpruePartTicked(part._stepId, part.id, nextCount);
  };

  // ── Render ──────────────────────────────────────────────────────────────

  if (!currentPage) {
    return (
      <div className="flex w-[280px] shrink-0 items-center justify-center border-l border-border bg-card p-4 text-center text-xs text-text-tertiary">
        No page selected
      </div>
    );
  }

  const progressPct = stepStats.total > 0 ? (stepStats.completed / stepStats.total) * 100 : 0;

  return (
    <div className="flex w-[280px] shrink-0 flex-col overflow-hidden border-l border-border bg-card">
      {/* Section 1: Page Progress Header */}
      <div className="border-b border-border px-3 py-2.5">
        <div className="flex items-baseline justify-between">
          <span className="text-xs font-semibold text-text-primary">
            Page {currentPageIndex + 1} of {currentSourcePages.length}
          </span>
        </div>
        <div className="mt-1 flex items-center gap-2 text-[10px] text-text-tertiary">
          <span>{stepStats.completed}/{stepStats.total} steps</span>
          {partStats.total > 0 && (
            <>
              <span>·</span>
              <span>{partStats.ticked}/{partStats.total} parts</span>
            </>
          )}
        </div>
        {stepStats.total > 0 && (
          <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        )}
      </div>

      <ScrollArea className="flex-1 overflow-hidden">
        <div className="p-3">
          {/* Section 2: Steps on This Page */}
          {pageSteps.length > 0 && (
            <>
              <SectionLabel>Steps on this page</SectionLabel>
              <div className="mt-1.5 space-y-1">
                {trackGroups.map(({ track, steps: trackSteps }) => {
                  if (!track) return null;
                  const trackCompleted = trackSteps.filter((s) => s.is_completed).length;
                  const isExpanded = expandedTrackIds.has(track.id);

                  return (
                    <div key={track.id}>
                      {/* Track header */}
                      <button
                        onClick={() => toggleTrack(track.id)}
                        className="flex w-full items-center gap-1.5 rounded px-1 py-1 text-left hover:bg-muted/50"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-3 w-3 shrink-0 text-text-tertiary" />
                        ) : (
                          <ChevronRight className="h-3 w-3 shrink-0 text-text-tertiary" />
                        )}
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: track.color }}
                        />
                        <span className="flex-1 truncate text-[11px] font-medium text-text-primary">
                          {track.name}
                        </span>
                        <span className="text-[10px] tabular-nums text-text-tertiary">
                          {trackCompleted}/{trackSteps.length}
                        </span>
                      </button>

                      {/* Steps list */}
                      {isExpanded && (
                        <div className="ml-3 space-y-0.5">
                          {trackSteps.map((step) => {
                            const children = childrenMap.get(step.id) ?? [];
                            const isStepExpanded = expandedStepIds.has(step.id);
                            const isActive = step.id === activeStepId;
                            const rels = stepRelations[step.id]
                              ? parseStepRelations(stepRelations[step.id], step.id)
                              : null;

                            return (
                              <div key={step.id}>
                                <div
                                  className={`flex items-center gap-1.5 rounded px-1 py-1 ${
                                    isActive ? "bg-accent/8" : "hover:bg-muted/30"
                                  }`}
                                >
                                  <StepCompletionMarker
                                    completed={step.is_completed}
                                    onClick={() => requestStepCompletion(step.id)}
                                  />
                                  <button
                                    onClick={() => setActiveStep(step.id)}
                                    className="min-w-0 flex-1 truncate text-left text-[11px] text-text-primary"
                                  >
                                    {step.title}
                                  </button>
                                  {(children.length > 0 || step.notes || (rels && (rels.blockedByIds.length > 0 || rels.incomingBlockedBy.length > 0))) && (
                                    <button
                                      onClick={() => toggleStepExpand(step.id)}
                                      className="shrink-0 rounded p-0.5 text-text-quaternary hover:text-text-secondary"
                                    >
                                      {isStepExpanded ? (
                                        <ChevronDown className="h-3 w-3" />
                                      ) : (
                                        <ChevronRight className="h-3 w-3" />
                                      )}
                                    </button>
                                  )}
                                </div>

                                {/* Expanded inline detail */}
                                {isStepExpanded && (
                                  <div className="ml-6 mb-1 space-y-1.5 border-l border-border/50 pl-2 pt-1">
                                    {/* Timer */}
                                    <div className="max-w-[180px]">
                                      <StartTimerButton step={step} />
                                    </div>

                                    {/* Notes */}
                                    {step.notes && (
                                      <p className="line-clamp-3 whitespace-pre-wrap font-mono text-[10px] leading-relaxed text-text-secondary">
                                        {step.notes}
                                      </p>
                                    )}

                                    {/* Sub-steps */}
                                    <SubStepsList
                                      variant="inline"
                                      subSteps={children}
                                      onToggle={handleToggleSubStep}
                                    />

                                    {/* Relations */}
                                    {rels && (
                                      <>
                                        <InlineRelationPills
                                          label="Blocked by"
                                          ids={rels.blockedByIds}
                                          steps={steps}
                                          tone="destructive"
                                        />
                                        <InlineRelationPills
                                          label="Blocks"
                                          ids={rels.incomingBlockedBy}
                                          steps={steps}
                                          tone="warning"
                                        />
                                      </>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {pageSteps.length === 0 && (
            <p className="py-4 text-center text-[11px] text-text-tertiary">
              No steps on this page
            </p>
          )}

          {/* Section 3: Parts on This Page */}
          {(sprueRefs.length > 0 || allParts.length > 0) && (
            <>
              <Divider />
              <SectionLabel>Parts on this page</SectionLabel>

              {groupedParts.length > 0 ? (
                <div className="mt-1.5 space-y-1.5">
                  <SpruePartsGrid
                    groups={groupedParts}
                    refMap={refMap}
                    onTickPart={handleTickPart}
                  />
                  <p className="text-[9px] text-text-tertiary">
                    {allParts.length} part{allParts.length === 1 ? "" : "s"} · {partStats.ticked}/{partStats.total} ticked
                  </p>
                </div>
              ) : (
                <p className="mt-1 text-[10px] text-text-tertiary">
                  No parts found on steps for this page
                </p>
              )}
            </>
          )}

          {/* Section 4: Paints on This Page */}
          {pagePaints.length > 0 && (
            <>
              <Divider />
              <SectionLabel>Paints on this page</SectionLabel>
              <div className="mt-1.5 space-y-1">
                {pagePaints.map((entry) => (
                  <div key={entry.id} className="flex items-center gap-2">
                    <span
                      className="h-4 w-4 shrink-0 rounded-sm border border-black/10"
                      style={getSwatchStyle(entry)}
                    />
                    <span className="min-w-0 truncate text-[11px] text-text-primary">
                      {entry.name}
                    </span>
                    {entry.paint_brand && (
                      <span className="ml-auto shrink-0 text-[9px] text-text-tertiary">
                        {entry.paint_brand}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
