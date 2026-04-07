import { useCallback, useMemo, useRef, useState } from "react";
import { Layer, Line, Circle, Group, Rect } from "react-konva";
import { useAppStore } from "@/store";
import { imagePointToEffective, effectivePointToImage } from "./CropLayer";
import { useTheme } from "@/hooks/useTheme";
import type { Step } from "@/shared/types";
import type Konva from "konva";

interface PolygonLayerProps {
  zoom: number;
  stageRef: React.RefObject<Konva.Stage | null>;
}

/**
 * Renders:
 * 1. Dashed polygon outlines for all steps on the current page that have clip_polygon
 * 2. The in-progress polygon draft (with draggable vertex dots)
 * Handles click/double-click to add points / close & save the polygon.
 */
export function PolygonLayer({ zoom, stageRef }: PolygonLayerProps) {
  const steps = useAppStore((s) => s.steps);
  const tracks = useAppStore((s) => s.tracks);
  const currentSourcePages = useAppStore((s) => s.currentSourcePages);
  const currentPageIndex = useAppStore((s) => s.currentPageIndex);
  const canvasMode = useAppStore((s) => s.canvasMode);
  const polygonDraftPoints = useAppStore((s) => s.polygonDraftPoints);
  const polygonDraftStepId = useAppStore((s) => s.polygonDraftStepId);
  const activeStepId = useAppStore((s) => s.activeStepId);
  const setActiveStep = useAppStore((s) => s.setActiveStep);
  const addPolygonPoint = useAppStore((s) => s.addPolygonPoint);
  const savePolygon = useAppStore((s) => s.savePolygon);
  const viewerPanX = useAppStore((s) => s.viewerPanX);
  const viewerPanY = useAppStore((s) => s.viewerPanY);
  const { accent } = useTheme();

  const lastClickTime = useRef(0);
  const [cursorEffPos, setCursorEffPos] = useState<{ x: number; y: number } | null>(null);

  // Click on a saved polygon outline to load it for editing
  const handlePolygonClick = useCallback(
    (step: Step, points: { x: number; y: number }[]) => {
      if (canvasMode === "polygon" && polygonDraftPoints.length === 0 && points.length >= 3) {
        useAppStore.setState({ polygonDraftPoints: points, polygonDraftStepId: step.id });
      }
      setActiveStep(step.id);
    },
    [canvasMode, polygonDraftPoints.length, setActiveStep],
  );

  const currentPage = currentSourcePages[currentPageIndex];
  const rotation = currentPage?.rotation ?? 0;
  const imgW = currentPage?.width ?? 0;
  const imgH = currentPage?.height ?? 0;

  // Handle click on canvas to place polygon point (in polygon mode)
  const handleClick = useCallback(
    (_e: Konva.KonvaEventObject<MouseEvent>) => {
      if (canvasMode !== "polygon" || !currentPage) return;

      const now = Date.now();
      const isDoubleClick = now - lastClickTime.current < 350;
      lastClickTime.current = now;

      if (isDoubleClick) {
        // Double-click: close and save
        if (polygonDraftPoints.length >= 3) {
          savePolygon();
        }
        return;
      }

      const stage = stageRef.current;
      if (!stage) return;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      // Convert stage-space pointer to effective-space
      const effX = (pointer.x - viewerPanX) / zoom;
      const effY = (pointer.y - viewerPanY) / zoom;

      // Convert effective-space to image-space for storage
      const imgPt = effectivePointToImage(effX, effY, rotation, imgW, imgH);

      // Clamp to page bounds
      imgPt.x = Math.max(0, Math.min(imgW, imgPt.x));
      imgPt.y = Math.max(0, Math.min(imgH, imgPt.y));

      addPolygonPoint({ x: Math.round(imgPt.x), y: Math.round(imgPt.y) });
    },
    [canvasMode, currentPage, stageRef, viewerPanX, viewerPanY, zoom, rotation, imgW, imgH, addPolygonPoint, polygonDraftPoints.length, savePolygon],
  );

  const handleMouseMove = useCallback(
    (_e: Konva.KonvaEventObject<MouseEvent>) => {
      const stage = stageRef.current;
      if (!stage) return;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;
      setCursorEffPos({
        x: (pointer.x - viewerPanX) / zoom,
        y: (pointer.y - viewerPanY) / zoom,
      });
    },
    [stageRef, viewerPanX, viewerPanY, zoom],
  );

  const handleMouseLeave = useCallback(() => {
    setCursorEffPos(null);
  }, []);

  const handleFirstVertexClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      e.cancelBubble = true;
      if (polygonDraftPoints.length >= 3) {
        savePolygon();
      }
    },
    [polygonDraftPoints.length, savePolygon],
  );

  // Steps on the current page that have saved polygons (memoized to avoid re-parse on mouse move)
  const savedPolygons = useMemo(() => {
    if (!currentPage) return [];
    return steps
      .filter(
        (s) =>
          s.source_page_id === currentPage.id &&
          s.clip_polygon != null &&
          s.id !== polygonDraftStepId,
      )
      .map((step) => {
        const points: { x: number; y: number }[] = JSON.parse(step.clip_polygon!);
        const flat: number[] = [];
        for (const pt of points) {
          const eff = imagePointToEffective(pt.x, pt.y, rotation, imgW, imgH);
          flat.push(eff.x, eff.y);
        }
        return { step, points, flat };
      });
  }, [steps, currentPage, polygonDraftStepId, rotation, imgW, imgH]);

  // Effective-space positions for draft points (memoized — only changes on click, not mouse move)
  const draftEffPoints = useMemo(
    () => polygonDraftPoints.map((pt) => imagePointToEffective(pt.x, pt.y, rotation, imgW, imgH)),
    [polygonDraftPoints, rotation, imgW, imgH],
  );

  // Flat array for the draft <Line>, derived from draftEffPoints (no redundant conversion)
  const draftFlat = useMemo(
    () => draftEffPoints.flatMap((p) => [p.x, p.y]),
    [draftEffPoints],
  );

  // ── Early return (after all hooks) ──────────────────────────────────────
  if (!currentPage) return null;

  const strokeScale = 1 / zoom;
  const canClose = polygonDraftPoints.length >= 3;
  const trackMap = new Map(tracks.map((t) => [t.id, t]));

  return (
    <Layer>
      {/* Saved polygon outlines for all steps on this page */}
      {savedPolygons.map(({ step, points, flat }) => {
        if (points.length < 3) return null;
        const track = trackMap.get(step.track_id);
        const color = track?.color ?? accent;
        const isActive = step.id === activeStepId;
        return (
          <Line
            key={step.id}
            points={flat}
            closed
            stroke={color}
            strokeWidth={(isActive ? 2.5 : 1.5) * strokeScale}
            dash={isActive ? undefined : [6 * strokeScale, 4 * strokeScale]}
            opacity={isActive ? 1 : 0.7}
            fill={isActive ? `${color}22` : undefined}
            listening
            hitStrokeWidth={10 * strokeScale}
            onClick={() => handlePolygonClick(step, points)}
          />
        );
      })}

      {/* Invisible click target for polygon mode — must be before draft group for z-order */}
      {canvasMode === "polygon" && (
        <Rect
          x={0}
          y={0}
          width={10000}
          height={10000}
          fill="rgba(0,0,0,0.001)"
          onClick={handleClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          listening
        />
      )}

      {/* Draft polygon */}
      {canvasMode === "polygon" && polygonDraftPoints.length > 0 && (
        <Group>
          {/* Lines connecting points — closed once 3+ points */}
          <Line
            points={draftFlat}
            closed={canClose}
            stroke={accent}
            strokeWidth={2 * strokeScale}
            dash={[8 * strokeScale, 4 * strokeScale]}
            opacity={0.9}
            listening={false}
          />

          {/* Rubber band: last point → cursor */}
          {cursorEffPos && draftEffPoints.length > 0 && (
            <Line
              points={[
                draftEffPoints[draftEffPoints.length - 1].x,
                draftEffPoints[draftEffPoints.length - 1].y,
                cursorEffPos.x,
                cursorEffPos.y,
              ]}
              stroke={accent}
              strokeWidth={1.5 * strokeScale}
              dash={[6 * strokeScale, 4 * strokeScale]}
              opacity={0.5}
              listening={false}
            />
          )}

          {/* Rubber band: cursor → first point (preview closing edge) */}
          {cursorEffPos && draftEffPoints.length >= 2 && (
            <Line
              points={[
                cursorEffPos.x,
                cursorEffPos.y,
                draftEffPoints[0].x,
                draftEffPoints[0].y,
              ]}
              stroke={accent}
              strokeWidth={1.5 * strokeScale}
              dash={[6 * strokeScale, 4 * strokeScale]}
              opacity={0.35}
              listening={false}
            />
          )}

          {/* Vertex dots */}
          {draftEffPoints.map((eff, i) => {
            const isFirst = i === 0;
            return (
              <Circle
                key={i}
                x={eff.x}
                y={eff.y}
                radius={(isFirst && canClose ? 8 : 4) * strokeScale}
                fill={isFirst ? accent : "#ffffff"}
                stroke={accent}
                strokeWidth={1.5 * strokeScale}
                listening={isFirst && canClose}
                onClick={isFirst && canClose ? handleFirstVertexClick : undefined}
                hitStrokeWidth={isFirst && canClose ? 12 * strokeScale : undefined}
                onMouseEnter={
                  isFirst && canClose
                    ? () => {
                        const stage = stageRef.current;
                        if (stage) stage.container().style.cursor = "pointer";
                      }
                    : undefined
                }
                onMouseLeave={
                  isFirst && canClose
                    ? () => {
                        const stage = stageRef.current;
                        if (stage) stage.container().style.cursor = "crosshair";
                      }
                    : undefined
                }
              />
            );
          })}
        </Group>
      )}
    </Layer>
  );
}
