import { useEffect, useRef } from "react";
import { Group, Rect, Label, Tag, Text, Transformer } from "react-konva";
import type Konva from "konva";
import type { KonvaEventObject } from "konva/lib/Node";
import type { Box } from "konva/lib/shapes/Transformer";
import type { Step, Track } from "@/shared/types";

const MIN_CROP_SIZE = 5;

const boundBoxFunc = (_oldBox: Box, newBox: Box) => {
  if (Math.abs(newBox.width) < MIN_CROP_SIZE || Math.abs(newBox.height) < MIN_CROP_SIZE) {
    return _oldBox;
  }
  return newBox;
};

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

interface CropRegionProps {
  step: Step;
  track: Track | undefined;
  isActive: boolean;
  isSelected?: boolean;
  zoom: number;
  onClick: () => void;
  onResize: (stepId: string, effX: number, effY: number, effW: number, effH: number) => void;
  // Offset/position in effective (post-rotation) space
  x: number;
  y: number;
  width: number;
  height: number;
}

export function CropRegion({
  step,
  track,
  isActive,
  isSelected,
  zoom,
  onClick,
  onResize,
  x,
  y,
  width,
  height,
}: CropRegionProps) {
  const shapeRef = useRef<Konva.Rect>(null);
  const trRef = useRef<Konva.Transformer>(null);

  const color = track?.color ?? "#999";
  const fillColor = hexToRgba(color, isActive ? 0.08 : isSelected ? 0.12 : 0.04);
  const strokeOpacity = isActive ? 1 : isSelected ? 0.8 : 0.3;
  const strokeColor = hexToRgba(color, strokeOpacity);
  const strokeWidth = 2 / zoom;

  // Build label text: first 4 chars of track name + step order
  const trackAbbr = track?.name.slice(0, 4) ?? "?";
  const labelText = `${trackAbbr} ${step.display_order + 1}`;

  // Attach transformer to rect when active
  useEffect(() => {
    if (isActive && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isActive]);

  const handleDragEnd = (e: KonvaEventObject<DragEvent>) => {
    const node = e.target;
    onResize(step.id, node.x(), node.y(), width, height);
  };

  const handleTransformEnd = () => {
    const node = shapeRef.current;
    if (!node) return;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    node.scaleX(1);
    node.scaleY(1);
    onResize(
      step.id,
      node.x(),
      node.y(),
      Math.max(MIN_CROP_SIZE, node.width() * scaleX),
      Math.max(MIN_CROP_SIZE, node.height() * scaleY),
    );
  };

  return (
    <Group>
      <Rect
        ref={shapeRef}
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        draggable={isActive}
        onClick={onClick}
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
      />
      {/* Corner label — hidden when active to avoid drift during drag */}
      {!isActive && (
        <Label
          x={x}
          y={y}
          scaleX={1 / zoom}
          scaleY={1 / zoom}
          onClick={onClick}
        >
          <Tag fill={color} cornerRadius={2} />
          <Text
            text={labelText}
            fontSize={10}
            fontFamily="DM Sans, sans-serif"
            fill="#FFFFFF"
            padding={3}
          />
        </Label>
      )}

      {isActive && (
        <Transformer
          ref={trRef}
          rotateEnabled={false}
          keepRatio={false}
          anchorSize={8 / zoom}
          anchorFill="#FFFFFF"
          anchorStroke={color}
          anchorStrokeWidth={1 / zoom}
          anchorCornerRadius={1 / zoom}
          borderEnabled={false}
          boundBoxFunc={boundBoxFunc}
        />
      )}
    </Group>
  );
}
