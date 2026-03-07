import { Info } from "lucide-react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { useAppStore } from "@/store";
import { OverviewCard } from "./OverviewCard";

export function ProjectInfoCard() {
  const project = useAppStore((s) => s.project);
  const tracks = useAppStore((s) => s.tracks);

  if (!project) return null;

  const totalSteps = tracks.reduce((sum, t) => sum + t.step_count, 0);
  const completedSteps = tracks.reduce((sum, t) => sum + t.completed_count, 0);
  const progressPct = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

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
        </div>
      </div>
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
    </OverviewCard>
  );
}
