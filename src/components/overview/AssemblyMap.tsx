import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  ChevronDown,
  ChevronRight,
  Map,
  Share2,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useAppStore } from "@/store";
import { useNavigateToStep } from "@/hooks/useNavigateToStep";
import { listProjectStepRelations } from "@/api";
import { cn } from "@/lib/utils";
import type { Track, Step, StepRelation } from "@/shared/types";

const ROW_HEIGHT = 24;
const NODE_R = 5;
const NODE_SPACING = 22;
const LABEL_WIDTH = 80;
const SVG_PAD_X = 8;
const SVG_PAD_Y = 4;

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2.0;
const ZOOM_STEP = 0.25;

interface TrackRow {
  track: Track;
  steps: Step[];
}

export function AssemblyMap() {
  const tracks = useAppStore((s) => s.tracks);
  const steps = useAppStore((s) => s.steps);
  const activeStepId = useAppStore((s) => s.activeStepId);
  const activeProjectId = useAppStore((s) => s.activeProjectId);
  const navigateToStep = useNavigateToStep();
  const [collapsed, setCollapsed] = useState(false);
  const [showDeps, setShowDeps] = useState(false);
  const [projectRelations, setProjectRelations] = useState<StepRelation[]>([]);
  const [depsLoaded, setDepsLoaded] = useState(false);
  const [zoom, setZoom] = useState(1.0);
  const containerRef = useRef<HTMLDivElement>(null);

  const trackRows: TrackRow[] = useMemo(() => {
    return tracks.map((track) => ({
      track,
      steps: steps
        .filter((s) => s.track_id === track.id && !s.parent_step_id)
        .sort((a, b) => a.display_order - b.display_order),
    }));
  }, [tracks, steps]);

  const totalSteps = tracks.reduce((sum, t) => sum + t.step_count, 0);
  const completedSteps = tracks.reduce(
    (sum, t) => sum + t.completed_count,
    0,
  );
  const progressPct =
    totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  const maxSteps = Math.max(1, ...trackRows.map((r) => r.steps.length));
  const svgWidth = SVG_PAD_X * 2 + maxSteps * NODE_SPACING;
  const svgHeight = SVG_PAD_Y * 2 + trackRows.length * ROW_HEIGHT;

  // Replaced step styling: steps where another step has replaces_step_id === step.id
  const replacedStepIds = useMemo(() => {
    const ids = new Set<string>();
    for (const s of steps) {
      if (s.replaces_step_id) ids.add(s.replaces_step_id);
    }
    return ids;
  }, [steps]);

  // Sub-step count indicators
  const subStepCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of steps) {
      if (s.parent_step_id) {
        counts[s.parent_step_id] = (counts[s.parent_step_id] || 0) + 1;
      }
    }
    return counts;
  }, [steps]);

  // Build a map of stepId -> { trackIndex, stepIndex } for join arrows
  const stepPositionMap = useMemo(() => {
    const map: Record<string, { trackIndex: number; stepIndex: number }> = {};
    trackRows.forEach((row, trackIndex) => {
      row.steps.forEach((step, stepIndex) => {
        map[step.id] = { trackIndex, stepIndex };
      });
    });
    return map;
  }, [trackRows]);

  const nodeCenter = useCallback(
    (trackIdx: number, stepIdx: number) => ({
      cx: SVG_PAD_X + stepIdx * NODE_SPACING + NODE_SPACING / 2,
      cy: SVG_PAD_Y + trackIdx * ROW_HEIGHT + ROW_HEIGHT / 2,
    }),
    [],
  );

  // Lazy load relations on first toggle
  useEffect(() => {
    if (showDeps && !depsLoaded && activeProjectId) {
      listProjectStepRelations(activeProjectId).then((rels) => {
        setProjectRelations(rels);
        setDepsLoaded(true);
      });
    }
  }, [showDeps, depsLoaded, activeProjectId]);

  // Reset deps loaded when project changes
  useEffect(() => {
    setDepsLoaded(false);
    setProjectRelations([]);
    setShowDeps(false);
  }, [activeProjectId]);

  const handleNodeClick = navigateToStep;

  const contentWidth = LABEL_WIDTH + svgWidth;

  const fitToScreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    // Use the outer card's width minus px-2 padding (16px) to get available space.
    // We read from parentElement to avoid measuring the scroll container itself,
    // whose clientWidth changes based on current content/scrollbar state.
    const cardWidth = el.parentElement?.clientWidth ?? el.clientWidth;
    const available = cardWidth - 16; // subtract px-2 padding
    const scale = Math.min(
      ZOOM_MAX,
      Math.max(ZOOM_MIN, available / contentWidth),
    );
    setZoom(Math.round(scale * 100) / 100);
  }, [contentWidth]);

  return (
    <div className="shrink-0 rounded-lg border border-border bg-card">
      <div
        className="flex w-full items-center gap-1.5 p-2"
      >
        <button
          className="flex items-center gap-1.5 text-left"
          onClick={() => setCollapsed((p) => !p)}
        >
          {collapsed ? (
            <ChevronRight className="h-3 w-3 text-text-tertiary" />
          ) : (
            <ChevronDown className="h-3 w-3 text-text-tertiary" />
          )}
          <Map className="h-3.5 w-3.5 text-text-tertiary" />
          <span className="text-[11px] font-semibold text-text-primary">
            Assembly Map
          </span>
        </button>

        {/* Toolbar — only when expanded */}
        {!collapsed && (
          <div className="ml-auto flex items-center gap-1">
            {/* Dependency arrows toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className={cn(
                    "rounded p-0.5",
                    showDeps ? "text-accent" : "text-text-tertiary hover:text-text-secondary",
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeps((p) => !p);
                  }}
                >
                  <Share2 className="h-3 w-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                {showDeps ? "Hide" : "Show"} dependency arrows
              </TooltipContent>
            </Tooltip>

            {/* Zoom controls */}
            <button
              className="rounded p-0.5 text-text-tertiary hover:text-text-secondary disabled:opacity-30"
              disabled={zoom <= ZOOM_MIN}
              onClick={(e) => {
                e.stopPropagation();
                setZoom((z) => Math.max(ZOOM_MIN, z - ZOOM_STEP));
              }}
            >
              <ZoomOut className="h-3 w-3" />
            </button>
            <span className="min-w-[28px] text-center text-[9px] text-text-tertiary">
              {Math.round(zoom * 100)}%
            </span>
            <button
              className="rounded p-0.5 text-text-tertiary hover:text-text-secondary disabled:opacity-30"
              disabled={zoom >= ZOOM_MAX}
              onClick={(e) => {
                e.stopPropagation();
                setZoom((z) => Math.min(ZOOM_MAX, z + ZOOM_STEP));
              }}
            >
              <ZoomIn className="h-3 w-3" />
            </button>

            {/* Fit to screen */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="rounded p-0.5 text-text-tertiary hover:text-text-secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    fitToScreen();
                  }}
                >
                  <Maximize2 className="h-3 w-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Fit to screen</TooltipContent>
            </Tooltip>

            <span className="ml-1 text-[9px] text-text-tertiary">
              {completedSteps}/{totalSteps} &middot; {progressPct}%
            </span>
          </div>
        )}

        {/* Collapsed summary */}
        {collapsed && (
          <span className="ml-auto text-[9px] text-text-tertiary">
            {completedSteps}/{totalSteps} &middot; {progressPct}%
          </span>
        )}
      </div>

      {collapsed ? (
        <div className="flex gap-1.5 px-2 pb-2">
          {trackRows.map(({ track }) => {
            const pct =
              track.step_count > 0
                ? (track.completed_count / track.step_count) * 100
                : 0;
            return (
              <Tooltip key={track.id}>
                <TooltipTrigger asChild>
                  <div
                    className="h-[3px] w-3 overflow-hidden rounded-full"
                    style={{ backgroundColor: track.color + "40" }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: track.color,
                      }}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  {track.name}: {Math.round(pct)}%
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      ) : (
        trackRows.length > 0 && (
          <div ref={containerRef} className="overflow-auto px-2 pb-2">
            {/* Sizer div — sets scrollable area to scaled dimensions */}
            <div style={{ width: contentWidth * zoom, height: svgHeight * zoom }}>
              {/* Transform div — visually scales content */}
              <div
                className="flex"
                style={{
                  width: contentWidth,
                  height: svgHeight,
                  transform: `scale(${zoom})`,
                  transformOrigin: "top left",
                }}
              >
                <div className="shrink-0" style={{ width: LABEL_WIDTH }}>
                  {trackRows.map(({ track }) => (
                    <div
                      key={track.id}
                      className="flex items-center truncate pr-1 text-[9px] font-medium text-text-secondary"
                      style={{ height: ROW_HEIGHT }}
                    >
                      <span
                        className="mr-1 inline-block h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: track.color }}
                      />
                      <span className="truncate">{track.name}</span>
                    </div>
                  ))}
                </div>
                <svg
                  width={svgWidth}
                  height={svgHeight}
                  className="shrink-0"
                >
                  {/* Arrowhead marker for dependency arrows */}
                  <defs>
                    <marker
                      id="dep-arrow"
                      viewBox="0 0 6 6"
                      refX={6}
                      refY={3}
                      markerWidth={6}
                      markerHeight={6}
                      orient="auto-start-reverse"
                    >
                      <path
                        d="M 0 0 L 6 3 L 0 6 z"
                        fill="var(--color-text-tertiary)"
                      />
                    </marker>
                  </defs>

                  {/* Join arrows — from first node of joining track to the join point step */}
                  {trackRows.map(({ track, steps: rowSteps }, trackIdx) => {
                    if (!track.join_point_step_id || rowSteps.length === 0)
                      return null;
                    const target = stepPositionMap[track.join_point_step_id];
                    if (!target) return null;
                    const from = nodeCenter(trackIdx, 0);
                    const to = nodeCenter(target.trackIndex, target.stepIndex);
                    return (
                      <line
                        key={`join-${track.id}`}
                        x1={from.cx}
                        y1={from.cy}
                        x2={to.cx}
                        y2={to.cy}
                        stroke={track.color}
                        strokeWidth={1}
                        strokeDasharray="3 2"
                        opacity={0.5}
                      />
                    );
                  })}

                  {/* Dependency arrows */}
                  {showDeps &&
                    projectRelations.map((rel) => {
                      const fromPos = stepPositionMap[rel.from_step_id];
                      const toPos = stepPositionMap[rel.to_step_id];
                      if (!fromPos || !toPos) return null;
                      const from = nodeCenter(fromPos.trackIndex, fromPos.stepIndex);
                      const to = nodeCenter(toPos.trackIndex, toPos.stepIndex);
                      return (
                        <line
                          key={`dep-${rel.id}`}
                          x1={from.cx}
                          y1={from.cy}
                          x2={to.cx}
                          y2={to.cy}
                          stroke="var(--color-text-tertiary)"
                          strokeWidth={1}
                          markerEnd="url(#dep-arrow)"
                          opacity={0.6}
                        />
                      );
                    })}

                  {/* Nodes */}
                  {trackRows.map(({ track, steps: rowSteps }, trackIdx) =>
                    rowSteps.map((step, stepIdx) => {
                      const { cx, cy } = nodeCenter(trackIdx, stepIdx);
                      const isReplaced = replacedStepIds.has(step.id);
                      const childCount = subStepCounts[step.id];
                      return (
                        <Tooltip key={step.id}>
                          <TooltipTrigger asChild>
                            <g
                              className="cursor-pointer"
                              onClick={() => handleNodeClick(step.id)}
                              opacity={isReplaced ? 0.3 : 1}
                            >
                              {step.id === activeStepId && (
                                <circle
                                  cx={cx}
                                  cy={cy}
                                  r={NODE_R + 3}
                                  fill="none"
                                  stroke="var(--color-accent)"
                                  strokeWidth={1.5}
                                  opacity={0.6}
                                />
                              )}
                              <circle
                                cx={cx}
                                cy={cy}
                                r={NODE_R}
                                fill={step.is_completed ? track.color : "#fff"}
                                stroke={track.color}
                                strokeWidth={1.5}
                                opacity={step.is_completed ? 1 : 0.5}
                              />
                              {/* Strikethrough for replaced steps */}
                              {isReplaced && (
                                <line
                                  x1={cx - NODE_R}
                                  y1={cy}
                                  x2={cx + NODE_R}
                                  y2={cy}
                                  stroke={track.color}
                                  strokeWidth={1.5}
                                />
                              )}
                              <circle
                                cx={cx}
                                cy={cy}
                                r={NODE_R + 5}
                                fill="transparent"
                                pointerEvents="all"
                              />
                              {/* Sub-step count indicator */}
                              {childCount && (
                                <text
                                  x={cx}
                                  y={cy + NODE_R + 8}
                                  textAnchor="middle"
                                  fontSize={7}
                                  fill="var(--color-text-tertiary)"
                                >
                                  ×{childCount}
                                </text>
                              )}
                            </g>
                          </TooltipTrigger>
                          <TooltipContent>{step.title}</TooltipContent>
                        </Tooltip>
                      );
                    }),
                  )}
                </svg>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}
