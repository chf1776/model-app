import { MoreHorizontal, Trash2, ListTree } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StepCompletionMarker } from "./StepCompletionMarker";
import type { Step } from "@/shared/types";

interface StepItemProps {
  step: Step;
  isActive: boolean;
  isSelected: boolean;
  pageIndex: number;
  depth?: number;
  onClick?: (e: React.MouseEvent) => void;
  onToggleComplete: () => void;
  onDelete: () => void;
  onAddSubStep?: () => void;
}

export function StepItem({
  step,
  isActive,
  isSelected,
  pageIndex,
  depth = 0,
  onClick,
  onToggleComplete,
  onDelete,
  onAddSubStep,
}: StepItemProps) {
  return (
    <button
      onClick={onClick}
      className={`group flex w-full items-center gap-1.5 rounded px-1.5 py-1 text-left transition-colors ${depth === 1 ? "pl-5 " : ""}${
        isActive && isSelected
          ? "border border-accent/40 bg-accent/10"
          : isSelected
            ? "border border-accent/40 bg-accent/5"
            : isActive
              ? "border border-border bg-white"
              : "border border-transparent hover:bg-black/[0.03]"
      }`}
    >
      <StepCompletionMarker
        completed={step.is_completed}
        onClick={onToggleComplete}
      />
      <span
        className={`min-w-0 flex-1 truncate text-[11px] ${
          step.is_completed
            ? "text-text-tertiary line-through"
            : "text-text-primary"
        }`}
      >
        {step.title}
      </span>
      {pageIndex >= 0 && (
        <span className="shrink-0 text-[9px] text-text-tertiary">
          P{pageIndex + 1}
        </span>
      )}
      {step.pre_paint && (
        <span className="shrink-0 rounded px-1 py-0.5 text-[9px] font-medium text-[#C4913A] bg-[#C4913A]/10">
          Pre-paint
        </span>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger
          onClick={(e) => e.stopPropagation()}
          className="flex h-4 w-4 shrink-0 items-center justify-center rounded opacity-0 hover:bg-black/5 group-hover:opacity-100"
        >
          <MoreHorizontal className="h-3 w-3 text-text-tertiary" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-36">
          {depth === 0 && onAddSubStep && (
            <DropdownMenuItem onClick={onAddSubStep} className="text-xs">
              <ListTree className="mr-2 h-3 w-3" />
              Add sub-step
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onClick={onDelete}
            className="text-xs text-red-600 focus:text-red-600"
          >
            <Trash2 className="mr-2 h-3 w-3" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </button>
  );
}

interface SortableStepItemProps extends StepItemProps {
  id: string;
  isGhostDuringDrag?: boolean;
}

export function SortableStepItem({ id, isGhostDuringDrag, ...props }: SortableStepItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    ...(isDragging ? { opacity: 0.4 } : {}),
    ...(isGhostDuringDrag ? { opacity: 0.25 } : {}),
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <StepItem {...props} />
    </div>
  );
}
