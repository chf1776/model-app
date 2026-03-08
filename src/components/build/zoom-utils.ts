import { useAppStore } from "@/store";

// Absolute zoom limits (InstructionCanvas, PageCanvas)
export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 5.0;
export const ZOOM_STEP = 1.08;

// Relative zoom limits (CropCanvas — 1.0 = fit-to-view)
export const MIN_RELATIVE_ZOOM = 0.33;
export const MAX_RELATIVE_ZOOM = 2.0;
export const ZOOM_STEP_BUTTON = 1.2;

/**
 * Zoom centered on viewport middle. Reads pan from store directly
 * so callers don't need pan values in their dependency arrays.
 */
export function zoomCentered(newZoom: number) {
  const { viewerZoom, setViewerZoom, setViewerPan, viewerPanX, viewerPanY } =
    useAppStore.getState();
  const stageEl = document.querySelector(".konvajs-content");
  if (!stageEl) {
    setViewerZoom(newZoom);
    return;
  }
  const { width: vw, height: vh } = stageEl.getBoundingClientRect();
  const ratio = newZoom / viewerZoom;
  setViewerZoom(newZoom);
  setViewerPan(
    vw / 2 - (vw / 2 - viewerPanX) * ratio,
    vh / 2 - (vh / 2 - viewerPanY) * ratio,
  );
}

export function zoomIn() {
  const { viewerZoom } = useAppStore.getState();
  zoomCentered(Math.min(viewerZoom * ZOOM_STEP_BUTTON, MAX_RELATIVE_ZOOM));
}

export function zoomOut() {
  const { viewerZoom } = useAppStore.getState();
  zoomCentered(Math.max(viewerZoom / ZOOM_STEP_BUTTON, MIN_RELATIVE_ZOOM));
}
