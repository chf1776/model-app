import { useRef, useEffect, useState } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { useAppStore } from "@/store";
import type { Step, InstructionPage } from "@/shared/types";
import { getEffectiveDimensions } from "./tree-utils";
import { drawAnnotationsOnCanvas } from "./annotation-draw";

const THUMB_H = 36;

// Shared image cache: avoids loading the same page image N times for N thumbnails
const imageCache = new Map<string, HTMLImageElement>();

function loadPageImage(filePath: string): Promise<HTMLImageElement> {
  const cached = imageCache.get(filePath);
  if (cached?.complete) return Promise.resolve(cached);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      imageCache.set(filePath, img);
      resolve(img);
    };
    img.onerror = reject;
    img.src = convertFileSrc(filePath);
  });
}

interface StepThumbnailProps {
  step: Step;
  page: InstructionPage | undefined;
  isActive: boolean;
  isCompleted: boolean;
}

export function StepThumbnail({ step, page, isActive, isCompleted }: StepThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState({ w: THUMB_H, h: THUMB_H });
  const annotations = useAppStore((s) => s.stepAnnotations[step.id]);

  const hasCrop =
    step.crop_x != null &&
    step.crop_y != null &&
    step.crop_w != null &&
    step.crop_h != null;

  useEffect(() => {
    if (!page || !hasCrop) return;

    let aborted = false;

    loadPageImage(page.file_path).then((img) => {
      if (aborted || !canvasRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const cropX = step.crop_x!;
      const cropY = step.crop_y!;
      const cropW = step.crop_w!;
      const cropH = step.crop_h!;

      const { effectiveW, effectiveH, rad } = getEffectiveDimensions(cropW, cropH, page.rotation ?? 0);

      const scale = THUMB_H / effectiveH;
      const drawW = Math.round(effectiveW * scale);
      const drawH = THUMB_H;

      canvas.width = drawW;
      canvas.height = drawH;
      setSize({ w: drawW, h: drawH });

      ctx.clearRect(0, 0, drawW, drawH);
      ctx.save();
      ctx.translate(drawW / 2, drawH / 2);
      ctx.rotate(rad);
      ctx.drawImage(
        img,
        cropX, cropY, cropW, cropH,
        (-cropW * scale) / 2,
        (-cropH * scale) / 2,
        cropW * scale,
        cropH * scale,
      );
      ctx.restore();

      // Draw annotations on top
      if (annotations?.length) {
        drawAnnotationsOnCanvas(ctx, annotations, drawW, drawH);
      }
    });

    return () => { aborted = true; };
  }, [page, hasCrop, step.crop_x, step.crop_y, step.crop_w, step.crop_h, annotations]);

  if (!hasCrop || !page) {
    return (
      <div
        className="flex items-center justify-center rounded bg-black/[0.03] text-[8px] text-text-tertiary"
        style={{ width: THUMB_H, height: THUMB_H }}
      >
        No crop
      </div>
    );
  }

  return (
    <div
      className="relative shrink-0 overflow-hidden rounded"
      style={{
        width: size.w,
        height: size.h,
        opacity: isCompleted ? 0.45 : 1,
        outline: isActive ? "1.5px solid var(--color-accent)" : "1px solid var(--color-border)",
        boxShadow: isActive ? "0 0 4px var(--color-accent)/30" : undefined,
      }}
    >
      <canvas ref={canvasRef} className="block" />
      {step.clip_polygon && (
        <div
          className="absolute bottom-0 right-0 flex h-3 w-3 items-center justify-center rounded-tl bg-accent/80"
          title="Polygon crop"
        >
          <svg viewBox="0 0 10 10" className="h-2 w-2 text-white" fill="currentColor">
            <polygon points="5,0 10,4 8,10 2,10 0,4" />
          </svg>
        </div>
      )}
    </div>
  );
}
