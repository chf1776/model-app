import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { Stage, Layer, Rect, Image as KonvaImage, Group } from "react-konva";
import useImage from "use-image";
import { Expand } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { convertFileSrc } from "@tauri-apps/api/core";
import { useAppStore } from "@/store";
import type { Step, InstructionPage } from "@/shared/types";
import { getEffectiveDimensions } from "./tree-utils";
import { imagePointToEffective } from "./CropLayer";
import { AnnotationLayer, DEFAULT_CHECKMARK_SIZE, DEFAULT_CROSS_SIZE, DEFAULT_OPACITY, HIGHLIGHT_COLOR } from "./AnnotationLayer";
import type { DrawPreview } from "./AnnotationLayer";
import { MIN_RELATIVE_ZOOM, MAX_RELATIVE_ZOOM } from "./zoom-utils";
import { useTheme } from "@/hooks/useTheme";
import type Konva from "konva";

const ZOOM_STEP = 1.08;
const PADDING = 48;

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
  const [drawState, setDrawState] = useState<DrawPreview | null>(null);
  const drawStateRef = useRef<DrawPreview | null>(null);
  drawStateRef.current = drawState;
  // Mutable accumulator for freehand points to avoid O(n²) spread on each mousemove
  const freehandPointsRef = useRef<number[]>([]);

  const steps = useAppStore((s) => s.steps);
  const activeStepId = useAppStore((s) => s.activeStepId);
  const currentSourcePages = useAppStore((s) => s.currentSourcePages);
  const viewerZoom = useAppStore((s) => s.viewerZoom);
  const viewerPanX = useAppStore((s) => s.viewerPanX);
  const viewerPanY = useAppStore((s) => s.viewerPanY);
  const setViewerZoom = useAppStore((s) => s.setViewerZoom);
  const setViewerPan = useAppStore((s) => s.setViewerPan);
  const fitToViewTrigger = useAppStore((s) => s.fitToViewTrigger);
  const annotationMode = useAppStore((s) => s.buildView.kind === "building-track" ? s.buildView.annotationMode : null);
  const annotationColor = useAppStore((s) => s.annotationColor);
  const addAnnotation = useAppStore((s) => s.addAnnotation);
  const annotationStrokeWidth = useAppStore((s) => s.annotationStrokeWidth);

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

  // Base zoom = the scale at which the crop fills the viewport (100%)
  const baseZoomRef = useRef(1);
  const computeBaseZoom = () => {
    if (!cropDims || stageSize.width === 0 || stageSize.height === 0) return 1;
    const scaleX = (stageSize.width - PADDING * 2) / effectiveW;
    const scaleY = (stageSize.height - PADDING * 2) / effectiveH;
    return Math.min(scaleX, scaleY);
  };

  // Fit to view (sets zoom to 1.0 = 100% = base zoom)
  const fitToViewRef = useRef(() => {});
  fitToViewRef.current = () => {
    const base = computeBaseZoom();
    baseZoomRef.current = base;
    setViewerZoom(1.0);
    setViewerPan(
      (stageSize.width - effectiveW * base) / 2,
      (stageSize.height - effectiveH * base) / 2,
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

  // Wheel zoom (viewerZoom is relative: 1.0 = 100% = fit-to-view)
  // Handles both scroll-wheel (discrete steps) and trackpad pinch (ctrlKey + smooth deltaY)
  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();
      const stage = stageRef.current;
      if (!stage) return;

      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const base = baseZoomRef.current;
      const oldAbsolute = viewerZoom * base;

      let newRelative: number;
      if (e.evt.ctrlKey) {
        // Trackpad pinch: ctrlKey is set, deltaY is continuous
        const zoomFactor = 1 - e.evt.deltaY * 0.01;
        newRelative = Math.max(
          MIN_RELATIVE_ZOOM,
          Math.min(MAX_RELATIVE_ZOOM, viewerZoom * zoomFactor),
        );
      } else {
        // Scroll wheel: discrete steps
        const direction = e.evt.deltaY < 0 ? 1 : -1;
        newRelative = Math.max(
          MIN_RELATIVE_ZOOM,
          Math.min(MAX_RELATIVE_ZOOM, viewerZoom * (direction > 0 ? ZOOM_STEP : 1 / ZOOM_STEP)),
        );
      }

      if (Math.abs(newRelative - viewerZoom) < 0.001) return;

      const newAbsolute = newRelative * base;
      const mousePointTo = {
        x: (pointer.x - viewerPanX) / oldAbsolute,
        y: (pointer.y - viewerPanY) / oldAbsolute,
      };

      setViewerZoom(newRelative);
      setViewerPan(
        pointer.x - mousePointTo.x * newAbsolute,
        pointer.y - mousePointTo.y * newAbsolute,
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

  // ── Annotation mouse handlers (on Stage so events always fire) ──────────

  const getPointerNorm = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const stage = e.target.getStage();
      if (!stage) return null;
      const pointer = stage.getPointerPosition();
      if (!pointer) return null;
      const absZoom = viewerZoom * baseZoomRef.current;
      const lx = (pointer.x - viewerPanX) / absZoom;
      const ly = (pointer.y - viewerPanY) / absZoom;
      return { nx: lx / effectiveW, ny: ly / effectiveH };
    },
    [viewerPanX, viewerPanY, viewerZoom, effectiveW, effectiveH],
  );

  const handleStageMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (!annotationMode || !step) return;
      const pt = getPointerNorm(e);
      if (!pt) return;
      const { nx, ny } = pt;

      if (annotationMode === "checkmark" || annotationMode === "cross") {
        setDrawState({ type: annotationMode, startX: nx, startY: ny, currentX: nx, currentY: ny });
        return;
      }

      if (annotationMode === "text") {
        setPendingText({ nx, ny });
        return;
      }

      if (annotationMode === "freehand") {
        freehandPointsRef.current = [nx, ny];
        setDrawState({ type: "freehand", startX: nx, startY: ny, points: freehandPointsRef.current });
        return;
      }

      if (annotationMode === "circle" || annotationMode === "arrow" || annotationMode === "highlight") {
        setDrawState({ type: annotationMode, startX: nx, startY: ny, currentX: nx, currentY: ny });
      }
    },
    [annotationMode, step, getPointerNorm],
  );

  const handleStageMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (!drawStateRef.current) return;
      const pt = getPointerNorm(e);
      if (!pt) return;
      const { nx, ny } = pt;

      if (drawStateRef.current.type === "freehand") {
        freehandPointsRef.current.push(nx, ny);
        // Trigger re-render with updated ref (same array identity, new state obj)
        setDrawState((prev) => prev ? { ...prev, points: freehandPointsRef.current } : null);
      } else {
        setDrawState((prev) => prev ? { ...prev, currentX: nx, currentY: ny } : null);
      }
    },
    [getPointerNorm],
  );

  const handleStageMouseUp = useCallback(() => {
    const ds = drawStateRef.current;
    if (!ds || !step) return;

    const base = {
      id: crypto.randomUUID(),
      color: annotationColor,
      strokeWidth: annotationStrokeWidth,
      opacity: DEFAULT_OPACITY,
    };

    if ((ds.type === "checkmark" || ds.type === "cross") && ds.currentX != null && ds.currentY != null) {
      const dragDist = Math.hypot(
        (ds.currentX - ds.startX) * effectiveW,
        (ds.currentY - ds.startY) * effectiveH,
      );
      // If dragged far enough, use drag distance as size; otherwise use default (no size = default in renderer)
      const minDim = Math.min(effectiveW, effectiveH);
      const defaultSize = ds.type === "checkmark" ? DEFAULT_CHECKMARK_SIZE * minDim : DEFAULT_CROSS_SIZE * minDim;
      const customSize = dragDist > defaultSize * 0.5 ? dragDist : undefined;
      addAnnotation(step.id, {
        ...base,
        type: ds.type,
        x: ds.startX,
        y: ds.startY,
        size: customSize,
      });
    }

    if (ds.type === "circle" && ds.currentX != null && ds.currentY != null) {
      const rx = Math.abs(ds.currentX - ds.startX) / 2;
      const ry = Math.abs(ds.currentY - ds.startY) / 2;
      if (rx > 0.002 || ry > 0.002) {
        addAnnotation(step.id, {
          ...base,
          type: "circle",
          x: (ds.startX + ds.currentX) / 2,
          y: (ds.startY + ds.currentY) / 2,
          rx,
          ry,
        });
      }
    }

    if (ds.type === "arrow" && ds.currentX != null && ds.currentY != null) {
      const dist = Math.hypot(ds.currentX - ds.startX, ds.currentY - ds.startY);
      if (dist > 0.005) {
        addAnnotation(step.id, {
          ...base,
          type: "arrow",
          x1: ds.startX,
          y1: ds.startY,
          x2: ds.currentX,
          y2: ds.currentY,
        });
      }
    }

    if (ds.type === "highlight" && ds.currentX != null && ds.currentY != null) {
      const w = Math.abs(ds.currentX - ds.startX);
      const h = Math.abs(ds.currentY - ds.startY);
      if (w > 0.002 || h > 0.002) {
        addAnnotation(step.id, {
          ...base,
          type: "highlight",
          x: Math.min(ds.startX, ds.currentX),
          y: Math.min(ds.startY, ds.currentY),
          w,
          h,
          opacity: 0.3,
          color: HIGHLIGHT_COLOR,
        });
      }
    }

    if (ds.type === "freehand" && freehandPointsRef.current.length > 4) {
      addAnnotation(step.id, {
        ...base,
        type: "freehand",
        points: [...freehandPointsRef.current],
      });
    }

    setDrawState(null);
  }, [step, annotationColor, annotationStrokeWidth, addAnnotation, effectiveW, effectiveH]);

  // ── Escape cancels mid-draw ─────────────────────────────────────────────

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && drawStateRef.current) {
        e.preventDefault();
        e.stopPropagation();
        setDrawState(null);
      }
    };
    window.addEventListener("keydown", handleEscape, true); // capture phase
    return () => window.removeEventListener("keydown", handleEscape, true);
  }, []);

  // ── Text annotation submit ──────────────────────────────────────────────

  const handleTextSubmit = useCallback(
    (text: string) => {
      if (pendingText && text.trim() && step) {
        addAnnotation(step.id, {
          id: crypto.randomUUID(),
          color: annotationColor,
          strokeWidth: annotationStrokeWidth,
          opacity: DEFAULT_OPACITY,
          type: "text",
          x: pendingText.nx,
          y: pendingText.ny,
          text: text.trim(),
          fontSize: 0.06,
        });
      }
      setPendingText(null);
    },
    [pendingText, step, addAnnotation, annotationColor, annotationStrokeWidth],
  );

  // Pre-parse polygon clip path (avoid JSON.parse inside Konva clipFunc which runs every draw cycle)
  const clipPolygonPts = useMemo(() => {
    if (!step?.clip_polygon) return null;
    return JSON.parse(step.clip_polygon) as { x: number; y: number }[];
  }, [step?.clip_polygon]);

  // ── Early returns (after all hooks) ─────────────────────────────────────

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

  const isDraggable = !annotationMode;
  const cursor = annotationMode === "text" ? "text"
    : annotationMode ? "crosshair"
    : "grab";
  const absoluteZoom = viewerZoom * baseZoomRef.current;

  return (
    <>
      <div ref={containerRef} className="relative h-full w-full overflow-hidden">
        {stageSize.width > 0 && imageSrc && (
          <Stage
            ref={stageRef}
            width={stageSize.width}
            height={stageSize.height}
            scaleX={absoluteZoom}
            scaleY={absoluteZoom}
            x={viewerPanX}
            y={viewerPanY}
            draggable={isDraggable}
            onWheel={handleWheel}
            onDragEnd={handleDragEnd}
            onMouseDown={handleStageMouseDown}
            onMouseMove={handleStageMouseMove}
            onMouseUp={handleStageMouseUp}
            style={{ cursor }}
          >
            <Layer>
              <Rect width={effectiveW} height={effectiveH} fill="#FFFFFF" />
              {clipPolygonPts && clipPolygonPts.length >= 3 ? (
                <Group
                  clipFunc={(ctx) => {
                    const cropX = step.crop_x!;
                    const cropY = step.crop_y!;
                    const cropW = step.crop_w!;
                    const cropH = step.crop_h!;
                    ctx.beginPath();
                    clipPolygonPts.forEach((pt, i) => {
                      const local = imagePointToEffective(
                        pt.x - cropX, pt.y - cropY, rotation, cropW, cropH,
                      );
                      if (i === 0) ctx.moveTo(local.x, local.y);
                      else ctx.lineTo(local.x, local.y);
                    });
                    ctx.closePath();
                  }}
                >
                  <CropImage
                    src={imageSrc}
                    cropX={step.crop_x!}
                    cropY={step.crop_y!}
                    cropW={step.crop_w!}
                    cropH={step.crop_h!}
                    rotation={rotation}
                  />
                </Group>
              ) : (
                <CropImage
                  src={imageSrc}
                  cropX={step.crop_x!}
                  cropY={step.crop_y!}
                  cropW={step.crop_w!}
                  cropH={step.crop_h!}
                  rotation={rotation}
                />
              )}
            </Layer>
            <AnnotationLayer
              stepId={step.id}
              effectiveW={effectiveW}
              effectiveH={effectiveH}
              zoom={absoluteZoom}
              drawPreview={drawState}
              previewColor={annotationColor}
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
  const { accent } = useTheme();

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
        ctx.strokeStyle = accent;
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
