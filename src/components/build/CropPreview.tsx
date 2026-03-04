import { useRef, useEffect, useState } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { useAppStore } from "@/store";
import { Skeleton } from "@/components/ui/skeleton";
import type { Step } from "@/shared/types";

const CONTAINER_W = 196;
const CONTAINER_H = 96;

interface CropPreviewProps {
  step: Step;
}

export function CropPreview({ step }: CropPreviewProps) {
  const currentSourcePages = useAppStore((s) => s.currentSourcePages);
  const setActiveStep = useAppStore((s) => s.setActiveStep);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [hasImage, setHasImage] = useState(false);

  const hasCrop =
    step.crop_x != null &&
    step.crop_y != null &&
    step.crop_w != null &&
    step.crop_h != null;

  const pageIndex = step.source_page_id
    ? currentSourcePages.findIndex((p) => p.id === step.source_page_id)
    : -1;
  const page = pageIndex >= 0 ? currentSourcePages[pageIndex] : undefined;

  useEffect(() => {
    if (!page || !hasCrop) {
      setLoading(false);
      setHasImage(false);
      return;
    }
    setLoading(true);

    let aborted = false;
    const img = new Image();

    img.onload = () => {
      if (aborted || !canvasRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      setLoading(false);
      setHasImage(true);

      const rotation = page.rotation ?? 0;
      const cropX = step.crop_x!;
      const cropY = step.crop_y!;
      const cropW = step.crop_w!;
      const cropH = step.crop_h!;

      // Compute effective crop dimensions after rotation
      const rad = (rotation * Math.PI) / 180;
      const cos = Math.abs(Math.cos(rad));
      const sin = Math.abs(Math.sin(rad));
      const effectiveW = cropW * cos + cropH * sin;
      const effectiveH = cropW * sin + cropH * cos;

      // Scale to fit container
      const scale = Math.min(CONTAINER_W / effectiveW, CONTAINER_H / effectiveH);
      const drawW = Math.round(effectiveW * scale);
      const drawH = Math.round(effectiveH * scale);

      canvas.width = drawW;
      canvas.height = drawH;
      ctx.clearRect(0, 0, drawW, drawH);

      ctx.save();
      ctx.translate(drawW / 2, drawH / 2);
      ctx.rotate(rad);
      ctx.drawImage(
        img,
        cropX,
        cropY,
        cropW,
        cropH,
        (-cropW * scale) / 2,
        (-cropH * scale) / 2,
        cropW * scale,
        cropH * scale,
      );
      ctx.restore();
    };

    img.onerror = () => {
      if (aborted) return;
      setLoading(false);
      setHasImage(false);
    };

    img.src = convertFileSrc(page.file_path);

    return () => {
      aborted = true;
      img.src = "";
    };
  }, [page, hasCrop, step.crop_x, step.crop_y, step.crop_w, step.crop_h]);

  if (!hasCrop || !page) {
    return (
      <div className="flex h-24 items-center justify-center rounded border border-dashed border-border bg-black/[0.02]">
        <span className="text-[10px] text-text-tertiary">No crop region</span>
      </div>
    );
  }

  return (
    <div
      onClick={() => setActiveStep(step.id)}
      className="relative flex h-24 cursor-pointer items-center justify-center rounded border border-border bg-black/[0.02] overflow-hidden"
    >
      {loading && <Skeleton className="absolute inset-0" />}
      <canvas
        ref={canvasRef}
        className={loading ? "invisible" : ""}
      />
      {hasImage && pageIndex >= 0 && (
        <span className="absolute bottom-1 right-1 rounded bg-black/40 px-1 py-0.5 text-[9px] text-white">
          Page {pageIndex + 1}
        </span>
      )}
    </div>
  );
}
