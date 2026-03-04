import { MoreHorizontal, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppStore } from "@/store";
import { StepCompletionMarker } from "./StepCompletionMarker";
import type { Step } from "@/shared/types";

interface StepItemProps {
  step: Step;
  isActive: boolean;
  onSelect: () => void;
  onToggleComplete: () => void;
  onDelete: () => void;
}

export function StepItem({
  step,
  isActive,
  onSelect,
  onToggleComplete,
  onDelete,
}: StepItemProps) {
  const currentSourcePages = useAppStore((s) => s.currentSourcePages);
  const pageIdx = step.source_page_id
    ? currentSourcePages.findIndex((p) => p.id === step.source_page_id)
    : -1;

  return (
    <button
      onClick={onSelect}
      className={`group flex w-full items-center gap-1.5 rounded px-1.5 py-1 text-left transition-colors ${
        isActive
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
      {pageIdx >= 0 && (
        <span className="shrink-0 text-[9px] text-text-tertiary">
          P{pageIdx + 1}
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
        <DropdownMenuContent align="end" className="w-32">
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
