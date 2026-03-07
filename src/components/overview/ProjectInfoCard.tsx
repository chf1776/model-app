import { Info } from "lucide-react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useAppStore } from "@/store";
import { relativeTime } from "@/shared/format";
import { OverviewCard } from "./OverviewCard";

export function ProjectInfoCard() {
  const project = useAppStore((s) => s.project);
  const tracks = useAppStore((s) => s.tracks);
  const lastActivityTs = useAppStore((s) =>
    s.overviewBuildLog.length > 0 ? s.overviewBuildLog[0].created_at : null,
  );

  if (!project) return null;

  const totalSteps = tracks.reduce((sum, t) => sum + t.step_count, 0);
  const completedSteps = tracks.reduce((sum, t) => sum + t.completed_count, 0);
  const progressPct = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  const startedAt = project.start_date ?? project.created_at;

  return (
    <OverviewCard title="Project Info" icon={Info}>
      <div className="flex gap-2">
        {project.kit_box_art_path && (
          <img
            src={convertFileSrc(project.kit_box_art_path)}
            alt="Box art"
            className="h-14 w-14 shrink-0 rounded object-cover"
          />
        )}
        <div className="min-w-0 flex-1 space-y-1">
          <p className="truncate text-[11px] font-medium text-text-primary">
            {project.kit_name ?? project.name}
          </p>
          <div className="flex flex-wrap gap-1">
            {project.kit_scale && (
              <span className="rounded bg-accent/10 px-1.5 py-0.5 text-[9px] font-medium text-accent">
                {project.kit_scale}
              </span>
            )}
            {project.category && (
              <span className="rounded bg-border px-1.5 py-0.5 text-[9px] font-medium capitalize text-text-secondary">
                {project.category.replace("_", " ")}
              </span>
            )}
            <span
              className="rounded px-1.5 py-0.5 text-[9px] font-medium capitalize"
              style={{
                backgroundColor:
                  project.status === "active"
                    ? "var(--color-status-building)"
                    : project.status === "completed"
                      ? "var(--color-status-completed)"
                      : "var(--color-status-shelf)",
                color: "#fff",
              }}
            >
              {project.status}
            </span>
          </div>
          {/* Timestamps */}
          <div className="flex gap-2 text-[8px] text-text-tertiary">
            <span>Started {relativeTime(startedAt)}</span>
            {lastActivityTs && (
              <span>Last activity {relativeTime(lastActivityTs)}</span>
            )}
          </div>
        </div>
      </div>
      {/* Overall progress */}
      {totalSteps > 0 && (
        <div className="mt-2 space-y-0.5">
          <div className="flex items-center justify-between text-[9px] text-text-tertiary">
            <span>
              {completedSteps}/{totalSteps} steps
            </span>
            <span>{Math.round(progressPct)}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}
      {/* Per-track progress */}
      {tracks.length > 1 && (
        <div className="mt-1.5 space-y-0.5">
          {tracks.map((track) => {
            const pct =
              track.step_count > 0
                ? (track.completed_count / track.step_count) * 100
                : 0;
            return (
              <Tooltip key={track.id}>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: track.color }}
                    />
                    <span className="w-[50px] truncate text-[8px] text-text-tertiary">
                      {track.name}
                    </span>
                    <div className="h-1 flex-1 overflow-hidden rounded-full bg-border">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: track.color,
                        }}
                      />
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  {track.name}: {track.completed_count}/{track.step_count} ({Math.round(pct)}%)
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      )}
    </OverviewCard>
  );
}
