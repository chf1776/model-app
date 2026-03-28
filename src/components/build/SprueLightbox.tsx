import { useRef, useEffect, useMemo, useState, useCallback } from "react";
import { X } from "lucide-react";
import { convertFileSrc } from "@tauri-apps/api/core";
import {
  Dialog,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppStore } from "@/store";
import { comparePartNumbers } from "@/shared/utils";
import type { SprueRef } from "@/shared/types";

interface SprueLightboxProps {
  sprueLabel: string;
  onClose: () => void;
}

export function SprueLightbox({ sprueLabel, onClose }: SprueLightboxProps) {
  const sprueRefs = useAppStore((s) => s.sprueRefs);
  const projectSprueParts = useAppStore((s) => s.projectSprueParts);
  const steps = useAppStore((s) => s.steps);
  const setActiveStep = useAppStore((s) => s.setActiveStep);
  const ref = sprueRefs.find((r) => r.label === sprueLabel);

  const parts = useMemo(() => {
    const sprueParts = projectSprueParts.filter((p) => p.sprue_label === sprueLabel);
    return sprueParts.sort((a, b) => comparePartNumbers(a.part_number, b.part_number));
  }, [projectSprueParts, sprueLabel]);

  const stepMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of steps) map.set(s.id, s.title);
    return map;
  }, [steps]);

  const handlePartClick = useCallback(
    (stepId: string) => {
      setActiveStep(stepId);
      onClose();
    },
    [setActiveStep, onClose],
  );

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogPortal>
        <DialogOverlay className="bg-black/70" />
        <div
          className="fixed inset-0 z-50 flex cursor-pointer items-center justify-center"
          onClick={onClose}
        >
          <DialogTitle className="sr-only">Sprue {sprueLabel}</DialogTitle>

          <div
            className="flex h-[80vh] w-[85vw] max-w-[1000px] cursor-default overflow-hidden rounded-lg bg-background shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
<div className="flex min-w-0 flex-1 items-center justify-center bg-black/[0.03]">
              {ref?.crop_x != null ? (
                <CropViewer sprueRef={ref} />
              ) : (
                <span className="text-sm text-text-tertiary">No crop image</span>
              )}
            </div>

<div className="flex w-[180px] shrink-0 flex-col border-l border-border">
<div className="flex items-center justify-between border-b border-border px-3 py-2">
                <div className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded"
                    style={{ backgroundColor: ref?.color ?? "#888" }}
                  />
                  <span className="text-sm font-semibold text-text-primary">
                    Sprue {sprueLabel}
                  </span>
                </div>
                <button
                  onClick={onClose}
                  className="flex h-6 w-6 items-center justify-center rounded text-text-tertiary hover:text-text-secondary"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

<div className="border-b border-border px-3 py-1.5">
                <span className="text-xs text-text-secondary">
                  {parts.length} part{parts.length !== 1 ? "s" : ""} tracked
                </span>
              </div>

<ScrollArea className="min-h-0 flex-1">
                <div className="flex flex-col py-1">
                  {parts.length === 0 ? (
                    <span className="px-3 py-2 text-xs text-text-tertiary">
                      No parts recorded
                    </span>
                  ) : (
                    parts.map((part) => {
                      const label = part.part_number
                        ? `${sprueLabel}${part.part_number}`
                        : sprueLabel;
                      const stepTitle = stepMap.get(part.step_id) ?? "Unknown step";
                      return (
                        <button
                          key={part.id}
                          onClick={() => handlePartClick(part.step_id)}
                          className="flex items-center gap-2 px-3 py-1 text-left hover:bg-sidebar"
                        >
                          <span className="text-[10px] text-success">&#10003;</span>
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-medium text-text-primary">
                              {label}
                            </span>
                            <p className="truncate text-[10px] text-text-tertiary">
                              {stepTitle}
                            </p>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>
      </DialogPortal>
    </Dialog>
  );
}

// ── Crop viewer with zoom/pan ─────────────────────────────────────────────────

function CropViewer({ sprueRef }: { sprueRef: SprueRef }) {
  const allPages = useAppStore((s) => s.allPages);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loaded, setLoaded] = useState(false);

  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const offset = useRef({ x: 0, y: 0 });
  const dragStart = useRef({ x: 0, y: 0 });
  const offsetStart = useRef({ x: 0, y: 0 });
  const [renderOffset, setRenderOffset] = useState({ x: 0, y: 0 });

  const page = sprueRef.source_page_id
    ? allPages[sprueRef.source_page_id]
    : undefined;

  useEffect(() => {
    if (!page || sprueRef.crop_x == null) return;

    let aborted = false;
    const img = new Image();

    img.onload = () => {
      if (aborted || !canvasRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const rotation = page.rotation ?? 0;
      const cropX = sprueRef.crop_x!;
      const cropY = sprueRef.crop_y!;
      const cropW = sprueRef.crop_w!;
      const cropH = sprueRef.crop_h!;

      const rad = (rotation * Math.PI) / 180;
      const cos = Math.abs(Math.cos(rad));
      const sin = Math.abs(Math.sin(rad));
      const effectiveW = cropW * cos + cropH * sin;
      const effectiveH = cropW * sin + cropH * cos;

      canvas.width = Math.round(effectiveW);
      canvas.height = Math.round(effectiveH);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(rad);
      ctx.drawImage(
        img, cropX, cropY, cropW, cropH,
        -cropW / 2, -cropH / 2,
        cropW, cropH,
      );
      ctx.restore();

      setLoaded(true);
    };

    img.onerror = () => {
      if (!aborted) setLoaded(false);
    };

    img.src = convertFileSrc(page.file_path);

    return () => {
      aborted = true;
      img.src = "";
    };
  }, [page, sprueRef.crop_x, sprueRef.crop_y, sprueRef.crop_w, sprueRef.crop_h]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.stopPropagation();
    setScale((prev) => Math.min(5, Math.max(0.5, prev - e.deltaY * 0.002)));
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    offsetStart.current = { ...offset.current };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    const newOffset = {
      x: offsetStart.current.x + (e.clientX - dragStart.current.x),
      y: offsetStart.current.y + (e.clientY - dragStart.current.y),
    };
    offset.current = newOffset;
    setRenderOffset(newOffset);
  }, [isDragging]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  return (
    <div
      className="flex h-full w-full items-center justify-center overflow-hidden"
      style={{ cursor: isDragging ? "grabbing" : "grab" }}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <canvas
        ref={canvasRef}
        className={loaded ? "max-h-full max-w-full" : "hidden"}
        style={{
          transform: `translate(${renderOffset.x}px, ${renderOffset.y}px) scale(${scale})`,
          transformOrigin: "center center",
        }}
      />
      {!loaded && <span className="text-sm text-text-tertiary">Loading...</span>}
    </div>
  );
}
