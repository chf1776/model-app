import { arrayMove } from "@dnd-kit/sortable";
import type { Step, StepRelation } from "@/shared/types";

/** Parse step relations into categorized ID arrays for display. */
export function parseStepRelations(relations: StepRelation[], stepId: string) {
  const blockedByIds: string[] = [];
  const blocksAccessIds: string[] = [];
  const incomingBlockedBy: string[] = [];
  const incomingBlocksAccess: string[] = [];

  for (const r of relations) {
    if (r.from_step_id === stepId) {
      if (r.relation_type === "blocked_by") blockedByIds.push(r.to_step_id);
      else if (r.relation_type === "blocks_access_to") blocksAccessIds.push(r.to_step_id);
    } else if (r.to_step_id === stepId) {
      if (r.relation_type === "blocked_by") incomingBlockedBy.push(r.from_step_id);
      else if (r.relation_type === "blocks_access_to") incomingBlocksAccess.push(r.from_step_id);
    }
  }

  return { blockedByIds, blocksAccessIds, incomingBlockedBy, incomingBlocksAccess };
}

/** Compute which step IDs are replaced by other steps. */
export function getReplacedStepIds(steps: Step[]): Set<string> {
  const ids = new Set<string>();
  for (const s of steps) {
    if (s.replaces_step_id) ids.add(s.replaces_step_id);
  }
  return ids;
}

/** Warnings to show before completing a step. */
export interface CompletionWarning {
  incompleteBlockers: Step[];
  accessLossSteps: Step[];
  prePaintTrappedSteps: Step[];
}

/** Compute completion warnings for a step based on its relations. */
export function getCompletionWarnings(
  stepId: string,
  steps: Step[],
  relations: StepRelation[],
): CompletionWarning {
  const { blockedByIds, blocksAccessIds } = parseStepRelations(relations, stepId);
  const incompleteBlockers = blockedByIds
    .map((id) => steps.find((s) => s.id === id))
    .filter((s): s is Step => !!s && !s.is_completed);
  const accessLossSteps = blocksAccessIds
    .map((id) => steps.find((s) => s.id === id))
    .filter((s): s is Step => !!s && !s.is_completed);
  const prePaintTrappedSteps = accessLossSteps.filter((s) => s.pre_paint);
  return { incompleteBlockers, accessLossSteps, prePaintTrappedSteps };
}

/** Check if there are any warnings that should block immediate completion. */
export function hasCompletionWarnings(w: CompletionWarning): boolean {
  return w.incompleteBlockers.length > 0 || w.accessLossSteps.length > 0;
}

/** Compute effective dimensions after rotation. Works for any angle but typically 0/90/180/270. */
export function getEffectiveDimensions(w: number, h: number, rotation: number) {
  const rad = (rotation * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));
  return {
    effectiveW: w * cos + h * sin,
    effectiveH: w * sin + h * cos,
    rad,
  };
}

/** Build a map of parentStepId → children for a list of steps. */
export function buildChildrenMap(steps: Step[]): Map<string, Step[]> {
  const map = new Map<string, Step[]>();
  for (const s of steps) {
    if (s.parent_step_id) {
      const arr = map.get(s.parent_step_id) ?? [];
      arr.push(s);
      map.set(s.parent_step_id, arr);
    }
  }
  return map;
}

/** Filter steps by track and sort by display_order. */
export function getOrderedTrackSteps(steps: Step[], trackId: string | null): Step[] {
  return steps
    .filter((s) => s.track_id === trackId)
    .sort((a, b) => a.display_order - b.display_order);
}

/**
 * Flatten track steps in walk order: root1, root1.child1, root1.child2, root2, ...
 * When excludeReplacedIds is provided, those steps are filtered out.
 */
export function flattenTrackSteps(
  steps: Step[],
  trackId: string | null,
  opts?: { excludeReplacedIds?: Set<string> },
): Step[] {
  const ordered = getOrderedTrackSteps(steps, trackId);
  const roots = ordered.filter((s) => !s.parent_step_id);
  const childrenMap = buildChildrenMap(ordered);
  const flat: Step[] = [];
  for (const root of roots) {
    flat.push(root);
    const children = childrenMap.get(root.id);
    if (children) flat.push(...children);
  }
  if (opts?.excludeReplacedIds && opts.excludeReplacedIds.size > 0) {
    return flat.filter((s) => !opts.excludeReplacedIds!.has(s.id));
  }
  return flat;
}

/**
 * Compute a hierarchical label for a step, e.g. "Step 3" or "Step 2.1".
 * rootCount is the total number of root steps.
 * When excludeReplacedIds is provided, those steps are excluded from counts.
 */
export function getStepLabel(
  step: Step,
  allSteps: Step[],
  opts?: { excludeReplacedIds?: Set<string> },
): { label: string; rootCount: number } {
  const excluded = opts?.excludeReplacedIds;
  const trackSteps = allSteps
    .filter((s) => s.track_id === step.track_id && (!excluded || !excluded.has(s.id)))
    .sort((a, b) => a.display_order - b.display_order);
  const roots = trackSteps.filter((s) => !s.parent_step_id);

  if (!step.parent_step_id) {
    const rootIdx = roots.findIndex((s) => s.id === step.id);
    return { label: `Step ${rootIdx + 1}`, rootCount: roots.length };
  }

  // Sub-step: find parent index and child index
  const parentIdx = roots.findIndex((s) => s.id === step.parent_step_id);
  const siblings = trackSteps.filter((s) => s.parent_step_id === step.parent_step_id);
  const childIdx = siblings.findIndex((s) => s.id === step.id);
  return {
    label: `Step ${parentIdx + 1}.${childIdx + 1}`,
    rootCount: roots.length,
  };
}

export interface FlatStep {
  id: string;
  parentId: string | null;
  depth: number;
}

export interface Projection {
  depth: number;
  parentId: string | null;
}

/**
 * Converts a track's sorted steps into a flat array with depth info.
 * Root steps = depth 0, their children = depth 1, interleaved in display order.
 * When activeDragId is a root step with children, those children are excluded
 * (they collapse into the parent during drag).
 */
export function flattenSteps(
  steps: Step[],
  activeDragId?: string | null,
): FlatStep[] {
  const rootSteps = steps.filter((s) => !s.parent_step_id);
  const childrenMap = buildChildrenMap(steps);

  const flat: FlatStep[] = [];
  for (const root of rootSteps) {
    flat.push({ id: root.id, parentId: null, depth: 0 });
    // If active drag is this root step, collapse its children
    if (activeDragId && root.id === activeDragId) continue;
    const children = childrenMap.get(root.id);
    if (children) {
      for (const child of children) {
        flat.push({ id: child.id, parentId: root.id, depth: 1 });
      }
    }
  }

  return flat;
}

/**
 * Computes the projected depth and parentId for a drag operation.
 * Adapted from dnd-kit SortableTree utilities.
 */
export function getProjection(
  flatItems: FlatStep[],
  activeId: string,
  overId: string,
  deltaX: number,
  indentWidth = 20,
): Projection {
  const activeIndex = flatItems.findIndex((item) => item.id === activeId);
  const overIndex = flatItems.findIndex((item) => item.id === overId);

  if (activeIndex === -1 || overIndex === -1) {
    return { depth: 0, parentId: null };
  }

  // Simulate the move — arrayMove places the element at overIndex
  const projected = arrayMove(flatItems, activeIndex, overIndex);
  const newIndex = overIndex;

  const currentDepth = flatItems[activeIndex].depth;
  const dragDepth = Math.round(deltaX / indentWidth);
  const projectedDepth = currentDepth + dragDepth;

  // Compute max/min depth constraints
  const previousItem = newIndex > 0 ? projected[newIndex - 1] : null;
  const nextItem =
    newIndex < projected.length - 1 ? projected[newIndex + 1] : null;

  // Can't exceed depth 1, can't skip levels (previous.depth + 1)
  const maxDepth = previousItem
    ? Math.min(1, previousItem.depth + 1)
    : 0;

  // Can't orphan items below
  const minDepth = nextItem ? nextItem.depth : 0;

  const clampedDepth = Math.max(minDepth, Math.min(maxDepth, projectedDepth));

  // Resolve parentId: depth 0 → null, depth 1 → walk backwards to nearest depth-0 item
  let parentId: string | null = null;
  if (clampedDepth === 1) {
    for (let i = newIndex - 1; i >= 0; i--) {
      if (projected[i].depth === 0 && projected[i].id !== activeId) {
        parentId = projected[i].id;
        break;
      }
    }
    // If no parent found, can't nest — fall back to depth 0
    if (!parentId) {
      return { depth: 0, parentId: null };
    }
  }

  return { depth: clampedDepth, parentId };
}
