import { useCallback } from "react";
import { Layer, Rect } from "react-konva";
import { useAppStore } from "@/store";
import { CropRegion } from "./CropRegion";
import { useTheme } from "@/hooks/useTheme";
import * as api from "@/api";
import type { DrawingRect } from "@/hooks/useCropDrawing";

interface CropLayerProps {
  drawingRect: DrawingRect | null;
  zoom: number;
}

/**
 * Convert image-space crop coordinates to effective (post-rotation) space
 * for rendering on the canvas.
 */
export function imageToEffective(
  cropX: number,
  cropY: number,
  cropW: number,
  cropH: number,
  rotation: number,
  imgW: number,
  imgH: number,
): { x: number; y: number; width: number; height: number } {
  switch (rotation) {
    case 90:
      // effective W = imgH, effective H = imgW
      return { x: imgH - cropY - cropH, y: cropX, width: cropH, height: cropW };
    case 180:
      return { x: imgW - cropX - cropW, y: imgH - cropY - cropH, width: cropW, height: cropH };
    case 270:
      return { x: cropY, y: imgW - cropX - cropW, width: cropH, height: cropW };
    default: // 0
      return { x: cropX, y: cropY, width: cropW, height: cropH };
  }
}

/**
 * Inverse of imageToEffective: convert effective (post-rotation) space
 * back to image-space crop coordinates for storage.
 */
export function effectiveToImage(
  effX: number,
  effY: number,
  effW: number,
  effH: number,
  rotation: number,
  imgW: number,
  imgH: number,
): { cropX: number; cropY: number; cropW: number; cropH: number } {
  switch (rotation) {
    case 90:
      return { cropX: effY, cropY: imgH - effX - effW, cropW: effH, cropH: effW };
    case 180:
      return { cropX: imgW - effX - effW, cropY: imgH - effY - effH, cropW: effW, cropH: effH };
    case 270:
      return { cropX: imgW - effY - effH, cropY: effX, cropW: effH, cropH: effW };
    default: // 0
      return { cropX: effX, cropY: effY, cropW: effW, cropH: effH };
  }
}

/**
 * Convert a single image-space point to effective (post-rotation) space.
 */
export function imagePointToEffective(
  ix: number,
  iy: number,
  rotation: number,
  imgW: number,
  imgH: number,
): { x: number; y: number } {
  switch (rotation) {
    case 90:
      return { x: imgH - iy, y: ix };
    case 180:
      return { x: imgW - ix, y: imgH - iy };
    case 270:
      return { x: iy, y: imgW - ix };
    default:
      return { x: ix, y: iy };
  }
}

/**
 * Convert a single effective-space point back to image-space.
 */
export function effectivePointToImage(
  ex: number,
  ey: number,
  rotation: number,
  imgW: number,
  imgH: number,
): { x: number; y: number } {
  switch (rotation) {
    case 90:
      return { x: ey, y: imgH - ex };
    case 180:
      return { x: imgW - ex, y: imgH - ey };
    case 270:
      return { x: imgW - ey, y: ex };
    default:
      return { x: ex, y: ey };
  }
}

export function CropLayer({ drawingRect, zoom }: CropLayerProps) {
  const steps = useAppStore((s) => s.steps);
  const tracks = useAppStore((s) => s.tracks);
  const activeStepId = useAppStore((s) => s.activeStepId);
  const setActiveStep = useAppStore((s) => s.setActiveStep);
  const { accent } = useTheme();
  const selectedStepIds = useAppStore((s) => s.selectedStepIds);
  const currentSourcePages = useAppStore((s) => s.currentSourcePages);
  const currentPageIndex = useAppStore((s) => s.currentPageIndex);
  const viewerPanX = useAppStore((s) => s.viewerPanX);
  const viewerPanY = useAppStore((s) => s.viewerPanY);

  const updateStepStore = useAppStore((s) => s.updateStepStore);

  const currentPage = currentSourcePages[currentPageIndex];

  const handleResize = useCallback(
    async (stepId: string, effX: number, effY: number, effW: number, effH: number) => {
      if (!currentPage) return;
      const { cropX, cropY, cropW, cropH } = effectiveToImage(
        effX, effY, effW, effH,
        currentPage.rotation, currentPage.width, currentPage.height,
      );
      const updated = await api.updateStep({
        id: stepId,
        crop_x: Math.round(cropX),
        crop_y: Math.round(cropY),
        crop_w: Math.round(cropW),
        crop_h: Math.round(cropH),
      });
      updateStepStore(updated);
    },
    [currentPage, updateStepStore],
  );

  if (!currentPage) return null;

  // Filter steps that belong to the current page and have crop data (but no polygon — those render via PolygonLayer)
  const pageSteps = steps.filter(
    (s) =>
      s.source_page_id === currentPage.id &&
      s.crop_x != null &&
      s.crop_y != null &&
      s.crop_w != null &&
      s.crop_h != null &&
      s.clip_polygon == null,
  );

  const rotation = currentPage.rotation;
  const imgW = currentPage.width;
  const imgH = currentPage.height;
  const trackMap = new Map(tracks.map((t) => [t.id, t]));

  return (
    <Layer>
      {pageSteps.map((step) => {
        const eff = imageToEffective(
          step.crop_x!,
          step.crop_y!,
          step.crop_w!,
          step.crop_h!,
          rotation,
          imgW,
          imgH,
        );
        const track = trackMap.get(step.track_id);
        return (
          <CropRegion
            key={step.id}
            step={step}
            track={track}
            isActive={step.id === activeStepId}
            isSelected={selectedStepIds.includes(step.id)}
            zoom={zoom}
            onClick={() => setActiveStep(step.id)}
            onResize={handleResize}
            x={eff.x}
            y={eff.y}
            width={eff.width}
            height={eff.height}
          />
        );
      })}

      {/* In-progress drawing rectangle (stage-space → layer-space) */}
      {drawingRect && (
        <Rect
          x={(drawingRect.x - viewerPanX) / zoom}
          y={(drawingRect.y - viewerPanY) / zoom}
          width={drawingRect.width / zoom}
          height={drawingRect.height / zoom}
          stroke={accent}
          strokeWidth={2 / zoom}
          dash={[6 / zoom, 4 / zoom]}
          fill={accent}
          opacity={0.1}
        />
      )}
    </Layer>
  );
}
