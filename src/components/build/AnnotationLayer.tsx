import { useState, useEffect } from "react";
import { Layer, Line, Ellipse, Arrow, Rect, Text, Group } from "react-konva";
import { useAppStore } from "@/store";
import type { Annotation } from "@/shared/types";

const EMPTY_ANNOTATIONS: Annotation[] = [];

export interface DrawPreview {
  type: "checkmark" | "cross" | "circle" | "arrow" | "highlight" | "freehand";
  startX: number;
  startY: number;
  points?: number[];
  currentX?: number;
  currentY?: number;
}

interface AnnotationLayerProps {
  stepId: string;
  effectiveW: number;
  effectiveH: number;
  zoom: number;
  drawPreview?: DrawPreview | null;
  previewColor?: string;
}

export const DEFAULT_CHECKMARK_SIZE = 0.06;
export const DEFAULT_CROSS_SIZE = 0.05;
export const DEFAULT_STROKE_WIDTH = 0.003;
export const DEFAULT_OPACITY = 0.9;
export const HIGHLIGHT_COLOR = "#facc15";
const SELECTION_COLOR = "#4E7282";

function toLayerX(nx: number, w: number) { return nx * w; }
function toLayerY(ny: number, h: number) { return ny * h; }

export function AnnotationLayer({ stepId, effectiveW, effectiveH, zoom, drawPreview, previewColor }: AnnotationLayerProps) {
  const annotations = useAppStore((s) => s.stepAnnotations[stepId] ?? EMPTY_ANNOTATIONS);
  const annotationMode = useAppStore((s) => s.annotationMode);
  const removeAnnotation = useAppStore((s) => s.removeAnnotation);

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleAnnotationClick = (id: string) => {
    if (annotationMode) return;
    setSelectedId(selectedId === id ? null : id);
  };

  // Handle delete key for selected annotation
  useEffect(() => {
    if (!selectedId) return;
    const listener = (e: KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        e.stopPropagation();
        removeAnnotation(stepId, selectedId);
        setSelectedId(null);
      }
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [selectedId, stepId, removeAnnotation]);

  const strokeScale = 1 / zoom;
  const color = previewColor ?? "#ef4444";

  return (
    <Layer>
      {/* Render existing annotations */}
      {annotations.map((ann) => (
        <AnnotationShape
          key={ann.id}
          annotation={ann}
          effectiveW={effectiveW}
          effectiveH={effectiveH}
          strokeScale={strokeScale}
          isSelected={ann.id === selectedId}
          onClick={() => handleAnnotationClick(ann.id)}
        />
      ))}

      {/* Drawing preview — checkmark/cross drag-to-size */}
      {drawPreview && drawPreview.type === "checkmark" && drawPreview.currentX != null && drawPreview.currentY != null && (() => {
        const dragDist = Math.hypot(
          (drawPreview.currentX! - drawPreview.startX) * effectiveW,
          (drawPreview.currentY! - drawPreview.startY) * effectiveH,
        );
        const size = Math.max(dragDist, DEFAULT_CHECKMARK_SIZE * Math.min(effectiveW, effectiveH));
        const cx = toLayerX(drawPreview.startX, effectiveW);
        const cy = toLayerY(drawPreview.startY, effectiveH);
        return (
          <Line
            points={[
              cx - size * 0.4, cy,
              cx - size * 0.1, cy + size * 0.4,
              cx + size * 0.5, cy - size * 0.4,
            ]}
            stroke={color}
            strokeWidth={3 * strokeScale}
            lineCap="round"
            lineJoin="round"
            opacity={0.6}
            dash={[6 * strokeScale, 4 * strokeScale]}
            listening={false}
          />
        );
      })()}
      {drawPreview && drawPreview.type === "cross" && drawPreview.currentX != null && drawPreview.currentY != null && (() => {
        const dragDist = Math.hypot(
          (drawPreview.currentX! - drawPreview.startX) * effectiveW,
          (drawPreview.currentY! - drawPreview.startY) * effectiveH,
        );
        const size = Math.max(dragDist, DEFAULT_CROSS_SIZE * Math.min(effectiveW, effectiveH));
        const cx = toLayerX(drawPreview.startX, effectiveW);
        const cy = toLayerY(drawPreview.startY, effectiveH);
        return (
          <Group listening={false}>
            <Line
              points={[cx - size * 0.5, cy - size * 0.5, cx + size * 0.5, cy + size * 0.5]}
              stroke={color}
              strokeWidth={3 * strokeScale}
              lineCap="round"
              opacity={0.6}
              dash={[6 * strokeScale, 4 * strokeScale]}
            />
            <Line
              points={[cx + size * 0.5, cy - size * 0.5, cx - size * 0.5, cy + size * 0.5]}
              stroke={color}
              strokeWidth={3 * strokeScale}
              lineCap="round"
              opacity={0.6}
              dash={[6 * strokeScale, 4 * strokeScale]}
            />
          </Group>
        );
      })()}
      {drawPreview && drawPreview.type === "circle" && drawPreview.currentX != null && drawPreview.currentY != null && (
        <Ellipse
          x={toLayerX((drawPreview.startX + drawPreview.currentX) / 2, effectiveW)}
          y={toLayerY((drawPreview.startY + drawPreview.currentY) / 2, effectiveH)}
          radiusX={Math.abs(drawPreview.currentX - drawPreview.startX) / 2 * effectiveW}
          radiusY={Math.abs(drawPreview.currentY - drawPreview.startY) / 2 * effectiveH}
          stroke={color}
          strokeWidth={3 * strokeScale}
          dash={[6 * strokeScale, 4 * strokeScale]}
          listening={false}
        />
      )}
      {drawPreview && drawPreview.type === "arrow" && drawPreview.currentX != null && drawPreview.currentY != null && (
        <Arrow
          points={[
            toLayerX(drawPreview.startX, effectiveW),
            toLayerY(drawPreview.startY, effectiveH),
            toLayerX(drawPreview.currentX, effectiveW),
            toLayerY(drawPreview.currentY, effectiveH),
          ]}
          stroke={color}
          strokeWidth={3 * strokeScale}
          fill={color}
          pointerLength={10 * strokeScale}
          pointerWidth={8 * strokeScale}
          dash={[6 * strokeScale, 4 * strokeScale]}
          listening={false}
        />
      )}
      {drawPreview && drawPreview.type === "highlight" && drawPreview.currentX != null && drawPreview.currentY != null && (
        <Rect
          x={toLayerX(Math.min(drawPreview.startX, drawPreview.currentX), effectiveW)}
          y={toLayerY(Math.min(drawPreview.startY, drawPreview.currentY), effectiveH)}
          width={Math.abs(drawPreview.currentX - drawPreview.startX) * effectiveW}
          height={Math.abs(drawPreview.currentY - drawPreview.startY) * effectiveH}
          fill={HIGHLIGHT_COLOR}
          opacity={0.3}
          listening={false}
        />
      )}
      {drawPreview && drawPreview.type === "freehand" && drawPreview.points && (
        <Line
          points={drawPreview.points.flatMap((v, i) =>
            i % 2 === 0 ? [v * effectiveW] : [v * effectiveH],
          )}
          stroke={color}
          strokeWidth={3 * strokeScale}
          tension={0.5}
          lineCap="round"
          lineJoin="round"
          listening={false}
        />
      )}
    </Layer>
  );
}

// ── Individual Annotation Shapes ────────────────────────────────────────────

function AnnotationShape({
  annotation: ann,
  effectiveW,
  effectiveH,
  strokeScale,
  isSelected,
  onClick,
}: {
  annotation: Annotation;
  effectiveW: number;
  effectiveH: number;
  strokeScale: number;
  isSelected: boolean;
  onClick: () => void;
}) {
  const sw = ann.strokeWidth * effectiveW;
  const selStroke = isSelected ? 2 * strokeScale : 0;

  switch (ann.type) {
    case "checkmark": {
      const cx = toLayerX(ann.x, effectiveW);
      const cy = toLayerY(ann.y, effectiveH);
      const size = ann.size ?? DEFAULT_CHECKMARK_SIZE * Math.min(effectiveW, effectiveH);
      return (
        <Group onClick={onClick} listening>
          {isSelected && (
            <Rect
              x={cx - size * 0.8}
              y={cy - size * 0.8}
              width={size * 1.6}
              height={size * 1.6}
              stroke={SELECTION_COLOR}
              strokeWidth={selStroke}
              dash={[4 * strokeScale, 3 * strokeScale]}
              listening={false}
            />
          )}
          <Line
            points={[
              cx - size * 0.4, cy,
              cx - size * 0.1, cy + size * 0.4,
              cx + size * 0.5, cy - size * 0.4,
            ]}
            stroke={ann.color}
            strokeWidth={Math.max(sw, 3 * strokeScale)}
            lineCap="round"
            lineJoin="round"
            opacity={ann.opacity}
            hitStrokeWidth={12 * strokeScale}
          />
        </Group>
      );
    }

    case "circle": {
      return (
        <Group onClick={onClick} listening>
          {isSelected && (
            <Ellipse
              x={toLayerX(ann.x, effectiveW)}
              y={toLayerY(ann.y, effectiveH)}
              radiusX={ann.rx * effectiveW + 4 * strokeScale}
              radiusY={ann.ry * effectiveH + 4 * strokeScale}
              stroke={SELECTION_COLOR}
              strokeWidth={selStroke}
              dash={[4 * strokeScale, 3 * strokeScale]}
              listening={false}
            />
          )}
          <Ellipse
            x={toLayerX(ann.x, effectiveW)}
            y={toLayerY(ann.y, effectiveH)}
            radiusX={ann.rx * effectiveW}
            radiusY={ann.ry * effectiveH}
            stroke={ann.color}
            strokeWidth={Math.max(sw, 2 * strokeScale)}
            opacity={ann.opacity}
            hitStrokeWidth={12 * strokeScale}
          />
        </Group>
      );
    }

    case "arrow": {
      return (
        <Group onClick={onClick} listening>
          <Arrow
            points={[
              toLayerX(ann.x1, effectiveW),
              toLayerY(ann.y1, effectiveH),
              toLayerX(ann.x2, effectiveW),
              toLayerY(ann.y2, effectiveH),
            ]}
            stroke={isSelected ? SELECTION_COLOR : ann.color}
            strokeWidth={Math.max(sw, 2 * strokeScale) + (isSelected ? 2 * strokeScale : 0)}
            fill={isSelected ? SELECTION_COLOR : ann.color}
            pointerLength={10 * strokeScale}
            pointerWidth={8 * strokeScale}
            opacity={ann.opacity}
            hitStrokeWidth={12 * strokeScale}
          />
        </Group>
      );
    }

    case "cross": {
      const cx = toLayerX(ann.x, effectiveW);
      const cy = toLayerY(ann.y, effectiveH);
      const size = ann.size ?? DEFAULT_CROSS_SIZE * Math.min(effectiveW, effectiveH);
      return (
        <Group onClick={onClick} listening>
          {isSelected && (
            <Rect
              x={cx - size * 0.8}
              y={cy - size * 0.8}
              width={size * 1.6}
              height={size * 1.6}
              stroke={SELECTION_COLOR}
              strokeWidth={selStroke}
              dash={[4 * strokeScale, 3 * strokeScale]}
              listening={false}
            />
          )}
          <Line
            points={[cx - size * 0.5, cy - size * 0.5, cx + size * 0.5, cy + size * 0.5]}
            stroke={ann.color}
            strokeWidth={Math.max(sw, 3 * strokeScale)}
            lineCap="round"
            opacity={ann.opacity}
            hitStrokeWidth={12 * strokeScale}
          />
          <Line
            points={[cx + size * 0.5, cy - size * 0.5, cx - size * 0.5, cy + size * 0.5]}
            stroke={ann.color}
            strokeWidth={Math.max(sw, 3 * strokeScale)}
            lineCap="round"
            opacity={ann.opacity}
            hitStrokeWidth={12 * strokeScale}
          />
        </Group>
      );
    }

    case "highlight": {
      return (
        <Rect
          x={toLayerX(ann.x, effectiveW)}
          y={toLayerY(ann.y, effectiveH)}
          width={ann.w * effectiveW}
          height={ann.h * effectiveH}
          fill={ann.color}
          opacity={ann.opacity}
          stroke={isSelected ? SELECTION_COLOR : undefined}
          strokeWidth={isSelected ? selStroke : 0}
          dash={isSelected ? [4 * strokeScale, 3 * strokeScale] : undefined}
          onClick={onClick}
          listening
        />
      );
    }

    case "freehand": {
      return (
        <Line
          points={ann.points.flatMap((v, i) =>
            i % 2 === 0 ? [v * effectiveW] : [v * effectiveH],
          )}
          stroke={isSelected ? SELECTION_COLOR : ann.color}
          strokeWidth={Math.max(sw, 2 * strokeScale) + (isSelected ? 1 * strokeScale : 0)}
          tension={0.5}
          lineCap="round"
          lineJoin="round"
          opacity={ann.opacity}
          hitStrokeWidth={12 * strokeScale}
          onClick={onClick}
          listening
        />
      );
    }

    case "text": {
      const fontSize = ann.fontSize * effectiveH;
      return (
        <Text
          x={toLayerX(ann.x, effectiveW)}
          y={toLayerY(ann.y, effectiveH)}
          text={ann.text}
          fontSize={fontSize}
          fill={ann.color}
          opacity={ann.opacity}
          fontStyle="bold"
          stroke={isSelected ? SELECTION_COLOR : undefined}
          strokeWidth={isSelected ? 1 * strokeScale : 0}
          onClick={onClick}
          listening
        />
      );
    }

    default:
      return null;
  }
}
