import type { Step } from "@/shared/types";
import { StepCompletionMarker } from "../StepCompletionMarker";
import { SectionLabel } from "./primitives";

export interface SubStepsListProps {
  subSteps: Step[];
  onToggle: (child: Step) => void;
  /**
   * "navigable" — full sub-step section with header + count, each row navigates
   * to the child when clicked (BuildingStepPanel).
   * "inline" — compact list nested inside an expanded parent row, no
   * navigation, smaller type (PageInfoPanel).
   */
  variant: "navigable" | "inline";
  /** Only used in navigable variant: highlights the row matching this id. */
  activeStepId?: string | null;
  /** Only used in navigable variant: called when a sub-step row is clicked. */
  onNavigate?: (childId: string) => void;
}

/**
 * Sub-steps list shared between BuildingStepPanel and PageInfoPanel. Both
 * render a list of children with completion markers, but the build panel
 * makes each row a navigation target while the page panel keeps it inline.
 */
export function SubStepsList({
  subSteps,
  onToggle,
  variant,
  activeStepId,
  onNavigate,
}: SubStepsListProps) {
  if (subSteps.length === 0) return null;
  const completed = subSteps.filter((c) => c.is_completed).length;

  if (variant === "inline") {
    return (
      <div className="space-y-0.5">
        <span className="text-[9px] font-semibold text-text-tertiary">
          Sub-steps ({completed}/{subSteps.length})
        </span>
        {subSteps.map((child) => (
          <div key={child.id} className="flex items-center gap-1.5 py-0.5">
            <StepCompletionMarker
              completed={child.is_completed}
              onClick={() => onToggle(child)}
            />
            <span
              className={`text-[10px] ${
                child.is_completed ? "text-text-tertiary line-through" : "text-text-primary"
              }`}
            >
              {child.title}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <SectionLabel>Sub-steps</SectionLabel>
        <span className="text-[10px] text-text-tertiary">
          {completed}/{subSteps.length}
        </span>
      </div>
      <div className="space-y-0.5">
        {subSteps.map((child) => (
          <button
            key={child.id}
            onClick={() => onNavigate?.(child.id)}
            className="flex w-full items-center gap-2 rounded px-1 py-1 text-left hover:bg-muted/50"
          >
            <StepCompletionMarker
              completed={child.is_completed}
              onClick={() => onToggle(child)}
            />
            <span
              className={`text-[11px] ${
                child.is_completed
                  ? "text-text-tertiary line-through"
                  : child.id === activeStepId
                    ? "font-medium text-accent"
                    : "text-text-primary"
              }`}
            >
              {child.title}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
