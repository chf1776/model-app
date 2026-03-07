import { useMemo } from "react";
import { ScrollText } from "lucide-react";
import { useAppStore } from "@/store";
import type { BuildLogEntry } from "@/shared/types";
import { OverviewCard } from "./OverviewCard";

function relativeTime(ts: number): string {
  const now = Date.now() / 1000;
  const diff = now - ts;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(ts * 1000).toLocaleDateString();
}

function entryLabel(entry: BuildLogEntry): string {
  switch (entry.entry_type) {
    case "step_complete":
      return entry.body ?? `Step ${entry.step_number ?? ""} completed`;
    case "milestone":
      return entry.body ?? "Milestone reached";
    case "note":
      return entry.body ?? "Note added";
    case "photo":
      return "Photo added";
    case "build_complete":
      return "Build complete";
    default:
      return entry.body ?? entry.entry_type;
  }
}

const MAX_ENTRIES = 5;

export function BuildLogCard() {
  const buildLog = useAppStore((s) => s.overviewBuildLog);
  const tracks = useAppStore((s) => s.tracks);
  const entries = buildLog.slice(0, MAX_ENTRIES);

  const trackColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const t of tracks) map[t.id] = t.color;
    return map;
  }, [tracks]);

  return (
    <OverviewCard
      title="Build Log"
      icon={ScrollText}
      subtitle={buildLog.length > 0 ? `${buildLog.length} entries` : undefined}
    >
      {entries.length === 0 ? (
        <div className="flex h-full items-center justify-center py-3">
          <span className="text-[9px] text-text-tertiary">
            No activity yet
          </span>
        </div>
      ) : (
        <div className="space-y-1">
          {entries.map((entry) => {
            const trackColor = entry.track_id
              ? trackColorMap[entry.track_id]
              : undefined;
            const isMilestone = entry.entry_type === "milestone";
            const isCompletion =
              entry.entry_type === "step_complete" ||
              entry.entry_type === "build_complete";
            const dotColor =
              isCompletion || isMilestone
                ? trackColor ?? "var(--color-accent)"
                : undefined;

            return (
              <div key={entry.id} className="flex items-start gap-1.5">
                {isMilestone ? (
                  <div
                    className="mt-[3px] h-2 w-2 shrink-0 rounded-sm"
                    style={{ backgroundColor: dotColor }}
                  />
                ) : (
                  <div
                    className="mt-[3px] h-2 w-2 shrink-0 rounded-full border"
                    style={
                      dotColor
                        ? { backgroundColor: dotColor, borderColor: dotColor }
                        : { borderColor: "var(--color-accent)" }
                    }
                  />
                )}
                <span className="min-w-0 flex-1 truncate text-[9px] leading-tight text-text-secondary">
                  {entryLabel(entry)}
                </span>
                <span className="shrink-0 text-[8px] text-text-tertiary">
                  {relativeTime(entry.created_at)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </OverviewCard>
  );
}
