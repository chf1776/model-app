export const DROPPABLE_TRACK_PREFIX = "droppable-track-";

export function parseDroppableTrackId(id: string): string | null {
  return id.startsWith(DROPPABLE_TRACK_PREFIX)
    ? id.slice(DROPPABLE_TRACK_PREFIX.length)
    : null;
}
