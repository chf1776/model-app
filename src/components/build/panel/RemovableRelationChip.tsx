import { X } from "lucide-react";

export interface RemovableRelationChipProps {
  /** Display title — falls back to a short id if missing. */
  title: string;
  /** Track color dot, omitted if undefined. */
  trackColor?: string | null;
  /** Background and text classes, e.g. "bg-red-500/10 text-red-700". */
  toneClass: string;
  /** Hover class for the remove button, e.g. "hover:text-red-900". */
  hoverClass: string;
  onNavigate: () => void;
  onRemove: () => void;
}

/**
 * Pill chip rendered in StepEditorPanel relations rows: a clickable
 * title (navigates to the related step) plus an X to remove the
 * relation. Used by blocked_by, blocks, blocks_access_to, replaces,
 * and replaced_by rows.
 */
export function RemovableRelationChip({
  title,
  trackColor,
  toneClass,
  hoverClass,
  onNavigate,
  onRemove,
}: RemovableRelationChipProps) {
  return (
    <span className={`inline-flex items-center rounded-full text-[10px] font-medium ${toneClass}`}>
      <button
        onClick={onNavigate}
        className="inline-flex items-center gap-0.5 pl-2 py-0.5 hover:underline"
      >
        {trackColor && (
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: trackColor }} />
        )}
        {title}
      </button>
      <button onClick={onRemove} className={`pl-0.5 pr-1.5 py-0.5 ${hoverClass}`}>
        <X className="h-2.5 w-2.5" />
      </button>
    </span>
  );
}
