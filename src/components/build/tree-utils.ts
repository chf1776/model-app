import { arrayMove } from "@dnd-kit/sortable";
import type { Step } from "@/shared/types";

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
  const childrenMap = new Map<string, Step[]>();
  for (const s of steps) {
    if (s.parent_step_id) {
      const arr = childrenMap.get(s.parent_step_id) ?? [];
      arr.push(s);
      childrenMap.set(s.parent_step_id, arr);
    }
  }

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

  // Simulate the move
  const projected = arrayMove(flatItems, activeIndex, overIndex);
  const newIndex = projected.findIndex((item) => item.id === activeId);

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
