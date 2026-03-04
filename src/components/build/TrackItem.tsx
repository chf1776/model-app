import { MoreHorizontal, Pencil, Palette, Trash2, Plus } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SortableStepItem } from "./StepItem";
import type { Track, Step } from "@/shared/types";

interface TrackItemProps {
  track: Track;
  isActive: boolean;
  onSelect: () => void;
  onRename: () => void;
  onChangeColor: () => void;
  onDelete: () => void;
  steps: Step[];
  activeStepId: string | null;
  selectedStepIds?: string[];
  pageIndexMap: Map<string, number>;
  onSelectStep: (id: string) => void;
  onToggleStepSelect?: (id: string) => void;
  onAddStep: () => void;
  onDeleteStep: (id: string) => void;
  onToggleStepComplete: (step: Step) => void;
  onReorderSteps?: (trackId: string, orderedIds: string[]) => void;
}

export function TrackItem({
  track,
  isActive,
  onSelect,
  onRename,
  onChangeColor,
  onDelete,
  steps,
  activeStepId,
  selectedStepIds = [],
  pageIndexMap,
  onSelectStep,
  onToggleStepSelect,
  onAddStep,
  onDeleteStep,
  onToggleStepComplete,
  onReorderSteps,
}: TrackItemProps) {
  const progress =
    track.step_count > 0
      ? (track.completed_count / track.step_count) * 100
      : 0;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  );

  const stepIds = steps.map((s) => s.id);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !onReorderSteps) return;

    const oldIndex = stepIds.indexOf(active.id as string);
    const newIndex = stepIds.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = arrayMove(stepIds, oldIndex, newIndex);
    onReorderSteps(track.id, newOrder);
  };

  return (
    <div>
      <button
        onClick={onSelect}
        className={`group flex w-full items-start gap-2 border-l-[4px] px-2.5 py-2 text-left transition-colors ${
          isActive
            ? "bg-[#4E728214]"
            : "hover:bg-[#4E72820A]"
        }`}
        style={{ borderLeftColor: track.color }}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <span className="truncate text-xs font-medium text-text-primary">
              {track.name}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger
                onClick={(e) => e.stopPropagation()}
                className="flex h-4 w-4 shrink-0 items-center justify-center rounded opacity-0 hover:bg-black/5 group-hover:opacity-100"
              >
                <MoreHorizontal className="h-3 w-3 text-text-tertiary" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36">
                <DropdownMenuItem onClick={onRename} className="text-xs">
                  <Pencil className="mr-2 h-3 w-3" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onChangeColor} className="text-xs">
                  <Palette className="mr-2 h-3 w-3" />
                  Change Color
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={onDelete}
                  className="text-xs text-red-600 focus:text-red-600"
                >
                  <Trash2 className="mr-2 h-3 w-3" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="mt-0.5 flex items-center gap-2">
            <span className="text-[10px] text-text-tertiary">
              {track.step_count} {track.step_count === 1 ? "step" : "steps"}
            </span>
            {track.step_count > 0 && (
              <div className="h-[3px] w-10 overflow-hidden rounded-full bg-black/5">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${progress}%`,
                    backgroundColor: track.color,
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </button>

      {/* Step list (shown when track is active) */}
      {isActive && (
        <div className="border-l-[4px] bg-[#4E728208] px-2 pb-1.5" style={{ borderLeftColor: track.color }}>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={stepIds} strategy={verticalListSortingStrategy}>
              <div className="space-y-0.5">
                {steps.map((step) => (
                  <SortableStepItem
                    key={step.id}
                    id={step.id}
                    step={step}
                    isActive={step.id === activeStepId}
                    isSelected={selectedStepIds.includes(step.id)}
                    pageIndex={step.source_page_id ? (pageIndexMap.get(step.source_page_id) ?? -1) : -1}
                    onSelect={() => onSelectStep(step.id)}
                    onToggleSelect={onToggleStepSelect ? () => onToggleStepSelect(step.id) : undefined}
                    onToggleComplete={() => onToggleStepComplete(step)}
                    onDelete={() => onDeleteStep(step.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddStep();
            }}
            className="mt-1 flex w-full items-center gap-1 rounded px-1.5 py-1 text-[10px] text-text-tertiary hover:bg-black/[0.03] hover:text-text-secondary"
          >
            <Plus className="h-3 w-3" />
            Add step
          </button>
        </div>
      )}
    </div>
  );
}
