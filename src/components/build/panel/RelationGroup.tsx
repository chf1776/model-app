import type { Step } from "@/shared/types";

export interface RelationGroupProps {
  label: string;
  ids: string[];
  steps: Step[];
  tracks: { id: string; color: string }[];
  chipClass: string;
  onNavigate: (id: string) => void;
}

/**
 * Navigable relation pills used in BuildingStepPanel. Each id renders as a
 * button that activates the related step on click.
 */
export function RelationGroup({
  label,
  ids,
  steps,
  tracks,
  chipClass,
  onNavigate,
}: RelationGroupProps) {
  return (
    <div className="space-y-0.5">
      <span className="text-[9px] text-text-tertiary">{label}</span>
      <div className="flex flex-wrap gap-1">
        {ids.map((id) => {
          const s = steps.find((st) => st.id === id);
          const t = s ? tracks.find((tr) => tr.id === s.track_id) : null;
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium hover:opacity-80 ${chipClass}`}
            >
              {t && (
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: t.color }}
                />
              )}
              {s?.title ?? id.slice(0, 6)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
