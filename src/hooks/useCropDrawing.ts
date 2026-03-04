import { useRef, useCallback, useState } from "react";
import { toast } from "sonner";
import { useAppStore } from "@/store";
import * as api from "@/api";
import type Konva from "konva";

export interface DrawingRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const MIN_CROP_SIZE = 5;

/**
 * Convert a stage-space point to image-space, accounting for zoom, pan, and rotation.
 *
 * The Konva Stage has scaleX/Y (zoom) and x/y (pan offset). The page image may be
 * rotated. To convert a point (sx, sy) in stage-space to image-space (ix, iy):
 *  1. Remove stage transform: rawX = (sx - stage.x) / zoom, rawY = (sy - stage.y) / zoom
 *  2. Apply inverse rotation
 *  3. Clamp to image bounds
 */
function stageToImage(
  sx: number,
  sy: number,
  stageX: number,
  stageY: number,
  zoom: number,
  rotation: number,
  imgW: number,
  imgH: number,
): { x: number; y: number } {
  // 1. Remove stage transform to get coordinates in the unscaled layer space
  const rawX = (sx - stageX) / zoom;
  const rawY = (sy - stageY) / zoom;

  // In the layer, the image is rendered with rotation applied such that:
  //   0°:   image occupies [0..imgW, 0..imgH], effective = [imgW, imgH]
  //   90°:  image occupies [0..imgH, 0..imgW], effective = [imgH, imgW]
  //   180°: image occupies [0..imgW, 0..imgH], effective = [imgW, imgH]
  //   270°: image occupies [0..imgH, 0..imgW], effective = [imgH, imgW]
  //
  // We need to map rawX/rawY (in effective-space) back to the original image coordinates.
  let ix: number;
  let iy: number;

  switch (rotation) {
    case 90:
      // effective W = imgH, effective H = imgW
      // In image space: ix = rawY, iy = imgH - rawX
      ix = rawY;
      iy = imgH - rawX;
      break;
    case 180:
      // effective W = imgW, effective H = imgH
      ix = imgW - rawX;
      iy = imgH - rawY;
      break;
    case 270:
      // effective W = imgH, effective H = imgW
      ix = imgW - rawY;
      iy = rawX;
      break;
    default: // 0
      ix = rawX;
      iy = rawY;
      break;
  }

  // 3. Clamp to image bounds
  ix = Math.max(0, Math.min(imgW, ix));
  iy = Math.max(0, Math.min(imgH, iy));

  return { x: ix, y: iy };
}

export function useCropDrawing(stageRef: React.RefObject<Konva.Stage | null>) {
  const [drawingRect, setDrawingRect] = useState<DrawingRect | null>(null);
  const startPoint = useRef<{ x: number; y: number } | null>(null);
  const isCreating = useRef(false);

  const canvasMode = useAppStore((s) => s.canvasMode);
  const activeTrackId = useAppStore((s) => s.activeTrackId);
  const currentSourcePages = useAppStore((s) => s.currentSourcePages);
  const currentPageIndex = useAppStore((s) => s.currentPageIndex);
  const steps = useAppStore((s) => s.steps);
  const addStep = useAppStore((s) => s.addStep);
  const setActiveStep = useAppStore((s) => s.setActiveStep);
  const activeProjectId = useAppStore((s) => s.activeProjectId);
  const loadTracks = useAppStore((s) => s.loadTracks);
  const pushUndo = useAppStore((s) => s.pushUndo);
  const viewerZoom = useAppStore((s) => s.viewerZoom);
  const viewerPanX = useAppStore((s) => s.viewerPanX);
  const viewerPanY = useAppStore((s) => s.viewerPanY);

  const currentPage = currentSourcePages[currentPageIndex];

  const onMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (canvasMode !== "crop" || !currentPage || !activeTrackId) return;

      // Only start crop from left-click on the stage/layer background
      if (e.evt.button !== 0) return;

      const stage = stageRef.current;
      if (!stage) return;

      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      // Store the stage-space start point for the drawing rectangle
      startPoint.current = { x: pointer.x, y: pointer.y };
      setDrawingRect(null);
    },
    [canvasMode, currentPage, activeTrackId, stageRef],
  );

  const onMouseMove = useCallback(
    (_e: Konva.KonvaEventObject<MouseEvent>) => {
      if (!startPoint.current || canvasMode !== "crop") return;

      const stage = stageRef.current;
      if (!stage) return;

      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const x = Math.min(startPoint.current.x, pointer.x);
      const y = Math.min(startPoint.current.y, pointer.y);
      const width = Math.abs(pointer.x - startPoint.current.x);
      const height = Math.abs(pointer.y - startPoint.current.y);

      setDrawingRect({ x, y, width, height });
    },
    [canvasMode, stageRef],
  );

  const onMouseUp = useCallback(
    async (_e: Konva.KonvaEventObject<MouseEvent>) => {
      if (!startPoint.current || canvasMode !== "crop" || !currentPage || !activeTrackId) {
        startPoint.current = null;
        setDrawingRect(null);
        return;
      }

      if (isCreating.current) {
        startPoint.current = null;
        setDrawingRect(null);
        return;
      }

      const stage = stageRef.current;
      if (!stage) {
        startPoint.current = null;
        setDrawingRect(null);
        return;
      }

      const pointer = stage.getPointerPosition();
      if (!pointer) {
        startPoint.current = null;
        setDrawingRect(null);
        return;
      }

      const start = startPoint.current;
      startPoint.current = null;
      setDrawingRect(null);

      // Convert both corners to image space
      const rotation = currentPage.rotation;
      const imgW = currentPage.width;
      const imgH = currentPage.height;

      const p1 = stageToImage(start.x, start.y, viewerPanX, viewerPanY, viewerZoom, rotation, imgW, imgH);
      const p2 = stageToImage(pointer.x, pointer.y, viewerPanX, viewerPanY, viewerZoom, rotation, imgW, imgH);

      const cropX = Math.min(p1.x, p2.x);
      const cropY = Math.min(p1.y, p2.y);
      const cropW = Math.abs(p2.x - p1.x);
      const cropH = Math.abs(p2.y - p1.y);

      // Validate minimum size
      if (cropW < MIN_CROP_SIZE || cropH < MIN_CROP_SIZE) return;

      // Count existing steps for this track to auto-name
      const trackSteps = steps.filter((s) => s.track_id === activeTrackId);
      const title = `Step ${trackSteps.length + 1}`;

      isCreating.current = true;
      try {
        const step = await api.createStep({
          track_id: activeTrackId,
          title,
          source_page_id: currentPage.id,
          crop_x: Math.round(cropX),
          crop_y: Math.round(cropY),
          crop_w: Math.round(cropW),
          crop_h: Math.round(cropH),
        });
        addStep(step);
        pushUndo(step.id, step.track_id);
        setActiveStep(step.id);
        if (activeProjectId) loadTracks(activeProjectId);
      } catch (err) {
        toast.error(`Failed to create step: ${err}`);
      } finally {
        isCreating.current = false;
      }
    },
    [
      canvasMode, currentPage, activeTrackId, stageRef, steps,
      addStep, pushUndo, setActiveStep, activeProjectId, loadTracks,
      viewerZoom, viewerPanX, viewerPanY,
    ],
  );

  return { drawingRect, onMouseDown, onMouseMove, onMouseUp };
}
