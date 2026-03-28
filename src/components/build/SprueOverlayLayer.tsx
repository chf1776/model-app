import { useCallback, useMemo, useRef } from "react";
import { Layer, Rect, Group, Text, Transformer } from "react-konva";
import { useAppStore } from "@/store";
import { imageToEffective, effectiveToImage } from "./CropLayer";
import * as api from "@/api";
import type { DrawingRect } from "@/hooks/useSprueDrawing";
import type { SprueRef } from "@/shared/types";
import type Konva from "konva";

interface SprueOverlayLayerProps {
  drawingRect: DrawingRect | null;
  zoom: number;
}

const MIN_CROP_SIZE = 10;

export function SprueOverlayLayer({ drawingRect, zoom }: SprueOverlayLayerProps) {
  const sprueRefs = useAppStore((s) => s.sprueRefs);
  const activeSprueRefId = useAppStore((s) => s.activeSprueRefId);
  const setActiveSprueRef = useAppStore((s) => s.setActiveSprueRef);
  const updateSprueRefStore = useAppStore((s) => s.updateSprueRefStore);
  const currentSourcePages = useAppStore((s) => s.currentSourcePages);
  const currentPageIndex = useAppStore((s) => s.currentPageIndex);
  const viewerPanX = useAppStore((s) => s.viewerPanX);
  const viewerPanY = useAppStore((s) => s.viewerPanY);

  const currentPage = currentSourcePages[currentPageIndex];

  const handleResize = useCallback(
    async (refId: string, effX: number, effY: number, effW: number, effH: number) => {
      if (!currentPage) return;
      const { cropX, cropY, cropW, cropH } = effectiveToImage(
        effX, effY, effW, effH,
        currentPage.rotation, currentPage.width, currentPage.height,
      );
      try {
        const updated = await api.updateSprueRef({
          id: refId,
          source_page_id: currentPage.id,
          crop_x: Math.round(cropX),
          crop_y: Math.round(cropY),
          crop_w: Math.round(cropW),
          crop_h: Math.round(cropH),
        });
        updateSprueRefStore(updated);
      } catch {
        // silent — user can retry
      }
    },
    [currentPage, updateSprueRefStore],
  );

  const pageRefs = useMemo(() => {
    if (!currentPage) return [];
    return sprueRefs.filter(
      (r) =>
        r.source_page_id === currentPage.id &&
        r.crop_x != null &&
        r.crop_y != null &&
        r.crop_w != null &&
        r.crop_h != null,
    );
  }, [sprueRefs, currentPage]);

  if (!currentPage) return null;

  const rotation = currentPage.rotation;
  const imgW = currentPage.width;
  const imgH = currentPage.height;

  return (
    <Layer>
      {pageRefs.map((ref) => {
        const eff = imageToEffective(
          ref.crop_x!, ref.crop_y!, ref.crop_w!, ref.crop_h!,
          rotation, imgW, imgH,
        );
        const isActive = ref.id === activeSprueRefId;
        return (
          <SprueRegion
            key={ref.id}
            sprueRef={ref}
            isActive={isActive}
            zoom={zoom}
            x={eff.x}
            y={eff.y}
            width={eff.width}
            height={eff.height}
            onClick={() => setActiveSprueRef(ref.id)}
            onResize={handleResize}
          />
        );
      })}

      {/* In-progress drawing rectangle */}
      {drawingRect && (
        <Rect
          x={(drawingRect.x - viewerPanX) / zoom}
          y={(drawingRect.y - viewerPanY) / zoom}
          width={drawingRect.width / zoom}
          height={drawingRect.height / zoom}
          stroke="#3A7CA5"
          strokeWidth={2 / zoom}
          dash={[6 / zoom, 4 / zoom]}
          fill="#3A7CA5"
          opacity={0.1}
        />
      )}
    </Layer>
  );
}

// ── Sprue Region ────────────────────────────────────────────────────────────

interface SprueRegionProps {
  sprueRef: SprueRef;
  isActive: boolean;
  zoom: number;
  x: number;
  y: number;
  width: number;
  height: number;
  onClick: () => void;
  onResize: (refId: string, effX: number, effY: number, effW: number, effH: number) => void;
}

function SprueRegion({
  sprueRef,
  isActive,
  zoom,
  x,
  y,
  width,
  height,
  onClick,
  onResize,
}: SprueRegionProps) {
  const shapeRef = useRef<Konva.Rect>(null);
  const trRef = useRef<Konva.Transformer>(null);

  const color = sprueRef.color;
  const fillOpacity = isActive ? 0.1 : 0.04;
  const strokeOpacity = isActive ? 1.0 : 0.4;

  // Attach transformer when active
  const groupRef = useCallback(
    (node: Konva.Group | null) => {
      if (node && isActive && trRef.current && shapeRef.current) {
        trRef.current.nodes([shapeRef.current]);
        trRef.current.getLayer()?.batchDraw();
      }
    },
    [isActive],
  );

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;
    onResize(sprueRef.id, node.x(), node.y(), width, height);
  };

  const handleTransformEnd = () => {
    const node = shapeRef.current;
    if (!node) return;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    node.scaleX(1);
    node.scaleY(1);
    onResize(
      sprueRef.id,
      node.x(),
      node.y(),
      Math.max(MIN_CROP_SIZE, node.width() * scaleX),
      Math.max(MIN_CROP_SIZE, node.height() * scaleY),
    );
  };

  return (
    <Group ref={groupRef}>
      <Rect
        ref={shapeRef}
        x={x}
        y={y}
        width={width}
        height={height}
        fill={color}
        opacity={fillOpacity}
        stroke={color}
        strokeWidth={2 / zoom}
        strokeScaleEnabled={false}
        onClick={(e) => {
          e.cancelBubble = true;
          onClick();
        }}
        draggable={isActive}
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
      />
      {/* Label at top-left */}
      {!isActive && (
        <Group x={x} y={y - 16 / zoom} listening={false}>
          <Rect
            width={Math.max(20 / zoom, sprueRef.label.length * 8 / zoom + 8 / zoom)}
            height={14 / zoom}
            fill={color}
            cornerRadius={2 / zoom}
            opacity={strokeOpacity}
          />
          <Text
            text={sprueRef.label}
            fontSize={9 / zoom}
            fill="#FFFFFF"
            x={4 / zoom}
            y={3 / zoom}
            listening={false}
          />
        </Group>
      )}
      {isActive && (
        <>
          <Group x={x} y={y - 16 / zoom} listening={false}>
            <Rect
              width={Math.max(20 / zoom, sprueRef.label.length * 8 / zoom + 8 / zoom)}
              height={14 / zoom}
              fill={color}
              cornerRadius={2 / zoom}
            />
            <Text
              text={sprueRef.label}
              fontSize={9 / zoom}
              fill="#FFFFFF"
              x={4 / zoom}
              y={3 / zoom}
              listening={false}
            />
          </Group>
          <Transformer
            ref={trRef}
            rotateEnabled={false}
            keepRatio={false}
            anchorSize={8}
            anchorCornerRadius={2}
            borderStroke={color}
            borderStrokeWidth={1}
            anchorStroke={color}
            anchorFill="#FFFFFF"
            boundBoxFunc={(_oldBox, newBox) => {
              if (newBox.width < MIN_CROP_SIZE || newBox.height < MIN_CROP_SIZE) {
                return _oldBox;
              }
              return newBox;
            }}
          />
        </>
      )}
    </Group>
  );
}
