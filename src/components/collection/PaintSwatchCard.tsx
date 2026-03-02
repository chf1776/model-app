import { useAppStore } from "@/store";
import { cn } from "@/lib/utils";
import type { Paint } from "@/shared/types";

interface PaintSwatchCardProps {
  paint: Paint;
}

export function PaintSwatchCard({ paint }: PaintSwatchCardProps) {
  const selectedPaintId = useAppStore((s) => s.selectedPaintId);
  const setSelectedPaintId = useAppStore((s) => s.setSelectedPaintId);
  const isSelected = selectedPaintId === paint.id;

  return (
    <button
      onClick={() => setSelectedPaintId(isSelected ? null : paint.id)}
      className={cn(
        "flex w-16 flex-col overflow-hidden rounded-md transition-colors",
        isSelected
          ? "ring-1.5 ring-accent"
          : "ring-1 ring-border hover:ring-accent/40",
      )}
    >
      {/* Color block */}
      <div className="relative h-9 w-full">
        <div
          className="h-full w-full rounded-t-[3px]"
          style={{ backgroundColor: paint.color ?? "#ccc" }}
        />
        {paint.status === "wishlist" && (
          <div className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-warning" />
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col px-1 py-0.5">
        <span className="truncate text-[8px] font-medium">{paint.name}</span>
        {paint.reference_code && (
          <span className="truncate font-mono text-[7px] text-text-tertiary">
            {paint.reference_code}
          </span>
        )}
      </div>
    </button>
  );
}
