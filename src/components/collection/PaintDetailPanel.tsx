import { useState, useEffect, useCallback } from "react";
import { X, Check, Star, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/store";
import * as api from "@/api";
import { Button } from "@/components/ui/button";
import type { Paint } from "@/shared/types";
import {
  PAINT_TYPE_LABELS,
  PAINT_FINISH_LABELS,
  COLOR_FAMILY_LABELS,
} from "@/shared/types";

interface PaintDetailPanelProps {
  paint: Paint;
  onEdit: (paint: Paint) => void;
}

export function PaintDetailPanel({ paint, onEdit }: PaintDetailPanelProps) {
  const setSelectedPaintId = useAppStore((s) => s.setSelectedPaintId);
  const updatePaintStore = useAppStore((s) => s.updatePaint);
  const paintProjectMap = useAppStore((s) => s.paintProjectMap);
  const paintProjects = paintProjectMap[paint.id] ?? [];
  const [notes, setNotes] = useState(paint.notes ?? "");

  useEffect(() => {
    setNotes(paint.notes ?? "");
  }, [paint.id, paint.notes]);

  const handleNotesBlur = useCallback(async () => {
    const trimmed = notes.trim() || null;
    if (trimmed === paint.notes) return;
    try {
      const updated = await api.updatePaint({ id: paint.id, notes: trimmed });
      updatePaintStore(updated);
    } catch (err) {
      toast.error(`Failed to save notes: ${err}`);
    }
  }, [notes, paint.id, paint.notes, updatePaintStore]);

  const handleStatusToggle = async () => {
    const newStatus = paint.status === "owned" ? "wishlist" : "owned";
    try {
      const updated = await api.updatePaint({ id: paint.id, status: newStatus });
      updatePaintStore(updated);
    } catch (err) {
      toast.error(`Failed to update status: ${err}`);
    }
  };

  return (
    <div className="flex w-[200px] flex-shrink-0 flex-col border-l border-border bg-card">
      {/* Close button */}
      <div className="flex justify-end p-1.5">
        <button
          onClick={() => setSelectedPaintId(null)}
          className="rounded p-0.5 text-text-tertiary hover:bg-muted hover:text-text-secondary"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Large swatch */}
      <div
        className="mx-3 h-[60px] rounded-md border border-border"
        style={{ backgroundColor: paint.color ?? "#ccc" }}
      />

      <div className="flex flex-col gap-2 px-3 py-2">
        {/* Name */}
        <p className="text-sm font-bold leading-tight">{paint.name}</p>

        {/* Brand + code */}
        <p className="text-[11px] text-text-tertiary">
          {paint.brand}
          {paint.reference_code && (
            <span className="ml-1.5 font-mono">{paint.reference_code}</span>
          )}
        </p>

        {/* Type + finish */}
        <p className="text-[9px] text-text-tertiary">
          {PAINT_TYPE_LABELS[paint.type] ?? paint.type}
          {paint.finish && ` · ${PAINT_FINISH_LABELS[paint.finish] ?? paint.finish}`}
        </p>

        {/* Status toggle */}
        <button
          onClick={handleStatusToggle}
          className="flex items-center gap-1.5 self-start rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors"
          style={{
            backgroundColor:
              paint.status === "owned"
                ? "var(--color-status-completed)"
                : "var(--color-status-wishlist)",
            color: "white",
          }}
        >
          {paint.status === "owned" ? (
            <>
              <Check className="h-2.5 w-2.5" />
              Owned
            </>
          ) : (
            <>
              <Star className="h-2.5 w-2.5" />
              Wishlist
            </>
          )}
        </button>

        {/* Hex display */}
        {paint.color && (
          <div className="flex items-center gap-1.5">
            <div
              className="h-3 w-3 rounded-sm border border-border"
              style={{ backgroundColor: paint.color }}
            />
            <span className="font-mono text-[10px] text-text-tertiary">
              {paint.color}
            </span>
          </div>
        )}

        {/* Color family */}
        {paint.color_family && (
          <p className="text-[9px] text-text-tertiary">
            {COLOR_FAMILY_LABELS[paint.color_family] ?? paint.color_family}
          </p>
        )}

        {/* Projects */}
        <div className="flex flex-col gap-0.5">
          <label className="text-[9px] font-medium text-text-tertiary">
            Projects
          </label>
          {paintProjects.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {paintProjects.map((pp) => (
                <span
                  key={pp.project_id}
                  className="rounded-full bg-accent/10 px-1.5 py-0.5 text-[9px] text-accent"
                >
                  {pp.project_name}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-[9px] italic text-text-tertiary">None</p>
          )}
        </div>

        {/* Notes */}
        <div className="flex flex-col gap-0.5">
          <label className="text-[9px] font-medium text-text-tertiary">
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={handleNotesBlur}
            rows={3}
            placeholder="Add notes..."
            className="rounded-md border border-border bg-background px-2 py-1 text-[10px] focus:border-accent focus:outline-none"
          />
        </div>

        {/* Edit button */}
        <Button
          size="sm"
          variant="outline"
          className="mt-1 h-7 gap-1.5 text-[10px]"
          onClick={() => onEdit(paint)}
        >
          <Pencil className="h-3 w-3" />
          Edit
        </Button>
      </div>
    </div>
  );
}
