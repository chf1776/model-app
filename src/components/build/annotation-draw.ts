import type { Annotation } from "@/shared/types";
import { DEFAULT_CHECKMARK_SIZE, DEFAULT_CROSS_SIZE, CHECKMARK_STROKE_RATIO } from "./AnnotationLayer";

export function drawAnnotationsOnCanvas(
  ctx: CanvasRenderingContext2D,
  annotations: Annotation[],
  canvasW: number,
  canvasH: number,
): void {
  for (const ann of annotations) {
    ctx.save();
    ctx.globalAlpha = ann.opacity;
    ctx.strokeStyle = ann.color;
    ctx.fillStyle = ann.color;
    ctx.lineWidth = Math.max(ann.strokeWidth * canvasW, 1);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    switch (ann.type) {
      case "checkmark": {
        const savedLw = ctx.lineWidth;
        const cmSize = ann.size ?? DEFAULT_CHECKMARK_SIZE * Math.min(canvasW, canvasH);
        ctx.lineWidth = cmSize * CHECKMARK_STROKE_RATIO;
        drawCheckmark(ctx, ann.x * canvasW, ann.y * canvasH, cmSize);
        ctx.lineWidth = savedLw;
        break;
      }
      case "circle":
        drawCircle(ctx, ann.x * canvasW, ann.y * canvasH, ann.rx * canvasW, ann.ry * canvasH);
        break;
      case "arrow":
        drawArrow(ctx, ann.x1 * canvasW, ann.y1 * canvasH, ann.x2 * canvasW, ann.y2 * canvasH);
        break;
      case "cross":
        drawCross(ctx, ann.x * canvasW, ann.y * canvasH, ann.size ?? DEFAULT_CROSS_SIZE * Math.min(canvasW, canvasH));
        break;
      case "highlight":
        drawHighlight(ctx, ann.x * canvasW, ann.y * canvasH, ann.w * canvasW, ann.h * canvasH);
        break;
      case "freehand":
        drawFreehand(ctx, ann.points, canvasW, canvasH);
        break;
      case "text":
        drawText(ctx, ann.x * canvasW, ann.y * canvasH, ann.text, ann.fontSize * canvasH);
        break;
    }
    ctx.restore();
  }
}

function drawCheckmark(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  ctx.beginPath();
  ctx.moveTo(cx - size * 0.4, cy);
  ctx.lineTo(cx - size * 0.1, cy + size * 0.4);
  ctx.lineTo(cx + size * 0.5, cy - size * 0.4);
  ctx.stroke();
}

function drawCircle(ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number) {
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.stroke();
}

function drawArrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) {
  const headLen = 6;
  const angle = Math.atan2(y2 - y1, x2 - x1);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
}

function drawCross(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  ctx.beginPath();
  ctx.moveTo(cx - size * 0.5, cy - size * 0.5);
  ctx.lineTo(cx + size * 0.5, cy + size * 0.5);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + size * 0.5, cy - size * 0.5);
  ctx.lineTo(cx - size * 0.5, cy + size * 0.5);
  ctx.stroke();
}

function drawHighlight(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.fillRect(x, y, w, h);
}

function drawFreehand(ctx: CanvasRenderingContext2D, points: number[], cw: number, ch: number) {
  if (points.length < 4) return;
  ctx.beginPath();
  ctx.moveTo(points[0] * cw, points[1] * ch);
  for (let i = 2; i < points.length; i += 2) {
    ctx.lineTo(points[i] * cw, points[i + 1] * ch);
  }
  ctx.stroke();
}

function drawText(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, fontSize: number) {
  ctx.font = `bold ${Math.max(fontSize, 8)}px sans-serif`;
  ctx.fillText(text, x, y + fontSize);
}
