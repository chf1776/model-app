import { useRef, useEffect, useState } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { useAppStore } from "@/store";
import type { SprueRef } from "@/shared/types";

interface SprueCropThumbProps {
  sprueRef: SprueRef;
  width: number;
  height: number;
  className?: string;
  fallback?: React.ReactNode;
}

export function SprueCropThumb({
  sprueRef,
  width,
  height,
  className,
  fallback,
}: SprueCropThumbProps) {
  const allPages = useAppStore((s) => s.allPages);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasImage, setHasImage] = useState(false);

  const page = sprueRef.source_page_id
    ? allPages[sprueRef.source_page_id]
    : undefined;

  useEffect(() => {
    if (!page || sprueRef.crop_x == null) {
      setHasImage(false);
      return;
    }

    let aborted = false;
    const img = new Image();

    img.onload = () => {
      if (aborted || !canvasRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      setHasImage(true);

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

      const dpr = window.devicePixelRatio || 1;
      const scale = Math.min(width / effectiveW, height / effectiveH);
      const drawW = Math.round(effectiveW * scale);
      const drawH = Math.round(effectiveH * scale);

      canvas.width = drawW * dpr;
      canvas.height = drawH * dpr;
      canvas.style.width = `${drawW}px`;
      canvas.style.height = `${drawH}px`;
      ctx.scale(dpr, dpr);
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
      if (!aborted) setHasImage(false);
    };

    img.src = convertFileSrc(page.file_path);

    return () => {
      aborted = true;
      img.src = "";
    };
  }, [page, sprueRef.crop_x, sprueRef.crop_y, sprueRef.crop_w, sprueRef.crop_h, width, height]);

  return (
    <>
      <canvas
        ref={canvasRef}
        className={hasImage ? (className ?? "") : "hidden"}
      />
      {!hasImage && fallback}
    </>
  );
}
