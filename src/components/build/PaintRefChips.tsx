import { useState, useMemo, useCallback } from "react";
import { Plus, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { PaletteEntry } from "@/shared/types";
import { useAppStore } from "@/store";

interface PaintRefChipsProps {
  stepId: string;
  /** Show "+ paint" label on the add trigger (setup mode), or just "+" (building mode) */
  showLabel?: boolean;
}

export function PaintRefChips({ stepId, showLabel = false }: PaintRefChipsProps) {
  const stepPaintRefs = useAppStore((s) => s.stepPaintRefs);
  const setStepPaintRefsAction = useAppStore((s) => s.setStepPaintRefs);
  const projectPaletteEntries = useAppStore((s) => s.projectPaletteEntries);
  const [open, setOpen] = useState(false);

  const currentIds = stepPaintRefs[stepId] ?? [];
  const currentIdSet = useMemo(() => new Set(currentIds), [currentIds]);

  const currentEntries = useMemo(
    () => projectPaletteEntries.filter((e) => currentIdSet.has(e.id)),
    [projectPaletteEntries, currentIdSet],
  );

  const handleToggle = useCallback(
    async (entryId: string) => {
      const next = currentIdSet.has(entryId)
        ? currentIds.filter((id) => id !== entryId)
        : [...currentIds, entryId];
      await setStepPaintRefsAction(stepId, next);
    },
    [stepId, currentIds, currentIdSet, setStepPaintRefsAction],
  );

  if (projectPaletteEntries.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1">
      {currentEntries.map((entry) => (
        <button
          key={entry.id}
          onClick={() => handleToggle(entry.id)}
          className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent hover:bg-accent/20"
        >
          <ColorDot entry={entry} />
          {entry.name}
          <X className="h-2.5 w-2.5" />
        </button>
      ))}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button className="inline-flex items-center gap-0.5 rounded-full border border-dashed border-border px-1.5 py-0.5 text-[10px] text-text-tertiary hover:border-text-secondary hover:text-text-secondary">
            <Plus className="h-2.5 w-2.5" />
            {showLabel && "paint"}
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-48 p-1.5">
          <div className="space-y-0.5">
            {projectPaletteEntries.map((entry) => {
              const isActive = currentIdSet.has(entry.id);
              return (
                <button
                  key={entry.id}
                  onClick={() => handleToggle(entry.id)}
                  className={`flex w-full items-center gap-1.5 rounded px-2 py-1 text-[11px] ${
                    isActive
                      ? "bg-accent/10 font-medium text-accent"
                      : "text-text-secondary hover:bg-black/[0.03]"
                  }`}
                >
                  <ColorDot entry={entry} border />
                  {entry.name}
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function ColorDot({ entry, border }: { entry: PaletteEntry; border?: boolean }) {
  if (entry.paint_color) {
    return (
      <span
        className={`h-2.5 w-2.5 shrink-0 rounded-full ${border ? "border border-border" : "border border-accent/30"}`}
        style={{ backgroundColor: entry.paint_color }}
      />
    );
  }
  if (entry.is_formula) {
    return <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-accent/40" />;
  }
  return <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-text-tertiary/30" />;
}
