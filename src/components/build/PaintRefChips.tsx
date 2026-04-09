import { useState, useMemo, useCallback } from "react";
import { Plus, X, FlaskConical } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getSwatchStyle } from "@/lib/utils";
import { useAppStore } from "@/store";

interface PaintRefChipsProps {
  stepId: string;
  /** Show "+ paint" label on the add trigger (setup mode), or just "+" (building mode) */
  showLabel?: boolean;
}

export function PaintRefChips({ stepId, showLabel = false }: PaintRefChipsProps) {
  const stepContexts = useAppStore((s) => s.stepContexts);
  const setStepPaintRefsAction = useAppStore((s) => s.setStepPaintRefs);
  const projectPaletteEntries = useAppStore((s) => s.projectPaletteEntries);
  const [open, setOpen] = useState(false);

  const currentIds = stepContexts[stepId]?.paint_refs ?? [];
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
    <div className="flex flex-wrap items-center gap-1.5">
      {currentEntries.map((entry) => (
        <div key={entry.id} className="group/swatch relative text-center">
          <button
            onClick={() => handleToggle(entry.id)}
            className="block h-7 w-7 rounded border border-black/10 transition-shadow hover:shadow-md"
            style={getSwatchStyle(entry)}
            title={entry.name}
          >
            {!entry.paint_color && entry.is_formula && (
              <FlaskConical className="mx-auto h-3 w-3 text-white/70" />
            )}
          </button>
          <span className="pointer-events-none absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-accent text-white opacity-0 transition-opacity group-hover/swatch:opacity-100">
            <X className="h-2 w-2" />
          </span>
          <p className="mt-0.5 max-w-[32px] truncate text-[7px] leading-tight text-text-tertiary">
            {entry.name}
          </p>
        </div>
      ))}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            className="flex h-7 w-7 items-center justify-center rounded border border-dashed border-border text-text-tertiary hover:border-text-secondary hover:text-text-secondary"
            title={showLabel ? "Add paint" : undefined}
          >
            <Plus className="h-3.5 w-3.5" />
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
                  <span
                    className="h-3.5 w-3.5 shrink-0 rounded-sm border border-border"
                    style={getSwatchStyle(entry)}
                  />
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
