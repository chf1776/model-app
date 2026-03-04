import { useMemo } from "react";
import { MoreHorizontal, Pencil, Palette, Trash2, Plus } from "lucide-react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SortableStepItem } from "./StepItem";
import { DropIndicatorLine } from "./DropIndicatorLine";
import { DROPPABLE_TRACK_PREFIX } from "./dnd-constants";
import { flattenSteps, getProjection, type Projection } from "./tree-utils";
import type { Track, Step } from "@/shared/types";

interface TrackItemProps {
  track: Track;
  isActive: boolean;
  isExpanded: boolean;
  isDropTarget: boolean;
  isMultiDragging: boolean;
  offsetLeft: number;
  overElementId: string | null;
  onToggleExpand: (e: React.MouseEvent) => void;
  onRename: () => void;
  onChangeColor: () => void;
  onDelete: () => void;
  steps: Step[];
  activeStepId: string | null;
  selectedStepIds?: string[];
  activeDragId: string | null;
  pageIndexMap: Map<string, number>;
  onStepClick: (id: string, e: React.MouseEvent) => void;
  onAddStep: () => void;
  onAddSubStep: (parentStepId: string) => void;
  onDeleteStep: (id: string) => void;
  onToggleStepComplete: (step: Step) => void;
}

export function TrackItem({
  track,
  isActive,
  isExpanded,
  isDropTarget,
  isMultiDragging,
  offsetLeft,
  overElementId,
  steps,
  activeStepId,
  selectedStepIds = [],
  activeDragId,
  pageIndexMap,
  onToggleExpand,
  onRename,
  onChangeColor,
  onDelete,
  onStepClick,
  onAddStep,
  onAddSubStep,
  onDeleteStep,
  onToggleStepComplete,
}: TrackItemProps) {
  const progress =
    track.step_count > 0
      ? (track.completed_count / track.step_count) * 100
      : 0;

  const { setNodeRef } = useDroppable({
    id: `${DROPPABLE_TRACK_PREFIX}${track.id}`,
    disabled: !isExpanded,
  });

  // Build step lookup
  const stepsById = useMemo(() => {
    const map = new Map<string, Step>();
    for (const s of steps) map.set(s.id, s);
    return map;
  }, [steps]);

  // Is the active drag in this track?
  const isDragInThisTrack =
    activeDragId !== null && stepsById.has(activeDragId);

  // Flatten steps for SortableContext and projection
  const flat = useMemo(
    () => flattenSteps(steps, activeDragId),
    [steps, activeDragId],
  );
  const flatIds = useMemo(() => flat.map((f) => f.id), [flat]);

  // Compute projection when a single step is being dragged within this track
  const projection: Projection | null = useMemo(() => {
    if (
      !activeDragId ||
      !isDragInThisTrack ||
      isMultiDragging ||
      !overElementId
    ) {
      return null;
    }
    // Only compute if the over element is in this track's flat list
    if (!flatIds.includes(overElementId)) return null;
    return getProjection(flat, activeDragId, overElementId, offsetLeft);
  }, [activeDragId, isDragInThisTrack, isMultiDragging, overElementId, flat, flatIds, offsetLeft]);

  return (
    <div>
      <button
        onClick={(e) => onToggleExpand(e)}
        className={`group flex w-full items-start gap-2 border-l-[4px] px-2.5 py-2 text-left transition-colors ${
          isActive
            ? "bg-[#4E728214]"
            : isExpanded
              ? "bg-[#4E72820A]"
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

      {/* Step list (shown when track is expanded) */}
      {isExpanded && (
        <div
          ref={setNodeRef}
          className={`border-l-[4px] px-2 pb-1.5 transition-colors ${
            isDropTarget
              ? "bg-accent/10"
              : "bg-[#4E728208]"
          }`}
          style={{ borderLeftColor: track.color }}
        >
          <SortableContext items={flatIds} strategy={verticalListSortingStrategy}>
            <div className="space-y-0.5">
              {steps.length === 0 ? (
                <p className="py-2 text-center text-[10px] text-text-tertiary">
                  Drop steps here
                </p>
              ) : (
                flat.map((flatItem) => {
                  const step = stepsById.get(flatItem.id);
                  if (!step) return null;

                  const isThisSelected = selectedStepIds.includes(step.id);
                  const isGhost =
                    isMultiDragging && isThisSelected && step.id !== activeDragId;
                  const isBeingDragged = step.id === activeDragId;

                  // Use projected depth for the item being dragged
                  const projectedDepth =
                    isBeingDragged && projection ? projection.depth : undefined;

                  return (
                    <div key={step.id}>
                      <SortableStepItem
                        id={step.id}
                        step={step}
                        isActive={step.id === activeStepId}
                        isSelected={isThisSelected}
                        isGhostDuringDrag={isGhost}
                        depth={flatItem.depth}
                        projectedDepth={projectedDepth}
                        pageIndex={
                          step.source_page_id
                            ? (pageIndexMap.get(step.source_page_id) ?? -1)
                            : -1
                        }
                        onClick={(e) => onStepClick(step.id, e)}
                        onToggleComplete={() => onToggleStepComplete(step)}
                        onDelete={() => onDeleteStep(step.id)}
                        onAddSubStep={
                          flatItem.depth === 0
                            ? () => onAddSubStep(step.id)
                            : undefined
                        }
                      />
                      {/* Drop indicator line after the over element */}
                      {overElementId === step.id &&
                        !isBeingDragged &&
                        projection && (
                          <DropIndicatorLine depth={projection.depth} />
                        )}
                    </div>
                  );
                })
              )}
            </div>
          </SortableContext>
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
