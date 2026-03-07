import { useMemo } from "react";
import { ScrollText } from "lucide-react";
import { useAppStore } from "@/store";
import { relativeTime } from "@/shared/format";
import { useNavigateToStep } from "@/hooks/useNavigateToStep";
import type { BuildLogEntry } from "@/shared/types";
import { OverviewCard } from "./OverviewCard";

const MAX_ENTRIES = 8;

function entryLabel(
  entry: BuildLogEntry,
  stepTitleMap: Record<string, string>,
): string {
  const stepTitle = entry.step_id ? stepTitleMap[entry.step_id] : null;
  switch (entry.entry_type) {
    case "step_complete":
      return stepTitle
        ? `Completed "${stepTitle}"`
        : entry.body ?? `Step ${entry.step_number ?? ""} completed`;
    case "milestone":
      return entry.body ?? "Milestone reached";
    case "note":
      return stepTitle
        ? `Note on "${stepTitle}"`
        : entry.body ?? "Note added";
    case "photo":
      return stepTitle ? `Photo for "${stepTitle}"` : "Photo added";
    case "build_complete":
      return "Build complete";
    default:
      return entry.body ?? entry.entry_type;
  }
}

export function BuildLogCard() {
  const buildLog = useAppStore((s) => s.overviewBuildLog);
  const tracks = useAppStore((s) => s.tracks);
  const steps = useAppStore((s) => s.steps);
  const navigateToStep = useNavigateToStep();

  const trackColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const t of tracks) map[t.id] = t.color;
    return map;
  }, [tracks]);

  const stepTitleMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const s of steps) map[s.id] = s.title;
    return map;
  }, [steps]);

  // Group entries by day — depend on buildLog (stable ref), slice inside
  const grouped = useMemo(() => {
    const entries = buildLog.slice(0, MAX_ENTRIES);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const todayStr = today.toDateString();
    const yesterdayStr = yesterday.toDateString();

    const dayLabel = (ts: number) => {
      const dateStr = new Date(ts * 1000).toDateString();
      if (dateStr === todayStr) return "Today";
      if (dateStr === yesterdayStr) return "Yesterday";
      return new Date(ts * 1000).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
    };

    const groups: { label: string; entries: BuildLogEntry[] }[] = [];
    let currentLabel = "";
    for (const entry of entries) {
      const label = dayLabel(entry.created_at);
      if (label !== currentLabel) {
        groups.push({ label, entries: [entry] });
        currentLabel = label;
      } else {
        groups[groups.length - 1].entries.push(entry);
      }
    }
    return groups;
  }, [buildLog]);

  return (
    <OverviewCard
      title="Build Log"
      icon={ScrollText}
      subtitle={buildLog.length > 0 ? `${buildLog.length} entr${buildLog.length === 1 ? "y" : "ies"}` : undefined}
    >
      {grouped.length === 0 ? (
        <div className="flex h-full items-center justify-center py-3">
          <div className="flex flex-col items-center text-text-tertiary">
            <ScrollText className="mb-1 h-4 w-4 opacity-40" />
            <span className="text-[9px]">No activity yet</span>
            <span className="mt-0.5 text-[8px] opacity-60">
              Complete steps in Build mode to see history
            </span>
          </div>
        </div>
      ) : (
        <div className="space-y-1.5">
          {grouped.map((group) => (
            <div key={group.label}>
              <p className="mb-0.5 text-[8px] font-semibold uppercase tracking-wider text-text-tertiary">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.entries.map((entry) => {
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
                  const isClickable = !!entry.step_id;

                  return (
                    <div
                      key={entry.id}
                      className={`flex items-start gap-1.5 rounded px-1 py-0.5 ${
                        isClickable
                          ? "cursor-pointer hover:bg-muted"
                          : ""
                      }`}
                      onClick={() => entry.step_id && navigateToStep(entry.step_id)}
                    >
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
                        {entryLabel(entry, stepTitleMap)}
                      </span>
                      <span className="shrink-0 text-[8px] text-text-tertiary">
                        {relativeTime(entry.created_at)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </OverviewCard>
  );
}
