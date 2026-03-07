import { Package } from "lucide-react";
import { useAppStore } from "@/store";
import { ACCESSORY_TYPE_LABELS, ACCESSORY_TYPE_COLORS } from "@/shared/types";
import type { AccessoryType } from "@/shared/types";
import { OverviewCard } from "./OverviewCard";

const MAX_ACCESSORIES = 4;
const MAX_PAINTS = 6;

export function MaterialsCard() {
  const accessories = useAppStore((s) => s.overviewAccessories);
  const paints = useAppStore((s) => s.overviewPaints);

  const accCount = accessories.length;
  const paintCount = paints.length;
  const empty = accCount === 0 && paintCount === 0;

  return (
    <OverviewCard title="Materials" icon={Package}>
      {empty ? (
        <div className="flex h-full items-center justify-center py-3">
          <div className="flex flex-col items-center text-text-tertiary">
            <Package className="mb-1 h-4 w-4 opacity-40" />
            <span className="text-[9px]">No materials linked</span>
            <span className="mt-0.5 text-[8px] opacity-60">
              Link accessories and paints in Collection
            </span>
          </div>
        </div>
      ) : (
        <div className="space-y-1.5">
          {accCount > 0 && (
            <div>
              <p className="text-[9px] font-medium text-text-secondary">
                {accCount} accessor{accCount === 1 ? "y" : "ies"}
              </p>
              <div className="mt-0.5 flex flex-wrap gap-1">
                {accessories.slice(0, MAX_ACCESSORIES).map((a) => (
                  <span
                    key={a.id}
                    className="rounded px-1 py-0.5 text-[8px] font-medium text-white"
                    style={{
                      backgroundColor:
                        ACCESSORY_TYPE_COLORS[a.type as AccessoryType] ??
                        "#78716C",
                    }}
                  >
                    {ACCESSORY_TYPE_LABELS[a.type as AccessoryType] ?? a.type}
                  </span>
                ))}
                {accCount > MAX_ACCESSORIES && (
                  <span className="text-[8px] text-text-tertiary">
                    +{accCount - MAX_ACCESSORIES} more
                  </span>
                )}
              </div>
            </div>
          )}
          {paintCount > 0 && (
            <div>
              <p className="text-[9px] font-medium text-text-secondary">
                {paintCount} paint{paintCount === 1 ? "" : "s"}
              </p>
              <div className="mt-0.5 flex flex-wrap gap-1">
                {paints.slice(0, MAX_PAINTS).map((p) => (
                  <span key={p.id} className="flex items-center gap-0.5">
                    {p.color && (
                      <span
                        className="inline-block h-2 w-2 rounded-full border border-border"
                        style={{ backgroundColor: p.color }}
                      />
                    )}
                    <span className="text-[8px] text-text-secondary">
                      {p.name}
                    </span>
                  </span>
                ))}
                {paintCount > MAX_PAINTS && (
                  <span className="text-[8px] text-text-tertiary">
                    +{paintCount - MAX_PAINTS} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </OverviewCard>
  );
}
