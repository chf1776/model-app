import type { Step } from "@/shared/types";

export interface InlineRelationPillsProps {
  /** Human-readable prefix shown inside each pill, e.g. "Blocked by". */
  label: string;
  ids: string[];
  steps: Step[];
  /** Tone applied to background and text — destructive for blockers, warning for blocked. */
  tone: "destructive" | "warning";
}

/**
 * Compact inline relation pills used in PageInfoPanel's expanded step row.
 * Non-navigating, with the label baked into each pill ("Blocked by: title").
 */
export function InlineRelationPills({
  label,
  ids,
  steps,
  tone,
}: InlineRelationPillsProps) {
  if (ids.length === 0) return null;
  const className =
    tone === "destructive"
      ? "rounded bg-destructive/10 px-1.5 py-0.5 text-[9px] text-destructive"
      : "rounded bg-warning/10 px-1.5 py-0.5 text-[9px] text-warning";

  return (
    <div className="flex flex-wrap gap-1">
      {ids.map((id) => (
        <span key={id} className={className}>
          {label}: {steps.find((s) => s.id === id)?.title ?? "?"}
        </span>
      ))}
    </div>
  );
}
