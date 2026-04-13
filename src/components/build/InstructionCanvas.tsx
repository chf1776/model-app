import { useRef, useEffect, useCallback, useState } from "react";
import { Stage, Layer, Rect, Image as KonvaImage } from "react-konva";
import useImage from "use-image";
import { convertFileSrc } from "@tauri-apps/api/core";
import { useAppStore } from "@/store";
import { getCanvasMode } from "@/shared/types";
import * as api from "@/api";
import { useCropDrawing } from "@/hooks/useCropDrawing";
import { useSprueDrawing } from "@/hooks/useSprueDrawing";
import { CropLayer, imageToEffective } from "./CropLayer";
import { SprueOverlayLayer } from "./SprueOverlayLayer";
import { PolygonLayer } from "./PolygonLayer";
import type Konva from "konva";
import { MIN_ZOOM, MAX_ZOOM, ZOOM_STEP } from "./zoom-utils";

const SAVE_DEBOUNCE_MS = 500;

function PageImage({
  src,
  rotation,
  width,
  height,
}: {
  src: string;
  rotation: number;
  width: number;
  height: number;
}) {
  const [image] = useImage(src, "anonymous");
  if (!image) return null;

  // Rotate around the center of the image
  const offsetX = width / 2;
  const offsetY = height / 2;
  // After rotation, reposition so the top-left of the bounding box is at (0,0)
  const isPortraitSwap = rotation === 90 || rotation === 270;
  const x = isPortraitSwap ? height / 2 : width / 2;
  const y = isPortraitSwap ? width / 2 : height / 2;

  return (
    <KonvaImage
      image={image}
      rotation={rotation}
      offsetX={offsetX}
      offsetY={offsetY}
      x={x}
      y={y}
    />
  );
}

export function InstructionCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasFitRef = useRef(false);
  const prevFocusCropRef = useRef(0);

  const activeProjectId = useAppStore((s) => s.activeProjectId);
  const currentSourcePages = useAppStore((s) => s.currentSourcePages);
  const currentPageIndex = useAppStore((s) => s.currentPageIndex);
  const viewerZoom = useAppStore((s) => s.viewerZoom);
  const viewerPanX = useAppStore((s) => s.viewerPanX);
  const viewerPanY = useAppStore((s) => s.viewerPanY);
  const setViewerZoom = useAppStore((s) => s.setViewerZoom);
  const setViewerPan = useAppStore((s) => s.setViewerPan);
  const fitToViewTrigger = useAppStore((s) => s.fitToViewTrigger);
  const focusCropTrigger = useAppStore((s) => s.focusCropTrigger);
  const canvasMode = useAppStore((s) => getCanvasMode(s.buildView));

  const currentPage = currentSourcePages[currentPageIndex];
  const imageSrc = currentPage ? convertFileSrc(currentPage.file_path) : null;
  const rotation = currentPage?.rotation ?? 0;

  // Effective dimensions after rotation
  const isSwapped = rotation === 90 || rotation === 270;
  const effectiveW = currentPage
    ? isSwapped
      ? currentPage.height
      : currentPage.width
    : 0;
  const effectiveH = currentPage
    ? isSwapped
      ? currentPage.width
      : currentPage.height
    : 0;

  // Crop drawing (steps)
  const { drawingRect, onMouseDown, onMouseMove, onMouseUp } = useCropDrawing(stageRef);
  // Crop drawing (sprues)
  const setupRailMode = useAppStore((s) => s.buildView.kind === "setup-sprues" ? "sprues" : "steps");
  const sprueDrawing = useSprueDrawing(stageRef);
  const isSprueMode = setupRailMode === "sprues";

  const isViewMode = canvasMode === "view";

  // ResizeObserver for stage dimensions
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setStageSize({ width, height });
      }
    });

    observer.observe(container);
    setStageSize({
      width: container.clientWidth,
      height: container.clientHeight,
    });

    return () => observer.disconnect();
  }, []);

  // Fit-to-view — always uses latest values via ref to avoid stale closures
  const fitToViewRef = useRef(() => {});
  fitToViewRef.current = () => {
    if (!currentPage || stageSize.width === 0 || stageSize.height === 0) return;

    const padding = 40;
    const availW = stageSize.width - padding * 2;
    const availH = stageSize.height - padding * 2;
    const scaleX = availW / effectiveW;
    const scaleY = availH / effectiveH;
    const zoom = Math.min(scaleX, scaleY, 1);

    const panX = (stageSize.width - effectiveW * zoom) / 2;
    const panY = (stageSize.height - effectiveH * zoom) / 2;

    setViewerZoom(zoom);
    setViewerPan(panX, panY);
  };

  // Auto-fit on page change (skip if focus-crop will handle it)
  useEffect(() => {
    if (currentPage && focusCropTrigger === prevFocusCropRef.current) {
      fitToViewRef.current();
      hasFitRef.current = true;
    }
  }, [currentPageIndex, currentPage?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-fit when rotation changes
  useEffect(() => {
    if (currentPage) {
      fitToViewRef.current();
    }
  }, [rotation]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fit when stage first gets a valid size
  useEffect(() => {
    if (!hasFitRef.current && stageSize.width > 0 && currentPage) {
      fitToViewRef.current();
      hasFitRef.current = true;
    }
  }, [stageSize, currentPage]);

  // Respond to explicit fit-to-view requests (keyboard `0`, toolbar button)
  useEffect(() => {
    if (fitToViewTrigger > 0) {
      fitToViewRef.current();
    }
  }, [fitToViewTrigger]);

  // Center on active step's crop region when triggered
  useEffect(() => {
    prevFocusCropRef.current = focusCropTrigger;
    if (focusCropTrigger === 0 || stageSize.width === 0) return;
    const { activeStepId, steps: allSteps } = useAppStore.getState();
    const step = activeStepId ? allSteps.find((s) => s.id === activeStepId) : null;
    if (!step || step.crop_x == null || step.crop_y == null || step.crop_w == null || step.crop_h == null || !currentPage) return;

    const eff = imageToEffective(
      step.crop_x, step.crop_y, step.crop_w, step.crop_h,
      currentPage.rotation, currentPage.width, currentPage.height,
    );

    const padding = 60;
    const availW = stageSize.width - padding * 2;
    const availH = stageSize.height - padding * 2;
    const zoom = Math.min(availW / eff.width, availH / eff.height, 2);
    const cropCenterX = eff.x + eff.width / 2;
    const cropCenterY = eff.y + eff.height / 2;
    const panX = stageSize.width / 2 - cropCenterX * zoom;
    const panY = stageSize.height / 2 - cropCenterY * zoom;

    setViewerZoom(zoom);
    setViewerPan(panX, panY);
  }, [focusCropTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced save view state
  const debouncedSave = useCallback(
    (zoom: number, panX: number, panY: number) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        if (activeProjectId) {
          api.saveViewState(activeProjectId, zoom, panX, panY).catch(() => {});
        }
      }, SAVE_DEBOUNCE_MS);
    },
    [activeProjectId],
  );

  // Scroll-wheel + trackpad pinch zoom centered on cursor
  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();
      const stage = stageRef.current;
      if (!stage) return;

      const oldZoom = viewerZoom;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      let newZoom: number;
      if (e.evt.ctrlKey) {
        // Trackpad pinch: ctrlKey is set, deltaY is continuous
        const zoomFactor = 1 - e.evt.deltaY * 0.01;
        newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, oldZoom * zoomFactor));
      } else {
        const direction = e.evt.deltaY < 0 ? 1 : -1;
        newZoom = Math.max(
          MIN_ZOOM,
          Math.min(MAX_ZOOM, oldZoom * (direction > 0 ? ZOOM_STEP : 1 / ZOOM_STEP)),
        );
      }

      const mousePointTo = {
        x: (pointer.x - viewerPanX) / oldZoom,
        y: (pointer.y - viewerPanY) / oldZoom,
      };

      const newPanX = pointer.x - mousePointTo.x * newZoom;
      const newPanY = pointer.y - mousePointTo.y * newZoom;

      setViewerZoom(newZoom);
      setViewerPan(newPanX, newPanY);
      debouncedSave(newZoom, newPanX, newPanY);
    },
    [viewerZoom, viewerPanX, viewerPanY, setViewerZoom, setViewerPan, debouncedSave],
  );

  // Drag to pan (view mode only — draggable is disabled in crop mode)
  const handleDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      const stage = e.target;
      if (stage !== stageRef.current) return;
      const x = stage.x();
      const y = stage.y();
      setViewerPan(x, y);
      debouncedSave(viewerZoom, x, y);
    },
    [viewerZoom, setViewerPan, debouncedSave],
  );

  // Cleanup save timer
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  const isPolygonMode = canvasMode === "polygon";
  const cursor = isViewMode ? "grab" : "crosshair";

  return (
    <div ref={containerRef} className="h-full w-full">
      {stageSize.width > 0 && imageSrc && currentPage && (
        <Stage
          ref={stageRef}
          width={stageSize.width}
          height={stageSize.height}
          scaleX={viewerZoom}
          scaleY={viewerZoom}
          x={viewerPanX}
          y={viewerPanY}
          draggable={isViewMode}
          onWheel={handleWheel}
          onDragEnd={handleDragEnd}
          onMouseDown={isPolygonMode ? undefined : isSprueMode ? sprueDrawing.onMouseDown : onMouseDown}
          onMouseMove={isPolygonMode ? undefined : isSprueMode ? sprueDrawing.onMouseMove : onMouseMove}
          onMouseUp={isPolygonMode ? undefined : isSprueMode ? sprueDrawing.onMouseUp : onMouseUp}
          style={{ cursor }}
        >
          <Layer>
            <Rect
              width={effectiveW}
              height={effectiveH}
              fill="#FFFFFF"
            />
            <PageImage
              src={imageSrc}
              rotation={rotation}
              width={currentPage.width}
              height={currentPage.height}
            />
          </Layer>
          <CropLayer drawingRect={isSprueMode ? null : drawingRect} zoom={viewerZoom} />
          <SprueOverlayLayer drawingRect={isSprueMode ? sprueDrawing.drawingRect : null} zoom={viewerZoom} />
          <PolygonLayer zoom={viewerZoom} stageRef={stageRef} />
        </Stage>
      )}
    </div>
  );
}
