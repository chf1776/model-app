import { useState, useMemo, useCallback } from "react";
import { Plus, Route, ChevronsDownUp, ChevronsUpDown } from "lucide-react";
import { toast } from "sonner";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
  type DragMoveEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { useAppStore } from "@/store";
import * as api from "@/api";
import type { Step, Track } from "@/shared/types";
import { TrackItem } from "./TrackItem";
import { StepItem } from "./StepItem";
import { parseDroppableTrackId } from "./dnd-constants";
import { flattenSteps, getProjection } from "./tree-utils";
import {
  AddTrackDialog,
  RenameTrackDialog,
  ChangeColorDialog,
  DeleteTrackDialog,
} from "./TrackDialogs";

const POINTER_SENSOR_CONFIG = {
  activationConstraint: { distance: 5 },
};

export function TrackRail() {
  const tracks = useAppStore((s) => s.tracks);
  const activeTrackId = useAppStore((s) => s.activeTrackId);
  const expandedTrackIds = useAppStore((s) => s.expandedTrackIds);
  const activeProjectId = useAppStore((s) => s.activeProjectId);
  const setActiveTrack = useAppStore((s) => s.setActiveTrack);
  const setExpandedTrack = useAppStore((s) => s.setExpandedTrack);
  const toggleTrackExpanded = useAppStore((s) => s.toggleTrackExpanded);
  const expandAllTracks = useAppStore((s) => s.expandAllTracks);
  const collapseAllTracks = useAppStore((s) => s.collapseAllTracks);
  const addTrack = useAppStore((s) => s.addTrack);
  const updateTrackStore = useAppStore((s) => s.updateTrackStore);
  const removeTrack = useAppStore((s) => s.removeTrack);

  const steps = useAppStore((s) => s.steps);
  const activeStepId = useAppStore((s) => s.activeStepId);
  const setActiveStep = useAppStore((s) => s.setActiveStep);
  const addStep = useAppStore((s) => s.addStep);
  const removeStep = useAppStore((s) => s.removeStep);
  const updateStepStore = useAppStore((s) => s.updateStepStore);
  const loadTracks = useAppStore((s) => s.loadTracks);
  const loadSteps = useAppStore((s) => s.loadSteps);
  const selectedStepIds = useAppStore((s) => s.selectedStepIds);
  const selectStep = useAppStore((s) => s.selectStep);
  const toggleStepInSelection = useAppStore((s) => s.toggleStepInSelection);
  const shiftSelectSteps = useAppStore((s) => s.shiftSelectSteps);
  const clearSelectedSteps = useAppStore((s) => s.clearSelectedSteps);

  const currentSourcePages = useAppStore((s) => s.currentSourcePages);

  const pageIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    currentSourcePages.forEach((p, i) => map.set(p.id, i));
    return map;
  }, [currentSourcePages]);

  // Memoize step lookups
  const { stepsByTrack, stepsById } = useMemo(() => {
    const byTrack = new Map<string, Step[]>();
    const byId = new Map<string, Step>();
    for (const step of steps) {
      byId.set(step.id, step);
      const list = byTrack.get(step.track_id);
      if (list) {
        list.push(step);
      } else {
        byTrack.set(step.track_id, [step]);
      }
    }
    for (const list of byTrack.values()) {
      list.sort((a, b) => a.display_order - b.display_order);
    }
    return { stepsByTrack: byTrack, stepsById: byId };
  }, [steps]);

  const [addOpen, setAddOpen] = useState(false);
  const [renameTrack, setRenameTrack] = useState<Track | null>(null);
  const [colorTrack, setColorTrack] = useState<Track | null>(null);
  const [deleteTrackTarget, setDeleteTrackTarget] = useState<Track | null>(null);

  // Drag state
  const sensors = useSensors(useSensor(PointerSensor, POINTER_SENSOR_CONFIG));
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [overTrackId, setOverTrackId] = useState<string | null>(null);
  const [overElementId, setOverElementId] = useState<string | null>(null);
  const [offsetLeft, setOffsetLeft] = useState(0);

  const isMultiDragging =
    activeDragId !== null &&
    selectedStepIds.includes(activeDragId) &&
    selectedStepIds.length > 1;

  // Find which track an element belongs to (step or droppable-track-*)
  const findTargetTrackId = useCallback(
    (overId: string): string | null => {
      const parsed = parseDroppableTrackId(overId);
      if (parsed) return parsed;
      return stepsById.get(overId)?.track_id ?? null;
    },
    [stepsById],
  );

  // ---- Drag handlers ----

  const handleDragStart = (event: DragStartEvent) => {
    const dragId = event.active.id as string;
    if (!selectedStepIds.includes(dragId)) {
      clearSelectedSteps();
    }
    setActiveDragId(dragId);
    setOffsetLeft(0);
    setOverElementId(null);
  };

  const handleDragMove = (event: DragMoveEvent) => {
    setOffsetLeft(event.delta.x);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const overId = event.over?.id as string | undefined;
    setOverTrackId(overId ? findTargetTrackId(overId) : null);
    setOverElementId(overId ?? null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    const dragDeltaX = offsetLeft;
    setActiveDragId(null);
    setOverTrackId(null);
    setOverElementId(null);
    setOffsetLeft(0);
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    const stepsToMove = isMultiDragging ? selectedStepIds : [activeId];

    const sourceStep = stepsById.get(activeId);
    const targetTrackId = findTargetTrackId(overId);
    if (!sourceStep || !targetTrackId) return;

    // Check if all steps are already in the target track
    const allInTarget = stepsToMove.every(
      (sid) => stepsById.get(sid)?.track_id === targetTrackId,
    );

    if (allInTarget) {
      // Same-track: check for nesting (single-step drags only)
      if (!isMultiDragging && stepsToMove.length === 1) {
        const trackSteps = stepsByTrack.get(targetTrackId) ?? [];
        const flat = flattenSteps(trackSteps, activeId);
        const projection = getProjection(flat, activeId, overId, dragDeltaX);
        const currentParent = sourceStep.parent_step_id ?? null;
        const newParent = projection.parentId;

        if (currentParent !== newParent) {
          // Nesting changed — update parent then reorder
          await handleNestStep(activeId, targetTrackId, trackSteps, overId, currentParent, newParent);
          return;
        }
      }

      // Plain reorder (no nesting change)
      if (activeId === overId) return;
      handleReorderSteps(targetTrackId, stepsToMove, overId, activeId);
    } else {
      // Cross-track move — always lands as root (depth 0)
      await handleCrossTrackDrop(stepsToMove, targetTrackId, overId);
    }
  };

  // ---- Nest / un-nest a step ----

  const handleNestStep = async (
    stepId: string,
    trackId: string,
    trackSteps: Step[],
    overId: string,
    currentParentId: string | null,
    newParentId: string | null,
  ) => {
    try {
      // 1. Update the step's parent
      const updated = await api.setStepParent(stepId, newParentId);
      updateStepStore(updated);

      // 2. Collect children that travel with a dragged root step
      const childIds = trackSteps
        .filter((s) => s.parent_step_id === stepId)
        .map((s) => s.id);

      // 3. If the step moved to a parent, also reparent its children
      if (newParentId && childIds.length > 0) {
        // Children of a nested step must be un-nested (max depth 1)
        const updates = await Promise.all(
          childIds.map((cid) => api.setStepParent(cid, null)),
        );
        for (const cu of updates) updateStepStore(cu);
      }

      // 4. Reorder the scope the step landed in
      if (newParentId) {
        // Step became a child — reorder children of the new parent
        const siblingIds = trackSteps
          .filter((s) => s.parent_step_id === newParentId && s.id !== stepId)
          .map((s) => s.id);
        // Insert after the over-item's position among siblings, or at end
        const overIdx = siblingIds.indexOf(overId);
        const insertAt = overIdx >= 0 ? overIdx + 1 : siblingIds.length;
        const newChildOrder = [
          ...siblingIds.slice(0, insertAt),
          stepId,
          ...siblingIds.slice(insertAt),
        ];
        await api.reorderChildrenSteps(trackId, newParentId, newChildOrder);
      } else {
        // Step became a root — use drop position if over a root step,
        // otherwise fall back to after the former parent
        const rootIds = trackSteps
          .filter((s) => !s.parent_step_id && s.id !== stepId)
          .map((s) => s.id);
        const overRootIdx = rootIds.indexOf(overId);
        let insertAt: number;
        if (overRootIdx >= 0) {
          // Dropped on/near a root step — insert after it
          insertAt = overRootIdx + 1;
        } else {
          // Dropped on a child or self — insert after former parent
          const formerParentIdx = currentParentId
            ? rootIds.indexOf(currentParentId)
            : -1;
          insertAt =
            formerParentIdx >= 0 ? formerParentIdx + 1 : rootIds.length;
        }
        const newRootOrder = [
          ...rootIds.slice(0, insertAt),
          stepId,
          ...rootIds.slice(insertAt),
        ];
        await api.reorderSteps(trackId, newRootOrder);
      }

    } catch (e) {
      toast.error(`Failed to nest step: ${e}`);
    } finally {
      if (activeProjectId) {
        await loadSteps(activeProjectId);
      }
    }
  };

  // ---- Reorder within same track ----

  const handleReorderSteps = (
    trackId: string,
    movedIds: string[],
    overId: string,
    activeId: string,
  ) => {
    const trackSteps = stepsByTrack.get(trackId) ?? [];
    const stepIds = trackSteps.map((s) => s.id);

    let newOrder: string[];
    if (movedIds.length > 1) {
      // Multi-drag reorder
      const unselected = stepIds.filter((id) => !movedIds.includes(id));
      const overIndexInUnselected = unselected.indexOf(overId);
      const selectedInOrder = stepIds.filter((id) => movedIds.includes(id));

      if (overIndexInUnselected === -1) return;

      const activeOriginalIndex = stepIds.indexOf(activeId);
      const overOriginalIndex = stepIds.indexOf(overId);
      const insertIndex =
        activeOriginalIndex > overOriginalIndex
          ? overIndexInUnselected
          : overIndexInUnselected + 1;

      newOrder = [
        ...unselected.slice(0, insertIndex),
        ...selectedInOrder,
        ...unselected.slice(insertIndex),
      ];
    } else {
      const oldIndex = stepIds.indexOf(activeId);
      const newIndex = stepIds.indexOf(overId);
      if (oldIndex === -1 || newIndex === -1) return;
      newOrder = arrayMove(stepIds, oldIndex, newIndex);
    }

    // Optimistic update
    const otherSteps = steps.filter((s) => s.track_id !== trackId);
    const reordered = newOrder
      .map((id, i) => {
        const s = stepsById.get(id);
        return s ? { ...s, display_order: i } : null;
      })
      .filter(Boolean) as Step[];
    useAppStore.setState({ steps: [...otherSteps, ...reordered] });

    api
      .reorderSteps(trackId, newOrder)
      .then(() => {
        if (activeProjectId) loadSteps(activeProjectId);
      })
      .catch((e) => {
        toast.error(`Failed to reorder steps: ${e}`);
        if (activeProjectId) loadSteps(activeProjectId);
      });
  };

  // ---- Cross-track drop ----

  const handleCrossTrackDrop = async (
    stepIds: string[],
    targetTrackId: string,
    overElementId: string,
  ) => {
    const targetSteps = stepsByTrack.get(targetTrackId) ?? [];

    // Determine insertion index in target track
    let insertIndex = targetSteps.length; // default: append
    if (!parseDroppableTrackId(overElementId)) {
      const overIdx = targetSteps.findIndex((s) => s.id === overElementId);
      if (overIdx >= 0) insertIndex = overIdx;
    }

    // Collect source tracks that will need reordering
    const sourceTrackIds = new Set<string>();
    const stepsNeedingMove: string[] = [];
    for (const sid of stepIds) {
      const s = stepsById.get(sid);
      if (s && s.track_id !== targetTrackId) {
        sourceTrackIds.add(s.track_id);
        stepsNeedingMove.push(sid);
      }
    }

    try {
      // Move steps to target track
      await Promise.all(
        stepsNeedingMove.map((sid) =>
          api.updateStep({ id: sid, track_id: targetTrackId }),
        ),
      );

      // Build new order for target track: existing steps + inserted moved steps
      const existingTargetIds = targetSteps.map((s) => s.id).filter((id) => !stepIds.includes(id));
      const movedInOrder = steps
        .filter((s) => stepIds.includes(s.id))
        .sort((a, b) => a.display_order - b.display_order)
        .map((s) => s.id);

      const newTargetOrder = [
        ...existingTargetIds.slice(0, insertIndex),
        ...movedInOrder,
        ...existingTargetIds.slice(insertIndex),
      ];

      // Reorder target and close gaps in source tracks in parallel
      await Promise.all([
        api.reorderSteps(targetTrackId, newTargetOrder),
        ...[...sourceTrackIds].map((srcId) => {
          const remainingIds = steps
            .filter((s) => s.track_id === srcId && !stepIds.includes(s.id))
            .sort((a, b) => a.display_order - b.display_order)
            .map((s) => s.id);
          return api.reorderSteps(srcId, remainingIds);
        }),
      ]);

      clearSelectedSteps();
    } catch (e) {
      toast.error(`Failed to move steps: ${e}`);
    } finally {
      if (activeProjectId) {
        await Promise.all([loadTracks(activeProjectId), loadSteps(activeProjectId)]);
      }
    }
  };

  // ---- Track CRUD handlers ----

  const handleAdd = async (name: string, color?: string) => {
    if (!activeProjectId) return;
    try {
      const track = await api.createTrack({
        project_id: activeProjectId,
        name,
        color,
      });
      addTrack(track);
      setActiveTrack(track.id);
    } catch (e) {
      toast.error(`Failed to create track: ${e}`);
    }
  };

  const handleRename = async (id: string, name: string) => {
    try {
      const updated = await api.updateTrack({ id, name });
      updateTrackStore(updated);
    } catch (e) {
      toast.error(`Failed to rename track: ${e}`);
    }
  };

  const handleChangeColor = async (id: string, color: string) => {
    try {
      const updated = await api.updateTrack({ id, color });
      updateTrackStore(updated);
    } catch (e) {
      toast.error(`Failed to update track color: ${e}`);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteTrack(id);
      removeTrack(id);
      const trackSteps = steps.filter((s) => s.track_id === id);
      for (const s of trackSteps) {
        removeStep(s.id);
      }
    } catch (e) {
      toast.error(`Failed to delete track: ${e}`);
    }
  };

  const handleAddStep = async (trackId: string) => {
    const trackSteps = stepsByTrack.get(trackId) ?? [];
    const rootCount = trackSteps.filter((s) => !s.parent_step_id).length;
    const title = `Step ${rootCount + 1}`;
    try {
      const step = await api.createStep({ track_id: trackId, title });
      addStep(step);
      setActiveStep(step.id);
      if (activeProjectId) loadTracks(activeProjectId);
    } catch (e) {
      toast.error(`Failed to create step: ${e}`);
    }
  };

  const handleAddSubStep = async (parentStepId: string) => {
    const parent = stepsById.get(parentStepId);
    if (!parent) return;
    const trackSteps = stepsByTrack.get(parent.track_id) ?? [];
    const childCount = trackSteps.filter((s) => s.parent_step_id === parentStepId).length;
    // Derive parent number from parent's display_order
    const parentNum = parent.display_order + 1;
    const title = `Step ${parentNum}.${childCount + 1}`;
    try {
      const step = await api.createStep({
        track_id: parent.track_id,
        title,
        parent_step_id: parentStepId,
      });
      addStep(step);
      setActiveStep(step.id);
      if (activeProjectId) loadTracks(activeProjectId);
    } catch (e) {
      toast.error(`Failed to create sub-step: ${e}`);
    }
  };

  const handleDeleteStep = async (stepId: string) => {
    try {
      removeStep(stepId);
      await api.deleteStepAndReorder(stepId);
      if (activeProjectId) {
        await Promise.all([loadTracks(activeProjectId), loadSteps(activeProjectId)]);
      }
    } catch (e) {
      toast.error(`Failed to delete step: ${e}`);
    }
  };

  const handleStepClick = (id: string, e: React.MouseEvent) => {
    if (e.shiftKey) shiftSelectSteps(id);
    else if (e.metaKey || e.ctrlKey) toggleStepInSelection(id);
    else selectStep(id);
  };

  const handleToggleStepComplete = async (step: Step) => {
    try {
      const updated = await api.updateStep({
        id: step.id,
        is_completed: !step.is_completed,
      });
      updateStepStore(updated);
      if (activeProjectId) loadTracks(activeProjectId);
    } catch (e) {
      toast.error(`Failed to update step: ${e}`);
    }
  };

  // Drag overlay preview
  const dragSteps = useMemo(() => {
    if (!activeDragId) return [];
    return isMultiDragging
      ? steps.filter((s) => selectedStepIds.includes(s.id))
      : steps.filter((s) => s.id === activeDragId);
  }, [activeDragId, isMultiDragging, steps, selectedStepIds]);

  return (
    <div className="flex w-[200px] shrink-0 flex-col border-r border-border bg-sidebar">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-[11px] font-semibold tracking-wide text-text-tertiary uppercase">
          Tracks
        </span>
        <div className="flex items-center gap-0.5">
          {tracks.length > 0 && (
            <>
              <button
                onClick={expandAllTracks}
                className={`flex h-5 w-5 items-center justify-center rounded ${
                  expandedTrackIds.length === tracks.length
                    ? "bg-black/10 text-text-secondary"
                    : "text-text-tertiary hover:bg-black/5 hover:text-text-secondary"
                }`}
                title="Expand all"
              >
                <ChevronsDownUp className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={collapseAllTracks}
                className={`flex h-5 w-5 items-center justify-center rounded ${
                  expandedTrackIds.length === 0
                    ? "bg-black/10 text-text-secondary"
                    : "text-text-tertiary hover:bg-black/5 hover:text-text-secondary"
                }`}
                title="Collapse all"
              >
                <ChevronsUpDown className="h-3.5 w-3.5" />
              </button>
            </>
          )}
          <button
            onClick={() => setAddOpen(true)}
            className="flex h-5 w-5 items-center justify-center rounded text-text-tertiary hover:bg-black/5 hover:text-text-secondary"
            title="Add track"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Track list */}
      <div className="flex-1 overflow-y-auto">
        {tracks.length === 0 ? (
          <div className="flex flex-col items-center px-4 pt-8 text-center">
            <Route className="mb-2 h-5 w-5 text-text-tertiary/50" />
            <p className="text-[10px] text-text-tertiary">
              No tracks yet. Add a track to organize your build steps.
            </p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragMove={handleDragMove}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            {tracks.map((track) => (
              <TrackItem
                key={track.id}
                track={track}
                isActive={track.id === activeTrackId}
                isExpanded={expandedTrackIds.includes(track.id)}
                isDropTarget={overTrackId === track.id}
                isMultiDragging={isMultiDragging}
                offsetLeft={offsetLeft}
                overElementId={overElementId}
                onToggleExpand={(e) =>
                  e.metaKey || e.ctrlKey
                    ? setExpandedTrack(track.id)
                    : toggleTrackExpanded(track.id)
                }
                onRename={() => setRenameTrack(track)}
                onChangeColor={() => setColorTrack(track)}
                onDelete={() => setDeleteTrackTarget(track)}
                steps={stepsByTrack.get(track.id) ?? []}
                activeStepId={activeStepId}
                selectedStepIds={selectedStepIds}
                activeDragId={activeDragId}
                pageIndexMap={pageIndexMap}
                onStepClick={handleStepClick}
                onAddStep={() => handleAddStep(track.id)}
                onAddSubStep={handleAddSubStep}
                onDeleteStep={handleDeleteStep}
                onToggleStepComplete={handleToggleStepComplete}
              />
            ))}
            <DragOverlay dropAnimation={null}>
              {activeDragId && dragSteps.length > 0 && (
                <div className="space-y-0.5 rounded shadow-md">
                  {dragSteps.map((s) => (
                    <StepItem
                      key={s.id}
                      step={s}
                      isActive={false}
                      isSelected={isMultiDragging}
                      pageIndex={-1}
                      onToggleComplete={() => {}}
                      onDelete={() => {}}
                    />
                  ))}
                </div>
              )}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      {/* Dialogs */}
      <AddTrackDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        trackCount={tracks.length}
        onAdd={handleAdd}
      />
      <RenameTrackDialog
        open={!!renameTrack}
        onOpenChange={(open) => !open && setRenameTrack(null)}
        track={renameTrack}
        onRename={handleRename}
      />
      <ChangeColorDialog
        open={!!colorTrack}
        onOpenChange={(open) => !open && setColorTrack(null)}
        track={colorTrack}
        onChangeColor={handleChangeColor}
      />
      <DeleteTrackDialog
        open={!!deleteTrackTarget}
        onOpenChange={(open) => !open && setDeleteTrackTarget(null)}
        track={deleteTrackTarget}
        onDelete={handleDelete}
      />
    </div>
  );
}
