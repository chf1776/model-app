import { useMemo, useRef, useEffect, useState, forwardRef } from "react";
import { ChevronDown, Check, ArrowRight, ArrowDown } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAppStore } from "@/store";
import type { Step, Track, InstructionPage } from "@/shared/types";
import { getOrderedTrackSteps, buildChildrenMap, getReplacedStepIds } from "./tree-utils";
import { StepThumbnail } from "./StepThumbnail";
import { StepCompletionMarker } from "./StepCompletionMarker";
import * as api from "@/api";
import { toast } from "sonner";

export function BuildingRail() {
  const tracks = useAppStore((s) => s.tracks);
  const steps = useAppStore((s) => s.steps);
  const activeTrackId = useAppStore((s) => s.activeTrackId);
  const activeStepId = useAppStore((s) => s.activeStepId);
  const setActiveTrack = useAppStore((s) => s.setActiveTrack);
  const setActiveStep = useAppStore((s) => s.setActiveStep);
  const updateStepStore = useAppStore((s) => s.updateStepStore);
  const loadTracks = useAppStore((s) => s.loadTracks);
  const activeProjectId = useAppStore((s) => s.activeProjectId);
  const currentSourcePages = useAppStore((s) => s.currentSourcePages);
  const sprueRefs = useAppStore((s) => s.sprueRefs);
  const projectSprueParts = useAppStore((s) => s.projectSprueParts);

  const activeTrack = tracks.find((t) => t.id === activeTrackId) ?? tracks[0] ?? null;
  const effectiveTrackId = activeTrack?.id ?? null;

  // Auto-select first track if none active
  useEffect(() => {
    if (!activeTrackId && tracks.length > 0) {
      setActiveTrack(tracks[0].id);
    }
  }, [activeTrackId, tracks, setActiveTrack]);

  const trackSteps = useMemo(
    () => getOrderedTrackSteps(steps, effectiveTrackId),
    [steps, effectiveTrackId],
  );

  const rootSteps = useMemo(
    () => trackSteps.filter((s) => !s.parent_step_id),
    [trackSteps],
  );

  const childrenMap = useMemo(() => buildChildrenMap(trackSteps), [trackSteps]);

  const pageMap = useMemo(() => {
    const map = new Map<string, InstructionPage>();
    for (const p of currentSourcePages) {
      map.set(p.id, p);
    }
    return map;
  }, [currentSourcePages]);

  // Incoming join points: which tracks join into steps of the active track
  const incomingJoins = useMemo(() => {
    const map = new Map<string, Track[]>();
    for (const t of tracks) {
      if (t.join_point_step_id && t.id !== effectiveTrackId) {
        const step = steps.find((s) => s.id === t.join_point_step_id);
        if (step && step.track_id === effectiveTrackId) {
          const arr = map.get(t.join_point_step_id) ?? [];
          arr.push(t);
          map.set(t.join_point_step_id, arr);
        }
      }
    }
    return map;
  }, [tracks, steps, effectiveTrackId]);

  // Outgoing join: does this track join into another?
  const outgoingJoin = useMemo(() => {
    if (!activeTrack?.join_point_step_id) return null;
    const targetStep = steps.find((s) => s.id === activeTrack.join_point_step_id);
    if (!targetStep) return null;
    const targetTrack = tracks.find((t) => t.id === targetStep.track_id);
    return targetTrack ? { track: targetTrack, step: targetStep } : null;
  }, [activeTrack, steps, tracks]);

  // Replaced step IDs + step lookup map
  const replacedStepIds = useMemo(() => getReplacedStepIds(steps), [steps]);
  const stepsById = useMemo(() => {
    const map = new Map<string, Step>();
    for (const s of steps) map.set(s.id, s);
    return map;
  }, [steps]);

  // Sprue color lookup and per-step sprue labels
  const sprueColorMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const ref of sprueRefs) map.set(ref.label, ref.color);
    return map;
  }, [sprueRefs]);

  const stepSprueLabels = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const part of projectSprueParts) {
      if (!map.has(part.step_id)) map.set(part.step_id, new Set());
      map.get(part.step_id)!.add(part.sprue_label);
    }
    return map;
  }, [projectSprueParts]);

  // Overall project progress (from track counts which exclude replaced steps)
  const totalSteps = tracks.reduce((sum, t) => sum + t.step_count, 0);
  const totalCompleted = tracks.reduce((sum, t) => sum + t.completed_count, 0);

  // Auto-scroll active step into view
  const activeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [activeStepId]);

  const requestStepCompletion = useAppStore((s) => s.requestStepCompletion);
  const [uncompleteStep, setUncompleteStep] = useState<Step | null>(null);

  const handleToggleComplete = async (step: Step) => {
    if (step.is_completed) {
      setUncompleteStep(step);
      return;
    }
    requestStepCompletion(step.id);
  };

  const confirmUncomplete = async () => {
    if (!uncompleteStep) return;
    try {
      const updated = await api.updateStep({
        id: uncompleteStep.id,
        is_completed: false,
      });
      updateStepStore(updated);
      if (activeProjectId) loadTracks(activeProjectId);
    } catch (e) {
      toast.error(`Failed to update step: ${e}`);
    }
    setUncompleteStep(null);
  };

  if (tracks.length === 0) {
    return (
      <div className="flex w-[200px] shrink-0 flex-col items-center justify-center border-r border-border bg-sidebar p-4 text-center">
        <p className="text-[11px] text-text-tertiary">
          Add steps in Setup mode to start building.
        </p>
      </div>
    );
  }

  return (
    <div className="flex w-[200px] shrink-0 flex-col border-r border-border bg-sidebar">
      {/* Track selector header */}
      <div className="border-b border-border px-2 py-2">
        {tracks.length === 1 ? (
          <div className="flex items-center gap-2 px-1">
            <span
              className="inline-block h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: activeTrack?.color }}
            />
            <span className="truncate text-xs font-semibold text-text-primary">
              {activeTrack?.name}
            </span>
            <span className="ml-auto text-[10px] tabular-nums text-text-tertiary">
              {activeTrack?.completed_count}/{activeTrack?.step_count}
            </span>
          </div>
        ) : (
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex w-full items-center gap-2 rounded px-1 py-0.5 hover:bg-muted">
                <span
                  className="inline-block h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: activeTrack?.color }}
                />
                <span className="truncate text-xs font-semibold text-text-primary">
                  {activeTrack?.name}
                </span>
                <span className="ml-auto text-[10px] tabular-nums text-text-tertiary">
                  {activeTrack?.completed_count}/{activeTrack?.step_count}
                </span>
                <ChevronDown className="h-3 w-3 shrink-0 text-text-tertiary" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-1" align="start">
              <div className="mb-1 border-b border-border px-2 py-1.5 text-[10px] text-text-tertiary">
                {totalCompleted}/{totalSteps} overall
              </div>
              {tracks.map((t) => {
                const isSelected = t.id === effectiveTrackId;
                const isComplete = t.step_count > 0 && t.completed_count === t.step_count;
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveTrack(t.id)}
                    className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs ${
                      isSelected
                        ? "bg-accent/10 font-semibold"
                        : "hover:bg-muted"
                    }`}
                  >
                    <span
                      className="inline-block h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: t.color }}
                    />
                    <span
                      className="truncate"
                      style={{ color: isSelected ? t.color : undefined }}
                    >
                      {t.name}
                    </span>
                    <span className="ml-auto text-[10px] tabular-nums text-text-tertiary">
                      {isComplete ? (
                        <Check className="h-3 w-3 text-success" />
                      ) : (
                        `${t.completed_count}/${t.step_count}`
                      )}
                    </span>
                  </button>
                );
              })}
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* Step list */}
      <div className="flex-1 overflow-y-auto">
        {rootSteps.length === 0 ? (
          <div className="flex h-full items-center justify-center p-4">
            <p className="text-center text-[11px] text-text-tertiary">
              No steps in this track yet. Switch to Setup mode to add steps.
            </p>
          </div>
        ) : (
          <div className="py-1">
            {rootSteps.map((step, idx) => {
              const incoming = incomingJoins.get(step.id);
              const children = childrenMap.get(step.id);
              const isActive = step.id === activeStepId;
              const hasActiveChild = children?.some((c) => c.id === activeStepId) ?? false;
              const showChildren = isActive || hasActiveChild;
              const childProgress = children
                ? ([children.filter((c) => c.is_completed).length, children.length] as [number, number])
                : undefined;
              const isReplaced = replacedStepIds.has(step.id);
              const replacesName = step.replaces_step_id
                ? stepsById.get(step.replaces_step_id)?.title ?? null
                : null;

              return (
                <div key={step.id}>
                  {/* Incoming join indicator */}
                  {incoming && (
                    <IncomingJoinRow
                      tracks={incoming}
                      onNavigate={(trackId, stepId) => {
                        setActiveTrack(trackId);
                        setActiveStep(stepId);
                      }}
                    />
                  )}

                  {/* Step row */}
                  <BuildingStepRow
                    ref={isActive ? activeRef : undefined}
                    step={step}
                    index={idx}
                    total={rootSteps.length}
                    isActive={isActive}
                    page={step.source_page_id ? pageMap.get(step.source_page_id) : undefined}
                    childProgress={childProgress}
                    onClick={() => setActiveStep(step.id)}
                    onToggleComplete={() => handleToggleComplete(step)}
                    isReplaced={isReplaced}
                    replacesName={replacesName}
                    sprueLabels={stepSprueLabels.has(step.id) ? [...stepSprueLabels.get(step.id)!] : undefined}
                    sprueColorMap={sprueColorMap}
                  />

                  {/* Sub-steps (visible when parent or any child is active) */}
                  {showChildren && children && children.length > 0 && (
                    <div className="ml-3">
                      {children.map((child) => (
                        <BuildingStepRow
                          key={child.id}
                          step={child}
                          isActive={child.id === activeStepId}
                          page={child.source_page_id ? pageMap.get(child.source_page_id) : undefined}
                          onClick={() => setActiveStep(child.id)}
                          onToggleComplete={() => handleToggleComplete(child)}
                          isSubStep
                          sprueLabels={stepSprueLabels.has(child.id) ? [...stepSprueLabels.get(child.id)!] : undefined}
                          sprueColorMap={sprueColorMap}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Outgoing join indicator */}
            {outgoingJoin && (
              <OutgoingJoinRow
                track={outgoingJoin.track}
                onClick={() => {
                  setActiveTrack(outgoingJoin.track.id);
                  setActiveStep(outgoingJoin.step.id);
                }}
              />
            )}
          </div>
        )}
      </div>

      <AlertDialog open={!!uncompleteStep} onOpenChange={(open) => !open && setUncompleteStep(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Un-complete this step?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark <span className="font-medium">{uncompleteStep?.title}</span> as incomplete.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmUncomplete}>
              Un-complete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ── Step Row ────────────────────────────────────────────────────────────────

interface BuildingStepRowProps {
  step: Step;
  index?: number;
  total?: number;
  isActive: boolean;
  page: InstructionPage | undefined;
  childProgress?: [number, number];
  onClick: () => void;
  onToggleComplete: () => void;
  isSubStep?: boolean;
  isReplaced?: boolean;
  replacesName?: string | null;
  sprueLabels?: string[];
  sprueColorMap?: Map<string, string>;
}

const BuildingStepRow = forwardRef<HTMLButtonElement, BuildingStepRowProps>(
  function BuildingStepRow(
    { step, index, total, isActive, page, childProgress, onClick, onToggleComplete, isSubStep, isReplaced, replacesName, sprueLabels, sprueColorMap },
    ref,
  ) {
    const progress = childProgress
      ? childProgress[1] > 0 ? childProgress[0] / childProgress[1] : 0
      : step.quantity && step.quantity > 1
        ? step.quantity_current / step.quantity
        : undefined;

    return (
      <button
        ref={ref}
        onClick={onClick}
        className={`flex w-full items-center gap-2 px-2 py-1.5 text-left transition-colors ${
          isActive
            ? "bg-accent/8 border-l-2 border-accent"
            : "border-l-2 border-transparent hover:bg-muted/50"
        }`}
      >
        {isReplaced ? (
          <div className="h-[18px] w-[18px] shrink-0" />
        ) : (
          <div className="shrink-0">
            <StepCompletionMarker
              completed={step.is_completed}
              progress={progress}
              onClick={onToggleComplete}
            />
          </div>
        )}

        <StepThumbnail
          step={step}
          page={page}
          isActive={isActive && !isReplaced}
          isCompleted={step.is_completed || !!isReplaced}
        />

        <div className={`min-w-0 flex-1 ${isReplaced ? "opacity-40" : ""}`}>
          <div
            className={`truncate text-[11px] leading-tight ${
              isReplaced
                ? "font-normal text-text-tertiary line-through"
                : step.is_completed
                  ? "font-normal text-text-tertiary"
                  : isActive
                    ? "font-semibold text-accent"
                    : "font-normal text-text-primary"
            }`}
          >
            {step.title}
          </div>
          {isActive && !isSubStep && !isReplaced && index != null && total != null && (
            <div className="mt-0.5 text-[9px] text-text-tertiary">
              Step {index + 1} of {total}
            </div>
          )}
          {replacesName && (
            <div className="mt-0.5 truncate text-[9px] text-accent/70">
              Replaces {replacesName}
            </div>
          )}
        </div>

        {/* Sprue dots */}
        {sprueLabels && sprueLabels.length > 0 && !isReplaced && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="flex shrink-0 items-center gap-px">
                {sprueLabels.slice(0, 3).map((label) => (
                  <span
                    key={label}
                    className="h-[5px] w-[5px] rounded-full"
                    style={{ backgroundColor: sprueColorMap?.get(label) ?? "#888" }}
                  />
                ))}
                {sprueLabels.length > 3 && (
                  <span className="text-[7px] text-text-tertiary">+{sprueLabels.length - 3}</span>
                )}
              </span>
            </TooltipTrigger>
            <TooltipContent>{sprueLabels.join(", ")}</TooltipContent>
          </Tooltip>
        )}

        {/* Pre-paint dot */}
        {step.pre_paint && !isReplaced && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                className="h-[5px] w-[5px] shrink-0 rounded-full"
                style={{ backgroundColor: "var(--color-warning)" }}
              />
            </TooltipTrigger>
            <TooltipContent>Pre-paint</TooltipContent>
          </Tooltip>
        )}
      </button>
    );
  },
);

// ── Join indicators ─────────────────────────────────────────────────────────

function IncomingJoinRow({
  tracks,
  onNavigate,
}: {
  tracks: Track[];
  onNavigate: (trackId: string, stepId: string) => void;
}) {
  return (
    <div className="my-0.5 flex items-center gap-1 px-2 py-1">
      <div className="h-px flex-1 bg-border" />
      {tracks.map((t) => {
        const isComplete = t.step_count > 0 && t.completed_count === t.step_count;
        return (
          <button
            key={t.id}
            onClick={() => {
              // Navigate to the last step of the source track
              onNavigate(t.id, t.join_point_step_id ?? t.id);
            }}
            className="flex items-center gap-1 text-[9px] text-text-secondary hover:text-accent"
          >
            <span
              className="inline-block h-[18px] w-[3px] rounded-sm"
              style={{ backgroundColor: isComplete ? "var(--color-success)" : t.color }}
            />
            <ArrowDown className="h-2.5 w-2.5" style={{ color: isComplete ? "var(--color-success)" : t.color }} />
            <span className="truncate">{t.name}</span>
            {isComplete && <Check className="h-2.5 w-2.5 text-success" />}
          </button>
        );
      })}
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

function OutgoingJoinRow({
  track,
  onClick,
}: {
  track: Track;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="my-0.5 flex w-full items-center gap-1 px-2 py-1 text-[9px] text-text-tertiary hover:text-accent"
    >
      <div className="h-px flex-1 bg-border" />
      <ArrowRight className="h-2.5 w-2.5" />
      <span
        className="inline-block h-[18px] w-[3px] rounded-sm"
        style={{ backgroundColor: track.color }}
      />
      <span className="truncate">{track.name}</span>
      <div className="h-px flex-1 bg-border" />
    </button>
  );
}
