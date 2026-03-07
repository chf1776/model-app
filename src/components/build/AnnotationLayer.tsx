import { useCallback, useState, useEffect } from "react";
import { Layer, Line, Ellipse, Arrow, Rect, Text, Group } from "react-konva";
import { useAppStore } from "@/store";
import type { Annotation } from "@/shared/types";
import type Konva from "konva";

interface AnnotationLayerProps {
  stepId: string;
  effectiveW: number;
  effectiveH: number;
  zoom: number;
  onRequestTextInput?: (nx: number, ny: number) => void;
}

const CHECKMARK_SIZE = 0.03;
const CROSS_SIZE = 0.025;
const SELECTION_COLOR = "#4E7282";

function toLayerX(nx: number, w: number) { return nx * w; }
function toLayerY(ny: number, h: number) { return ny * h; }
function toNormX(lx: number, w: number) { return lx / w; }
function toNormY(ly: number, h: number) { return ly / h; }

function getLayerPoint(
  stage: Konva.Stage,
  zoom: number,
  panX: number,
  panY: number,
) {
  const pointer = stage.getPointerPosition();
  if (!pointer) return null;
  return {
    x: (pointer.x - panX) / zoom,
    y: (pointer.y - panY) / zoom,
  };
}

function makeId() {
  return crypto.randomUUID();
}

export function AnnotationLayer({ stepId, effectiveW, effectiveH, zoom, onRequestTextInput }: AnnotationLayerProps) {
  const annotations = useAppStore((s) => s.stepAnnotations[stepId] ?? []);
  const annotationMode = useAppStore((s) => s.annotationMode);
  const annotationColor = useAppStore((s) => s.annotationColor);
  const addAnnotation = useAppStore((s) => s.addAnnotation);
  const removeAnnotation = useAppStore((s) => s.removeAnnotation);
  const viewerPanX = useAppStore((s) => s.viewerPanX);
  const viewerPanY = useAppStore((s) => s.viewerPanY);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawState, setDrawState] = useState<{
    type: "circle" | "arrow" | "highlight" | "freehand";
    startX: number;
    startY: number;
    points?: number[];
    currentX?: number;
    currentY?: number;
  } | null>(null);

  const baseAnnotation = useCallback((): Pick<Annotation, "id" | "color" | "strokeWidth" | "opacity"> => ({
    id: makeId(),
    color: annotationColor,
    strokeWidth: 0.003,
    opacity: 0.9,
  }), [annotationColor]);

  const handleMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (!annotationMode) return;
      const stage = e.target.getStage();
      if (!stage) return;

      const pt = getLayerPoint(stage, zoom, viewerPanX, viewerPanY);
      if (!pt) return;

      const nx = toNormX(pt.x, effectiveW);
      const ny = toNormY(pt.y, effectiveH);

      if (annotationMode === "checkmark") {
        addAnnotation(stepId, {
          ...baseAnnotation(),
          type: "checkmark",
          x: nx,
          y: ny,
        });
        setSelectedId(null);
        return;
      }

      if (annotationMode === "cross") {
        addAnnotation(stepId, {
          ...baseAnnotation(),
          type: "cross",
          x: nx,
          y: ny,
        });
        setSelectedId(null);
        return;
      }

      if (annotationMode === "text") {
        if (onRequestTextInput) {
          onRequestTextInput(nx, ny);
        }
        return;
      }

      if (annotationMode === "freehand") {
        setDrawState({ type: "freehand", startX: nx, startY: ny, points: [nx, ny] });
        return;
      }

      if (annotationMode === "circle" || annotationMode === "arrow" || annotationMode === "highlight") {
        setDrawState({ type: annotationMode, startX: nx, startY: ny, currentX: nx, currentY: ny });
        return;
      }
    },
    [annotationMode, zoom, viewerPanX, viewerPanY, effectiveW, effectiveH, stepId, addAnnotation, baseAnnotation, onRequestTextInput],
  );

  const handleMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (!drawState) return;
      const stage = e.target.getStage();
      if (!stage) return;
      const pt = getLayerPoint(stage, zoom, viewerPanX, viewerPanY);
      if (!pt) return;

      const nx = toNormX(pt.x, effectiveW);
      const ny = toNormY(pt.y, effectiveH);

      if (drawState.type === "freehand") {
        setDrawState((prev) => prev ? {
          ...prev,
          points: [...(prev.points ?? []), nx, ny],
        } : null);
      } else {
        setDrawState((prev) => prev ? { ...prev, currentX: nx, currentY: ny } : null);
      }
    },
    [drawState, zoom, viewerPanX, viewerPanY, effectiveW, effectiveH],
  );

  const handleMouseUp = useCallback(() => {
    if (!drawState) return;

    if (drawState.type === "circle" && drawState.currentX != null && drawState.currentY != null) {
      const rx = Math.abs(drawState.currentX - drawState.startX) / 2;
      const ry = Math.abs(drawState.currentY - drawState.startY) / 2;
      if (rx > 0.002 || ry > 0.002) {
        addAnnotation(stepId, {
          ...baseAnnotation(),
          type: "circle",
          x: (drawState.startX + drawState.currentX) / 2,
          y: (drawState.startY + drawState.currentY) / 2,
          rx,
          ry,
        });
      }
    }

    if (drawState.type === "arrow" && drawState.currentX != null && drawState.currentY != null) {
      const dist = Math.hypot(drawState.currentX - drawState.startX, drawState.currentY - drawState.startY);
      if (dist > 0.005) {
        addAnnotation(stepId, {
          ...baseAnnotation(),
          type: "arrow",
          x1: drawState.startX,
          y1: drawState.startY,
          x2: drawState.currentX,
          y2: drawState.currentY,
        });
      }
    }

    if (drawState.type === "highlight" && drawState.currentX != null && drawState.currentY != null) {
      const w = Math.abs(drawState.currentX - drawState.startX);
      const h = Math.abs(drawState.currentY - drawState.startY);
      if (w > 0.002 || h > 0.002) {
        addAnnotation(stepId, {
          ...baseAnnotation(),
          type: "highlight",
          x: Math.min(drawState.startX, drawState.currentX),
          y: Math.min(drawState.startY, drawState.currentY),
          w,
          h,
          opacity: 0.3,
          color: "#facc15",
        });
      }
    }

    if (drawState.type === "freehand" && drawState.points && drawState.points.length > 4) {
      addAnnotation(stepId, {
        ...baseAnnotation(),
        type: "freehand",
        points: drawState.points,
      });
    }

    setDrawState(null);
  }, [drawState, stepId, addAnnotation, baseAnnotation]);

  const handleAnnotationClick = useCallback(
    (id: string) => {
      if (annotationMode) return;
      setSelectedId(selectedId === id ? null : id);
    },
    [annotationMode, selectedId],
  );

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

  return (
    <Layer
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
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

      {/* Drawing preview */}
      {drawState && drawState.type === "circle" && drawState.currentX != null && drawState.currentY != null && (
        <Ellipse
          x={toLayerX((drawState.startX + drawState.currentX) / 2, effectiveW)}
          y={toLayerY((drawState.startY + drawState.currentY) / 2, effectiveH)}
          radiusX={Math.abs(drawState.currentX - drawState.startX) / 2 * effectiveW}
          radiusY={Math.abs(drawState.currentY - drawState.startY) / 2 * effectiveH}
          stroke={annotationColor}
          strokeWidth={3 * strokeScale}
          dash={[6 * strokeScale, 4 * strokeScale]}
          listening={false}
        />
      )}
      {drawState && drawState.type === "arrow" && drawState.currentX != null && drawState.currentY != null && (
        <Arrow
          points={[
            toLayerX(drawState.startX, effectiveW),
            toLayerY(drawState.startY, effectiveH),
            toLayerX(drawState.currentX, effectiveW),
            toLayerY(drawState.currentY, effectiveH),
          ]}
          stroke={annotationColor}
          strokeWidth={3 * strokeScale}
          fill={annotationColor}
          pointerLength={10 * strokeScale}
          pointerWidth={8 * strokeScale}
          dash={[6 * strokeScale, 4 * strokeScale]}
          listening={false}
        />
      )}
      {drawState && drawState.type === "highlight" && drawState.currentX != null && drawState.currentY != null && (
        <Rect
          x={toLayerX(Math.min(drawState.startX, drawState.currentX), effectiveW)}
          y={toLayerY(Math.min(drawState.startY, drawState.currentY), effectiveH)}
          width={Math.abs(drawState.currentX - drawState.startX) * effectiveW}
          height={Math.abs(drawState.currentY - drawState.startY) * effectiveH}
          fill="#facc15"
          opacity={0.3}
          listening={false}
        />
      )}
      {drawState && drawState.type === "freehand" && drawState.points && (
        <Line
          points={drawState.points.flatMap((v, i) =>
            i % 2 === 0 ? [v * effectiveW] : [v * effectiveH],
          )}
          stroke={annotationColor}
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
      const size = CHECKMARK_SIZE * Math.min(effectiveW, effectiveH);
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
      const size = CROSS_SIZE * Math.min(effectiveW, effectiveH);
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
