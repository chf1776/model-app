import { useState, useMemo } from "react";
import { ChevronDown, ChevronRight, Map } from "lucide-react";
import { useAppStore } from "@/store";
import type { Track, Step } from "@/shared/types";

const ROW_HEIGHT = 24;
const NODE_R = 5;
const NODE_SPACING = 22;
const LABEL_WIDTH = 80;
const SVG_PAD_X = 8;
const SVG_PAD_Y = 4;

interface TrackRow {
  track: Track;
  steps: Step[];
}

export function AssemblyMap() {
  const tracks = useAppStore((s) => s.tracks);
  const steps = useAppStore((s) => s.steps);
  const setActiveZone = useAppStore((s) => s.setActiveZone);
  const setActiveStep = useAppStore((s) => s.setActiveStep);
  const [collapsed, setCollapsed] = useState(false);
  const [hoveredStepId, setHoveredStepId] = useState<string | null>(null);

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

  const handleNodeClick = (stepId: string) => {
    setActiveStep(stepId);
    setActiveZone("build");
  };

  const hoveredStep = hoveredStepId
    ? steps.find((s) => s.id === hoveredStepId)
    : null;

  return (
    <div className="shrink-0 rounded-lg border border-border bg-card">
      <button
        className="flex w-full items-center gap-1.5 p-2 text-left"
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
        <span className="ml-auto text-[9px] text-text-tertiary">
          {completedSteps}/{totalSteps} &middot; {progressPct}%
        </span>
      </button>

      {collapsed ? (
        <div className="flex gap-1.5 px-2 pb-2">
          {trackRows.map(({ track }) => {
            const pct =
              track.step_count > 0
                ? (track.completed_count / track.step_count) * 100
                : 0;
            return (
              <div
                key={track.id}
                className="h-[3px] w-3 overflow-hidden rounded-full"
                style={{ backgroundColor: track.color + "40" }}
                title={`${track.name}: ${Math.round(pct)}%`}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: track.color,
                  }}
                />
              </div>
            );
          })}
        </div>
      ) : (
        trackRows.length > 0 && (
          <div className="relative flex overflow-x-auto px-2 pb-2">
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
              {/* Join arrows */}
              {trackRows.map(({ track }, trackIdx) => {
                if (!track.join_point_step_id) return null;
                const target = stepPositionMap[track.join_point_step_id];
                if (!target) return null;
                const fromX = SVG_PAD_X;
                const fromY =
                  SVG_PAD_Y + trackIdx * ROW_HEIGHT + ROW_HEIGHT / 2;
                const toX =
                  SVG_PAD_X + target.stepIndex * NODE_SPACING + NODE_SPACING / 2;
                const toY =
                  SVG_PAD_Y +
                  target.trackIndex * ROW_HEIGHT +
                  ROW_HEIGHT / 2;
                return (
                  <line
                    key={`join-${track.id}`}
                    x1={fromX}
                    y1={fromY}
                    x2={toX}
                    y2={toY}
                    stroke={track.color}
                    strokeWidth={1}
                    strokeDasharray="3 2"
                    opacity={0.5}
                  />
                );
              })}
              {/* Nodes */}
              {trackRows.map(({ track, steps: rowSteps }, trackIdx) =>
                rowSteps.map((step, stepIdx) => {
                  const cx =
                    SVG_PAD_X + stepIdx * NODE_SPACING + NODE_SPACING / 2;
                  const cy =
                    SVG_PAD_Y + trackIdx * ROW_HEIGHT + ROW_HEIGHT / 2;
                  const isHovered = hoveredStepId === step.id;
                  return (
                    <circle
                      key={step.id}
                      cx={cx}
                      cy={cy}
                      r={isHovered ? NODE_R + 1 : NODE_R}
                      fill={step.is_completed ? track.color : "#fff"}
                      stroke={track.color}
                      strokeWidth={1.5}
                      opacity={step.is_completed ? 1 : 0.5}
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredStepId(step.id)}
                      onMouseLeave={() => setHoveredStepId(null)}
                      onClick={() => handleNodeClick(step.id)}
                    />
                  );
                }),
              )}
            </svg>
            {hoveredStep && (
              <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 whitespace-nowrap rounded bg-text-primary px-1.5 py-0.5 text-[9px] text-white shadow">
                {hoveredStep.title}
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
}
