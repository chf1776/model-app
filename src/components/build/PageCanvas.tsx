import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { Stage, Layer, Rect, Image as KonvaImage, Group, Text } from "react-konva";
import useImage from "use-image";
import { convertFileSrc } from "@tauri-apps/api/core";
import { useAppStore } from "@/store";
import { imageToEffective } from "./CropLayer";
import type Konva from "konva";
import { MIN_ZOOM, MAX_ZOOM, ZOOM_STEP } from "./zoom-utils";

const PADDING = 40;

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

  const offsetX = width / 2;
  const offsetY = height / 2;
  const isSwapped = rotation === 90 || rotation === 270;
  const x = isSwapped ? height / 2 : width / 2;
  const y = isSwapped ? width / 2 : height / 2;

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

export function PageCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });

  const currentSourcePages = useAppStore((s) => s.currentSourcePages);
  const currentPageIndex = useAppStore((s) => s.currentPageIndex);
  const steps = useAppStore((s) => s.steps);
  const tracks = useAppStore((s) => s.tracks);
  const activeStepId = useAppStore((s) => s.activeStepId);
  const setActiveStep = useAppStore((s) => s.setActiveStep);
  const viewerZoom = useAppStore((s) => s.viewerZoom);
  const viewerPanX = useAppStore((s) => s.viewerPanX);
  const viewerPanY = useAppStore((s) => s.viewerPanY);
  const setViewerZoom = useAppStore((s) => s.setViewerZoom);
  const setViewerPan = useAppStore((s) => s.setViewerPan);
  const fitToViewTrigger = useAppStore((s) => s.fitToViewTrigger);

  const currentPage = currentSourcePages[currentPageIndex];
  const imageSrc = currentPage ? convertFileSrc(currentPage.file_path) : null;
  const rotation = currentPage?.rotation ?? 0;
  const isSwapped = rotation === 90 || rotation === 270;
  const effectiveW = currentPage ? (isSwapped ? currentPage.height : currentPage.width) : 0;
  const effectiveH = currentPage ? (isSwapped ? currentPage.width : currentPage.height) : 0;

  // Steps on this page
  const pageSteps = useMemo(
    () => currentPage
      ? steps.filter(
          (s) =>
            s.source_page_id === currentPage.id &&
            s.crop_x != null && s.crop_y != null && s.crop_w != null && s.crop_h != null,
        )
      : [],
    [steps, currentPage],
  );

  const trackMap = useMemo(() => new Map(tracks.map((t) => [t.id, t])), [tracks]);

  // ResizeObserver
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setStageSize({ width, height });
    });
    ro.observe(el);
    setStageSize({ width: el.clientWidth, height: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  // Fit to view
  const fitToViewRef = useRef(() => {});
  fitToViewRef.current = () => {
    if (!currentPage || stageSize.width === 0 || stageSize.height === 0) return;
    const availW = stageSize.width - PADDING * 2;
    const availH = stageSize.height - PADDING * 2;
    const zoom = Math.min(availW / effectiveW, availH / effectiveH, 1);
    setViewerZoom(zoom);
    setViewerPan(
      (stageSize.width - effectiveW * zoom) / 2,
      (stageSize.height - effectiveH * zoom) / 2,
    );
  };

  // Auto-fit on page change
  useEffect(() => {
    if (currentPage) fitToViewRef.current();
  }, [currentPageIndex, currentPage?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fit when stage gets valid size
  useEffect(() => {
    if (stageSize.width > 0 && currentPage) fitToViewRef.current();
  }, [stageSize.width, stageSize.height]); // eslint-disable-line react-hooks/exhaustive-deps

  // Explicit fit-to-view
  useEffect(() => {
    if (fitToViewTrigger > 0) fitToViewRef.current();
  }, [fitToViewTrigger]);

  // Re-fit on rotation
  useEffect(() => {
    if (currentPage) fitToViewRef.current();
  }, [rotation]); // eslint-disable-line react-hooks/exhaustive-deps

  // Wheel + trackpad pinch zoom
  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();
      const stage = stageRef.current;
      if (!stage) return;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      let newZoom: number;
      if (e.evt.ctrlKey) {
        // Trackpad pinch: ctrlKey is set, deltaY is continuous
        const zoomFactor = 1 - e.evt.deltaY * 0.01;
        newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, viewerZoom * zoomFactor));
      } else {
        const direction = e.evt.deltaY < 0 ? 1 : -1;
        newZoom = Math.max(
          MIN_ZOOM,
          Math.min(MAX_ZOOM, viewerZoom * (direction > 0 ? ZOOM_STEP : 1 / ZOOM_STEP)),
        );
      }
      const mousePointTo = {
        x: (pointer.x - viewerPanX) / viewerZoom,
        y: (pointer.y - viewerPanY) / viewerZoom,
      };
      setViewerZoom(newZoom);
      setViewerPan(
        pointer.x - mousePointTo.x * newZoom,
        pointer.y - mousePointTo.y * newZoom,
      );
    },
    [viewerZoom, viewerPanX, viewerPanY, setViewerZoom, setViewerPan],
  );

  // Drag to pan
  const handleDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      const stage = e.target;
      if (stage !== stageRef.current) return;
      setViewerPan(stage.x(), stage.y());
    },
    [setViewerPan],
  );

  if (!currentPage || !imageSrc) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-text-tertiary">
        No page selected
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-full w-full">
      {stageSize.width > 0 && (
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
            <Rect width={effectiveW} height={effectiveH} fill="#FFFFFF" />
            <PageImage
              src={imageSrc}
              rotation={rotation}
              width={currentPage.width}
              height={currentPage.height}
            />
          </Layer>

          {/* Crop regions overlay */}
          <Layer>
            {pageSteps.map((step) => {
              const eff = imageToEffective(
                step.crop_x!,
                step.crop_y!,
                step.crop_w!,
                step.crop_h!,
                rotation,
                currentPage.width,
                currentPage.height,
              );
              const track = trackMap.get(step.track_id);
              const color = track?.color ?? "#4E7282";
              const isActive = step.id === activeStepId;
              const isCompleted = step.is_completed;

              return (
                <Group
                  key={step.id}
                  onClick={() => setActiveStep(step.id)}
                  listening
                >
                  <Rect
                    x={eff.x}
                    y={eff.y}
                    width={eff.width}
                    height={eff.height}
                    stroke={isCompleted ? "#5A9A5F" : color}
                    strokeWidth={(isActive ? 3 : 1.5) / viewerZoom}
                    fill={isActive ? `${color}15` : isCompleted ? "#5A9A5F08" : `${color}08`}
                    cornerRadius={2 / viewerZoom}
                  />
                  {/* Step label */}
                  <Text
                    x={eff.x + 3 / viewerZoom}
                    y={eff.y + 3 / viewerZoom}
                    text={step.title}
                    fontSize={11 / viewerZoom}
                    fill={isCompleted ? "#5A9A5F" : color}
                    fontStyle={isActive ? "bold" : "normal"}
                    listening={false}
                  />
                  {isCompleted && (
                    <Text
                      x={eff.x + eff.width - 16 / viewerZoom}
                      y={eff.y + 3 / viewerZoom}
                      text="✓"
                      fontSize={12 / viewerZoom}
                      fill="#5A9A5F"
                      listening={false}
                    />
                  )}
                </Group>
              );
            })}
          </Layer>
        </Stage>
      )}
    </div>
  );
}
