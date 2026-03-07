import { useRef, useEffect, useState, useCallback } from "react";
import { Stage, Layer, Rect, Image as KonvaImage } from "react-konva";
import useImage from "use-image";
import { Expand } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { convertFileSrc } from "@tauri-apps/api/core";
import { useAppStore } from "@/store";
import type { Step, InstructionPage } from "@/shared/types";
import { getEffectiveDimensions } from "./tree-utils";
import { AnnotationLayer } from "./AnnotationLayer";
import type Konva from "konva";

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 5.0;
const ZOOM_STEP = 1.08;
const PADDING = 24;
const ACCENT_COLOR = "#4E7282";

function CropImage({
  src,
  cropX,
  cropY,
  cropW,
  cropH,
  rotation,
}: {
  src: string;
  cropX: number;
  cropY: number;
  cropW: number;
  cropH: number;
  rotation: number;
}) {
  const [image] = useImage(src, "anonymous");
  if (!image) return null;

  const offsetX = cropW / 2;
  const offsetY = cropH / 2;
  const isSwapped = rotation === 90 || rotation === 270;
  const x = isSwapped ? cropH / 2 : cropW / 2;
  const y = isSwapped ? cropW / 2 : cropH / 2;

  return (
    <KonvaImage
      image={image}
      crop={{ x: cropX, y: cropY, width: cropW, height: cropH }}
      width={cropW}
      height={cropH}
      rotation={rotation}
      offsetX={offsetX}
      offsetY={offsetY}
      x={x}
      y={y}
    />
  );
}

export function CropCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const [showFullPage, setShowFullPage] = useState(false);
  const [pendingText, setPendingText] = useState<{ nx: number; ny: number } | null>(null);

  const steps = useAppStore((s) => s.steps);
  const activeStepId = useAppStore((s) => s.activeStepId);
  const currentSourcePages = useAppStore((s) => s.currentSourcePages);
  const viewerZoom = useAppStore((s) => s.viewerZoom);
  const viewerPanX = useAppStore((s) => s.viewerPanX);
  const viewerPanY = useAppStore((s) => s.viewerPanY);
  const setViewerZoom = useAppStore((s) => s.setViewerZoom);
  const setViewerPan = useAppStore((s) => s.setViewerPan);
  const fitToViewTrigger = useAppStore((s) => s.fitToViewTrigger);
  const annotationMode = useAppStore((s) => s.annotationMode);
  const annotationColor = useAppStore((s) => s.annotationColor);
  const addAnnotation = useAppStore((s) => s.addAnnotation);

  const step = activeStepId ? steps.find((s) => s.id === activeStepId) ?? null : null;
  const page = step?.source_page_id
    ? currentSourcePages.find((p) => p.id === step.source_page_id) ?? null
    : null;

  const hasCrop =
    step != null &&
    step.crop_x != null &&
    step.crop_y != null &&
    step.crop_w != null &&
    step.crop_h != null;

  const imageSrc = page ? convertFileSrc(page.file_path) : null;
  const rotation = page?.rotation ?? 0;

  // Effective dimensions
  const cropDims = hasCrop && step
    ? getEffectiveDimensions(step.crop_w!, step.crop_h!, rotation)
    : null;
  const effectiveW = cropDims?.effectiveW ?? 0;
  const effectiveH = cropDims?.effectiveH ?? 0;

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
    if (!cropDims || stageSize.width === 0 || stageSize.height === 0) return;
    const scaleX = (stageSize.width - PADDING * 2) / effectiveW;
    const scaleY = (stageSize.height - PADDING * 2) / effectiveH;
    const zoom = Math.min(scaleX, scaleY, 2.0);
    setViewerZoom(zoom);
    setViewerPan(
      (stageSize.width - effectiveW * zoom) / 2,
      (stageSize.height - effectiveH * zoom) / 2,
    );
  };

  // Auto-fit on step change
  useEffect(() => {
    if (hasCrop && page) fitToViewRef.current();
  }, [activeStepId, hasCrop, page?.id, stageSize.width, stageSize.height]); // eslint-disable-line react-hooks/exhaustive-deps

  // Respond to explicit fit-to-view requests
  useEffect(() => {
    if (fitToViewTrigger > 0) fitToViewRef.current();
  }, [fitToViewTrigger]);

  // Wheel zoom
  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();
      const stage = stageRef.current;
      if (!stage) return;

      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const direction = e.evt.deltaY < 0 ? 1 : -1;
      const newZoom = Math.max(
        MIN_ZOOM,
        Math.min(MAX_ZOOM, viewerZoom * (direction > 0 ? ZOOM_STEP : 1 / ZOOM_STEP)),
      );

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

  if (!step) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-text-tertiary">
        Select a step to view
      </div>
    );
  }

  if (!hasCrop || !page) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-text-tertiary">
        <p className="text-sm font-medium">{step.title}</p>
        <p className="text-xs">No crop region defined</p>
      </div>
    );
  }

  const handleRequestTextInput = useCallback(
    (nx: number, ny: number) => setPendingText({ nx, ny }),
    [],
  );

  const handleTextSubmit = useCallback(
    (text: string) => {
      if (pendingText && text.trim() && step) {
        addAnnotation(step.id, {
          id: crypto.randomUUID(),
          color: annotationColor,
          strokeWidth: 0.003,
          opacity: 0.9,
          type: "text",
          x: pendingText.nx,
          y: pendingText.ny,
          text: text.trim(),
          fontSize: 0.02,
        });
      }
      setPendingText(null);
    },
    [pendingText, step, addAnnotation, annotationColor],
  );

  const isDraggable = !annotationMode;
  const cursor = annotationMode ? "crosshair" : "grab";

  return (
    <>
      <div ref={containerRef} className="relative h-full w-full overflow-hidden">
        {stageSize.width > 0 && imageSrc && (
          <Stage
            ref={stageRef}
            width={stageSize.width}
            height={stageSize.height}
            scaleX={viewerZoom}
            scaleY={viewerZoom}
            x={viewerPanX}
            y={viewerPanY}
            draggable={isDraggable}
            onWheel={handleWheel}
            onDragEnd={handleDragEnd}
            style={{ cursor }}
          >
            <Layer>
              <Rect width={effectiveW} height={effectiveH} fill="#FFFFFF" />
              <CropImage
                src={imageSrc}
                cropX={step.crop_x!}
                cropY={step.crop_y!}
                cropW={step.crop_w!}
                cropH={step.crop_h!}
                rotation={rotation}
              />
            </Layer>
            <AnnotationLayer
              stepId={step.id}
              effectiveW={effectiveW}
              effectiveH={effectiveH}
              zoom={viewerZoom}
              onRequestTextInput={handleRequestTextInput}
            />
          </Stage>
        )}

        {/* Text annotation input */}
        {pendingText && (
          <div className="absolute left-1/2 top-2 z-20 -translate-x-1/2">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const input = e.currentTarget.querySelector("input");
                handleTextSubmit(input?.value ?? "");
              }}
              className="flex items-center gap-1 rounded-lg border border-border bg-background/95 px-2 py-1 shadow-md backdrop-blur-sm"
            >
              <input
                autoFocus
                type="text"
                placeholder="Enter text..."
                className="w-40 bg-transparent text-xs text-text-primary outline-none"
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    e.stopPropagation();
                    setPendingText(null);
                  }
                }}
              />
              <button type="submit" className="rounded bg-accent px-2 py-0.5 text-[10px] text-white hover:bg-accent-hover">
                Add
              </button>
            </form>
          </div>
        )}

        {/* Show Full Page button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setShowFullPage(true)}
              className="absolute right-2 top-2 rounded bg-black/40 p-1.5 text-white/80 hover:bg-black/60 hover:text-white"
            >
              <Expand className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" sideOffset={6}>
            Show full page
          </TooltipContent>
        </Tooltip>
      </div>

      {showFullPage && page && (
        <FullPageModal
          page={page}
          step={step}
          onClose={() => setShowFullPage(false)}
        />
      )}
    </>
  );
}

// ── Full Page Modal ─────────────────────────────────────────────────────────

function FullPageModal({
  page,
  step,
  onClose,
}: {
  page: InstructionPage;
  step: Step;
  onClose: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const rotation = page.rotation ?? 0;
      const { effectiveW: effW, effectiveH: effH, rad } = getEffectiveDimensions(
        page.width, page.height, rotation,
      );

      const maxW = window.innerWidth * 0.9;
      const maxH = window.innerHeight * 0.9;
      const scale = Math.min(maxW / effW, maxH / effH, 1);
      const drawW = Math.round(effW * scale);
      const drawH = Math.round(effH * scale);

      canvas.width = drawW;
      canvas.height = drawH;

      ctx.save();
      ctx.translate(drawW / 2, drawH / 2);
      ctx.rotate(rad);
      ctx.drawImage(
        img,
        0, 0, page.width, page.height,
        (-page.width * scale) / 2,
        (-page.height * scale) / 2,
        page.width * scale,
        page.height * scale,
      );
      ctx.restore();

      if (step.crop_x != null && step.crop_y != null && step.crop_w != null && step.crop_h != null) {
        ctx.save();
        ctx.translate(drawW / 2, drawH / 2);
        ctx.rotate(rad);
        const cx = (step.crop_x - page.width / 2) * scale;
        const cy = (step.crop_y - page.height / 2) * scale;
        const cw = step.crop_w * scale;
        const ch = step.crop_h * scale;
        ctx.strokeStyle = ACCENT_COLOR;
        ctx.lineWidth = 2;
        ctx.strokeRect(cx, cy, cw, ch);
        ctx.fillStyle = "rgba(0,0,0,0.3)";
        const hw = (page.width * scale) / 2;
        const hh = (page.height * scale) / 2;
        ctx.beginPath();
        ctx.rect(-hw, -hh, page.width * scale, page.height * scale);
        ctx.rect(cx, cy, cw, ch);
        ctx.fill("evenodd");
        ctx.restore();
      }
    };
    img.src = convertFileSrc(page.file_path);
  }, [page, step]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={onClose}
    >
      <canvas
        ref={canvasRef}
        onClick={(e) => e.stopPropagation()}
        className="rounded shadow-2xl"
      />
    </div>
  );
}
