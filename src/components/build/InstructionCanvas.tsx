import { useRef, useEffect, useCallback, useState } from "react";
import { Stage, Layer, Image as KonvaImage } from "react-konva";
import useImage from "use-image";
import { convertFileSrc } from "@tauri-apps/api/core";
import { useAppStore } from "@/store";
import * as api from "@/api";
import type Konva from "konva";

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 5.0;
const ZOOM_STEP = 1.08;
const SAVE_DEBOUNCE_MS = 500;

function PageImage({ src }: { src: string }) {
  const [image] = useImage(src, "anonymous");
  if (!image) return null;
  return <KonvaImage image={image} />;
}

export function InstructionCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasFitRef = useRef(false);

  const activeProjectId = useAppStore((s) => s.activeProjectId);
  const currentSourcePages = useAppStore((s) => s.currentSourcePages);
  const currentPageIndex = useAppStore((s) => s.currentPageIndex);
  const viewerZoom = useAppStore((s) => s.viewerZoom);
  const viewerPanX = useAppStore((s) => s.viewerPanX);
  const viewerPanY = useAppStore((s) => s.viewerPanY);
  const setViewerZoom = useAppStore((s) => s.setViewerZoom);
  const setViewerPan = useAppStore((s) => s.setViewerPan);

  const currentPage = currentSourcePages[currentPageIndex];
  const imageSrc = currentPage ? convertFileSrc(currentPage.file_path) : null;

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
    // Initial size
    setStageSize({
      width: container.clientWidth,
      height: container.clientHeight,
    });

    return () => observer.disconnect();
  }, []);

  // Fit-to-view on first load or page change
  const fitToView = useCallback(() => {
    if (!currentPage || stageSize.width === 0 || stageSize.height === 0) return;

    const padding = 40;
    const availW = stageSize.width - padding * 2;
    const availH = stageSize.height - padding * 2;
    const scaleX = availW / currentPage.width;
    const scaleY = availH / currentPage.height;
    const zoom = Math.min(scaleX, scaleY, 1);

    const panX = (stageSize.width - currentPage.width * zoom) / 2;
    const panY = (stageSize.height - currentPage.height * zoom) / 2;

    setViewerZoom(zoom);
    setViewerPan(panX, panY);
  }, [currentPage, stageSize, setViewerZoom, setViewerPan]);

  // Auto-fit on page change
  useEffect(() => {
    if (currentPage) {
      fitToView();
      hasFitRef.current = true;
    }
  }, [currentPageIndex, currentPage?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fit when stage first gets a valid size
  useEffect(() => {
    if (!hasFitRef.current && stageSize.width > 0 && currentPage) {
      fitToView();
      hasFitRef.current = true;
    }
  }, [stageSize, currentPage, fitToView]);

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

  // Scroll-wheel zoom centered on cursor
  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();
      const stage = stageRef.current;
      if (!stage) return;

      const oldZoom = viewerZoom;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const direction = e.evt.deltaY < 0 ? 1 : -1;
      const newZoom = Math.max(
        MIN_ZOOM,
        Math.min(MAX_ZOOM, oldZoom * (direction > 0 ? ZOOM_STEP : 1 / ZOOM_STEP)),
      );

      // Zoom toward cursor position
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

  // Drag to pan
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

  return (
    <div ref={containerRef} className="h-full w-full">
      {stageSize.width > 0 && imageSrc && (
        <Stage
          ref={stageRef}
          width={stageSize.width}
          height={stageSize.height}
          scaleX={viewerZoom}
          scaleY={viewerZoom}
          x={viewerPanX}
          y={viewerPanY}
          draggable
          onWheel={handleWheel}
          onDragEnd={handleDragEnd}
          style={{ cursor: "grab" }}
        >
          <Layer>
            <PageImage src={imageSrc} />
          </Layer>
        </Stage>
      )}
    </div>
  );
}
