import { Check, Grid3X3 } from "lucide-react";
import type { SprueRef, StepSpruePart } from "@/shared/types";
import { isPartFullyTicked, formatPartProgress } from "@/shared/utils";
import { SprueCropThumb } from "../SprueCropThumb";

export interface SpruePartsGridProps<P extends StepSpruePart> {
  /** Pre-grouped parts: [sprue label, parts in label] tuples in render order. */
  groups: Array<readonly [string, P[]]>;
  /** Lookup of sprue refs by label, for thumbnails and color. */
  refMap: Map<string, SprueRef>;
  /** Called when a part chip is clicked. */
  onTickPart: (part: P) => void;
  /** Called when a sprue thumbnail is clicked. If omitted, thumbnail is not clickable. */
  onThumbnailClick?: (label: string) => void;
}

/**
 * Card-style sprue parts grid used in both BuildingStepPanel (via PartChipEditor
 * in build mode) and PageInfoPanel. Each card shows a sprue label, its
 * thumbnail, and tickable part chips.
 */
export function SpruePartsGrid<P extends StepSpruePart>({
  groups,
  refMap,
  onTickPart,
  onThumbnailClick,
}: SpruePartsGridProps<P>) {
  return (
    <>
      {groups.map(([label, parts]) => {
        const ref = refMap.get(label);
        const color = ref?.color ?? "#888";
        const tickedTotal = parts.reduce((sum, p) => sum + Math.min(p.ticked_count, p.quantity), 0);
        const qtyTotal = parts.reduce((sum, p) => sum + p.quantity, 0);
        const allTicked = qtyTotal > 0 && tickedTotal === qtyTotal;

        return (
          <div
            key={label}
            className={`flex flex-col rounded border p-1.5 ${allTicked ? "border-success" : "border-border"}`}
            style={{ borderLeftWidth: 3, borderLeftColor: allTicked ? undefined : color }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-text-primary">
                Sprue {label}
              </span>
              <span className={`text-[9px] ${allTicked ? "text-success" : "text-text-tertiary"}`}>
                {tickedTotal}/{qtyTotal}
              </span>
            </div>
            <div className="mt-1 flex gap-2">
              {ref && (
                onThumbnailClick ? (
                  <button
                    onClick={() => onThumbnailClick(label)}
                    className="flex shrink-0 items-center justify-center overflow-hidden rounded bg-black/[0.03] hover:bg-black/[0.06]"
                    style={{ width: 72, minHeight: 50 }}
                  >
                    <SprueCropThumb
                      sprueRef={ref}
                      width={90}
                      height={70}
                      className="max-h-[70px]"
                      fallback={<Grid3X3 className="h-3.5 w-3.5 text-text-quaternary" />}
                    />
                  </button>
                ) : (
                  <div
                    className="flex shrink-0 items-center justify-center overflow-hidden rounded bg-black/[0.03]"
                    style={{ width: 72, minHeight: 50 }}
                  >
                    <SprueCropThumb
                      sprueRef={ref}
                      width={90}
                      height={70}
                      className="max-h-[70px]"
                      fallback={<Grid3X3 className="h-3.5 w-3.5 text-text-quaternary" />}
                    />
                  </div>
                )
              )}
              <div className="flex min-w-0 flex-1 flex-wrap content-start gap-1">
                {parts.map((part) => {
                  const chipLabel = `${label}${part.part_number ?? ""}`;
                  const fullyTicked = isPartFullyTicked(part);
                  const partial = part.ticked_count > 0 && !fullyTicked;
                  return (
                    <button
                      key={part.id}
                      onClick={() => onTickPart(part)}
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium transition-colors ${
                        fullyTicked
                          ? "bg-success/15 text-success"
                          : partial
                            ? "bg-warning/12 text-warning"
                            : "hover:opacity-80"
                      }`}
                      style={fullyTicked || partial ? undefined : {
                        backgroundColor: `${color}15`,
                        color,
                        border: `1px solid ${color}30`,
                      }}
                    >
                      {fullyTicked && (
                        <Check className="h-3 w-3" strokeWidth={3} />
                      )}
                      <span className={fullyTicked ? "line-through" : ""}>
                        {chipLabel}
                        {formatPartProgress(part)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}
