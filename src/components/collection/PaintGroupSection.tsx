import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Paint, PaintViewMode } from "@/shared/types";
import { PaintRow } from "./PaintRow";
import { PaintSwatchCard } from "./PaintSwatchCard";

interface PaintGroupSectionProps {
  label: string;
  paints: Paint[];
  defaultExpanded: boolean;
  viewMode: PaintViewMode;
}

export function PaintGroupSection({
  label,
  paints,
  defaultExpanded,
  viewMode,
}: PaintGroupSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  if (paints.length === 0) return null;

  return (
    <div className="mt-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-1.5 py-1.5"
      >
        <ChevronRight
          className={cn(
            "h-2.5 w-2.5 text-text-tertiary transition-transform",
            expanded && "rotate-90",
          )}
        />
        <span className="text-xs font-semibold text-text-primary">
          {label}
        </span>
        <span className="text-[10px] text-text-tertiary">{paints.length}</span>
        <div className="ml-1 h-px flex-1 bg-border" />

        {/* Collapsed mini swatches */}
        {!expanded && (
          <div className="flex items-center gap-0.5">
            {paints.slice(0, 5).map((p) => (
              <div
                key={p.id}
                className="h-2.5 w-2.5 rounded-sm border border-border"
                style={{ backgroundColor: p.color ?? "#ccc" }}
              />
            ))}
            {paints.length > 5 && (
              <span className="text-[8px] text-text-tertiary">
                +{paints.length - 5}
              </span>
            )}
          </div>
        )}
      </button>

      {expanded && (
        viewMode === "list" ? (
          <div className="flex flex-col gap-0.5 px-4 py-1">
            {paints.map((p) => (
              <PaintRow key={p.id} paint={p} />
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5 px-4 py-1">
            {paints.map((p) => (
              <PaintSwatchCard key={p.id} paint={p} />
            ))}
          </div>
        )
      )}
    </div>
  );
}
