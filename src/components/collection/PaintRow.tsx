import { Check, Star } from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/store";
import * as api from "@/api";
import { cn } from "@/lib/utils";
import type { Paint } from "@/shared/types";
import { PAINT_TYPE_LABELS } from "@/shared/types";

interface PaintRowProps {
  paint: Paint;
}

const EMPTY_PROJECTS: { project_id: string; project_name: string }[] = [];

export function PaintRow({ paint }: PaintRowProps) {
  const selectedPaintId = useAppStore((s) => s.selectedPaintId);
  const setSelectedPaintId = useAppStore((s) => s.setSelectedPaintId);
  const updatePaintStore = useAppStore((s) => s.updatePaint);
  const paintProjects = useAppStore((s) => s.paintProjectMap[paint.id] ?? EMPTY_PROJECTS);
  const isSelected = selectedPaintId === paint.id;

  const handleStatusToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = paint.status === "owned" ? "wishlist" : "owned";
    try {
      const updated = await api.updatePaint({ id: paint.id, status: newStatus });
      updatePaintStore(updated);
    } catch (err) {
      toast.error(`Failed to update status: ${err}`);
    }
  };

  return (
    <button
      onClick={() => setSelectedPaintId(isSelected ? null : paint.id)}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors",
        isSelected
          ? "border border-accent/30 bg-accent/5"
          : "border border-transparent hover:bg-muted",
      )}
    >
      {/* Swatch */}
      <div
        className="h-[18px] w-[18px] flex-shrink-0 rounded-[3px] border border-border"
        style={{ backgroundColor: paint.color ?? "#ccc" }}
      />

      {/* Info */}
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span className="truncate text-[11px] font-medium">{paint.name}</span>
        {paint.reference_code && (
          <span className="flex-shrink-0 font-mono text-[9px] text-text-tertiary">
            {paint.reference_code}
          </span>
        )}
        <span className="flex-shrink-0 text-[9px] text-text-tertiary">
          {paint.brand}
        </span>
        <span className="flex-shrink-0 text-[8px] text-text-tertiary">
          {PAINT_TYPE_LABELS[paint.type] ?? paint.type}
        </span>
        {paint.status === "wishlist" && paint.price != null && (
          <span className="flex-shrink-0 font-mono text-[8px] text-text-tertiary">
            ${paint.price.toFixed(2)}
          </span>
        )}
      </div>

      {/* Project tags */}
      {paintProjects.length > 0 && (
        <div className="flex flex-shrink-0 items-center gap-0.5">
          {paintProjects.slice(0, 2).map((pp) => (
            <span
              key={pp.project_id}
              className="rounded-full bg-accent/10 px-1.5 text-[8px] text-accent"
            >
              {pp.project_name}
            </span>
          ))}
          {paintProjects.length > 2 && (
            <span className="text-[8px] text-text-tertiary">
              +{paintProjects.length - 2}
            </span>
          )}
        </div>
      )}

      {/* Status toggle */}
      <button
        onClick={handleStatusToggle}
        className="flex-shrink-0 p-0.5"
        title={paint.status === "owned" ? "Mark as wishlist" : "Mark as owned"}
      >
        {paint.status === "owned" ? (
          <Check className="h-3 w-3 text-status-completed" />
        ) : (
          <Star className="h-2 w-2 fill-warning text-warning" />
        )}
      </button>
    </button>
  );
}
