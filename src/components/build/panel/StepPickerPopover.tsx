import { Plus, Search } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Step, Track } from "@/shared/types";

export interface StepPickerPopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  search: string;
  onSearchChange: (value: string) => void;
  tracks: Track[];
  stepsByTrack: Map<string, Step[]>;
  onSelect: (stepId: string) => void;
  /** Returns true to highlight a row as already-selected. */
  isSelected?: (stepId: string) => boolean;
  /** Tailwind classes applied to a selected row (when isSelected returns true). */
  selectedClass?: string;
}

/**
 * Searchable popover for picking a step grouped by track. Used by the
 * relations rows and the "Replaces" row in StepEditorPanel.
 */
export function StepPickerPopover({
  open,
  onOpenChange,
  search,
  onSearchChange,
  tracks,
  stepsByTrack,
  onSelect,
  isSelected,
  selectedClass = "",
}: StepPickerPopoverProps) {
  const q = search.toLowerCase();

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button className="inline-flex items-center rounded-full border border-dashed border-border px-1.5 py-0.5 text-[10px] text-text-tertiary hover:border-text-secondary hover:text-text-secondary">
          <Plus className="h-2.5 w-2.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-52 p-1.5">
        <div className="mb-1 flex items-center gap-1 rounded border border-border px-1.5 py-1">
          <Search className="h-3 w-3 text-text-tertiary" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search steps or tracks..."
            className="flex-1 bg-transparent text-[11px] outline-none"
          />
        </div>
        <div className="max-h-[240px] overflow-y-auto">
          {tracks.map((t) => {
            const trackMatch = q && t.name.toLowerCase().includes(q);
            const trackSteps = (stepsByTrack.get(t.id) ?? []).filter(
              (s) => !q || trackMatch || s.title.toLowerCase().includes(q),
            );
            if (trackSteps.length === 0) return null;
            return (
              <div key={t.id} className="mb-1">
                <div className="flex items-center gap-1 px-1 py-0.5 text-[9px] font-semibold text-text-tertiary">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: t.color }} />
                  {t.name}
                </div>
                {trackSteps.map((s) => {
                  const selected = isSelected?.(s.id) ?? false;
                  return (
                    <button
                      key={s.id}
                      onClick={() => onSelect(s.id)}
                      className={`flex w-full items-center rounded px-2 py-1 text-[11px] ${
                        selected ? selectedClass : "text-text-secondary hover:bg-black/[0.03]"
                      }`}
                    >
                      {s.title}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
