import { useRef, useCallback, useState } from "react";
import { toast } from "sonner";
import { useAppStore } from "@/store";
import { stageToImage } from "./useCropDrawing";
import type { DrawingRect } from "./useCropDrawing";
import * as api from "@/api";
import type Konva from "konva";

export type { DrawingRect };

const MIN_CROP_SIZE = 5;

/**
 * Crop drawing hook for sprue reference crops.
 * When the user draws a rectangle on the canvas in crop mode with setupRailMode=sprues,
 * it creates or updates a sprue ref with the crop region.
 */
export function useSprueDrawing(stageRef: React.RefObject<Konva.Stage | null>) {
  const [drawingRect, setDrawingRect] = useState<DrawingRect | null>(null);
  const startPoint = useRef<{ x: number; y: number } | null>(null);
  const isCreating = useRef(false);

  const canvasMode = useAppStore((s) => s.canvasMode);
  const setupRailMode = useAppStore((s) => s.setupRailMode);
  const activeSprueRefId = useAppStore((s) => s.activeSprueRefId);
  const sprueRefs = useAppStore((s) => s.sprueRefs);
  const activeProjectId = useAppStore((s) => s.activeProjectId);
  const currentSourcePages = useAppStore((s) => s.currentSourcePages);
  const currentPageIndex = useAppStore((s) => s.currentPageIndex);
  const addSprueRefStore = useAppStore((s) => s.addSprueRefStore);
  const updateSprueRefStore = useAppStore((s) => s.updateSprueRefStore);
  const setActiveSprueRef = useAppStore((s) => s.setActiveSprueRef);
  const viewerZoom = useAppStore((s) => s.viewerZoom);
  const viewerPanX = useAppStore((s) => s.viewerPanX);
  const viewerPanY = useAppStore((s) => s.viewerPanY);

  const isSprueMode = setupRailMode === "sprues";
  const currentPage = currentSourcePages[currentPageIndex];

  const onMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (canvasMode !== "crop" || !isSprueMode || !currentPage) return;
      if (e.evt.button !== 0) return;

      const stage = stageRef.current;
      if (!stage) return;

      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      startPoint.current = { x: pointer.x, y: pointer.y };
      setDrawingRect(null);
    },
    [canvasMode, isSprueMode, currentPage, stageRef],
  );

  const onMouseMove = useCallback(
    (_e: Konva.KonvaEventObject<MouseEvent>) => {
      if (!startPoint.current || canvasMode !== "crop" || !isSprueMode) return;

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
    [canvasMode, isSprueMode, stageRef],
  );

  const onMouseUp = useCallback(
    async (_e: Konva.KonvaEventObject<MouseEvent>) => {
      if (!startPoint.current || canvasMode !== "crop" || !isSprueMode || !currentPage || !activeProjectId) {
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

      const rotation = currentPage.rotation;
      const imgW = currentPage.width;
      const imgH = currentPage.height;

      const p1 = stageToImage(start.x, start.y, viewerPanX, viewerPanY, viewerZoom, rotation, imgW, imgH);
      const p2 = stageToImage(pointer.x, pointer.y, viewerPanX, viewerPanY, viewerZoom, rotation, imgW, imgH);

      const cropX = Math.round(Math.min(p1.x, p2.x));
      const cropY = Math.round(Math.min(p1.y, p2.y));
      const cropW = Math.round(Math.abs(p2.x - p1.x));
      const cropH = Math.round(Math.abs(p2.y - p1.y));

      if (cropW < MIN_CROP_SIZE || cropH < MIN_CROP_SIZE) return;

      isCreating.current = true;
      try {
        // If an active sprue ref has no crop, update it with this crop
        const activeRef = activeSprueRefId
          ? sprueRefs.find((r) => r.id === activeSprueRefId)
          : null;
        const shouldUpdate = activeRef && activeRef.crop_x == null;

        if (shouldUpdate) {
          const updated = await api.updateSprueRef({
            id: activeRef.id,
            source_page_id: currentPage.id,
            crop_x: cropX,
            crop_y: cropY,
            crop_w: cropW,
            crop_h: cropH,
          });
          updateSprueRefStore(updated);
        } else {
          // Create a new sprue ref with auto-assigned label
          const usedLabels = new Set(sprueRefs.map((r) => r.label));
          let nextLabel = "A";
          for (let i = 0; i < 26; i++) {
            const letter = String.fromCharCode(65 + i);
            if (!usedLabels.has(letter)) {
              nextLabel = letter;
              break;
            }
          }

          const ref = await api.createSprueRef({
            project_id: activeProjectId,
            source_page_id: currentPage.id,
            crop_x: cropX,
            crop_y: cropY,
            crop_w: cropW,
            crop_h: cropH,
            label: nextLabel,
          });
          addSprueRefStore(ref);
          setActiveSprueRef(ref.id);
          toast.success(`Sprue "${ref.label}" created`, { toasterId: "canvas" });
        }
      } catch (err) {
        toast.error(`Failed to save sprue crop: ${err}`, { toasterId: "canvas" });
      } finally {
        isCreating.current = false;
      }
    },
    [
      canvasMode, isSprueMode, currentPage, activeProjectId, activeSprueRefId,
      sprueRefs, stageRef, addSprueRefStore, updateSprueRefStore, setActiveSprueRef,
      viewerZoom, viewerPanX, viewerPanY,
    ],
  );

  return { drawingRect: isSprueMode ? drawingRect : null, onMouseDown, onMouseMove, onMouseUp };
}
