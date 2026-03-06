import { useRef, useEffect, useState, useCallback } from "react";
import { Expand } from "lucide-react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { useAppStore } from "@/store";
import type { Step, InstructionPage } from "@/shared/types";

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 5.0;
const ZOOM_STEP = 1.08;
const PADDING = 24;

export function CropCanvas() {
  const steps = useAppStore((s) => s.steps);
  const activeStepId = useAppStore((s) => s.activeStepId);
  const currentSourcePages = useAppStore((s) => s.currentSourcePages);
  const viewerZoom = useAppStore((s) => s.viewerZoom);
  const setViewerZoom = useAppStore((s) => s.setViewerZoom);
  const viewerPanX = useAppStore((s) => s.viewerPanX);
  const viewerPanY = useAppStore((s) => s.viewerPanY);
  const setViewerPan = useAppStore((s) => s.setViewerPan);
  const fitToViewTrigger = useAppStore((s) => s.fitToViewTrigger);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [showFullPage, setShowFullPage] = useState(false);

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

  // Observe container size
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setContainerSize({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Compute effective crop dimensions
  const getCropDimensions = useCallback(() => {
    if (!step || !hasCrop || !page) return null;
    const rotation = page.rotation ?? 0;
    const cropW = step.crop_w!;
    const cropH = step.crop_h!;
    const rad = (rotation * Math.PI) / 180;
    const cos = Math.abs(Math.cos(rad));
    const sin = Math.abs(Math.sin(rad));
    return {
      effectiveW: cropW * cos + cropH * sin,
      effectiveH: cropW * sin + cropH * cos,
      cropX: step.crop_x!,
      cropY: step.crop_y!,
      cropW,
      cropH,
      rotation,
    };
  }, [step, hasCrop, page]);

  // Fit crop to view
  const fitToView = useCallback(() => {
    const dims = getCropDimensions();
    if (!dims || containerSize.w === 0 || containerSize.h === 0) return;
    const { effectiveW, effectiveH } = dims;
    const scaleX = (containerSize.w - PADDING * 2) / effectiveW;
    const scaleY = (containerSize.h - PADDING * 2) / effectiveH;
    const zoom = Math.min(scaleX, scaleY, 2.0);
    setViewerZoom(zoom);
    setViewerPan(
      (containerSize.w - effectiveW * zoom) / 2,
      (containerSize.h - effectiveH * zoom) / 2,
    );
  }, [getCropDimensions, containerSize, setViewerZoom, setViewerPan]);

  // Load image when step/page changes
  useEffect(() => {
    if (!page) {
      setImageLoaded(false);
      return;
    }
    setImageLoaded(false);
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setImageLoaded(true);
    };
    img.src = convertFileSrc(page.file_path);
    return () => { img.src = ""; };
  }, [page?.id, page?.file_path]);

  // Auto-fit on step change or container resize
  useEffect(() => {
    if (imageLoaded) fitToView();
  }, [activeStepId, imageLoaded, containerSize.w, containerSize.h, fitToViewTrigger]);

  // Draw crop on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    const dims = getCropDimensions();
    if (!canvas || !img || !dims) return;

    const { effectiveW, effectiveH, cropX, cropY, cropW, cropH, rotation } = dims;
    const drawW = Math.round(effectiveW * viewerZoom);
    const drawH = Math.round(effectiveH * viewerZoom);

    canvas.width = drawW;
    canvas.height = drawH;
    canvas.style.transform = `translate(${viewerPanX}px, ${viewerPanY}px)`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, drawW, drawH);
    ctx.save();
    ctx.translate(drawW / 2, drawH / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.drawImage(
      img,
      cropX, cropY, cropW, cropH,
      (-cropW * viewerZoom) / 2,
      (-cropH * viewerZoom) / 2,
      cropW * viewerZoom,
      cropH * viewerZoom,
    );
    ctx.restore();
  }, [imageLoaded, viewerZoom, viewerPanX, viewerPanY, getCropDimensions]);

  // Wheel zoom
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP;
      const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, viewerZoom * factor));
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const ratio = newZoom / viewerZoom;
      setViewerZoom(newZoom);
      setViewerPan(
        mx - (mx - viewerPanX) * ratio,
        my - (my - viewerPanY) * ratio,
      );
    },
    [viewerZoom, viewerPanX, viewerPanY, setViewerZoom, setViewerPan],
  );

  // Drag to pan
  const dragState = useRef<{ startX: number; startY: number; panX: number; panY: number } | null>(null);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      dragState.current = { startX: e.clientX, startY: e.clientY, panX: viewerPanX, panY: viewerPanY };
    },
    [viewerPanX, viewerPanY],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragState.current) return;
      const dx = e.clientX - dragState.current.startX;
      const dy = e.clientY - dragState.current.startY;
      setViewerPan(dragState.current.panX + dx, dragState.current.panY + dy);
    },
    [setViewerPan],
  );

  const handleMouseUp = useCallback(() => {
    dragState.current = null;
  }, []);

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

  return (
    <>
      <div
        ref={containerRef}
        className="relative h-full w-full cursor-grab overflow-hidden active:cursor-grabbing"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <canvas ref={canvasRef} className="absolute left-0 top-0" />

        {/* Show Full Page button */}
        <button
          onClick={() => setShowFullPage(true)}
          className="absolute right-2 top-2 rounded bg-black/40 p-1.5 text-white/80 hover:bg-black/60 hover:text-white"
          title="Show full page"
        >
          <Expand className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Full page modal */}
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
      const rad = (rotation * Math.PI) / 180;
      const cos = Math.abs(Math.cos(rad));
      const sin = Math.abs(Math.sin(rad));
      const effW = page.width * cos + page.height * sin;
      const effH = page.width * sin + page.height * cos;

      // Fit to 90% of viewport
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

      // Draw crop highlight
      if (step.crop_x != null && step.crop_y != null && step.crop_w != null && step.crop_h != null) {
        ctx.save();
        ctx.translate(drawW / 2, drawH / 2);
        ctx.rotate(rad);
        const cx = (step.crop_x - page.width / 2) * scale;
        const cy = (step.crop_y - page.height / 2) * scale;
        const cw = step.crop_w * scale;
        const ch = step.crop_h * scale;
        ctx.strokeStyle = "var(--color-accent)";
        ctx.lineWidth = 2;
        ctx.strokeRect(cx, cy, cw, ch);
        // Dim everything outside
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
