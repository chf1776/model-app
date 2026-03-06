import { Upload, ZoomIn, ZoomOut, Maximize2, FileStack, RotateCw, MousePointer, Crop, RectangleHorizontal, Keyboard, Settings2, Hammer } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SegmentedPill } from "@/components/shared/SegmentedPill";
import { useAppStore } from "@/store";
import type { BuildMode } from "@/store/build-slice";
import * as api from "@/api";
import { useUploadPdf } from "./useUploadPdf";

interface BuildToolbarProps {
  onOpenSourceManager: () => void;
  onOpenShortcuts?: () => void;
}

export function BuildToolbar({ onOpenSourceManager, onOpenShortcuts }: BuildToolbarProps) {
  const project = useAppStore((s) => s.project);
  const tracks = useAppStore((s) => s.tracks);
  const activeTrackId = useAppStore((s) => s.activeTrackId);
  const buildMode = useAppStore((s) => s.buildMode);
  const setBuildMode = useAppStore((s) => s.setBuildMode);
  const instructionSources = useAppStore((s) => s.instructionSources);
  const viewerZoom = useAppStore((s) => s.viewerZoom);
  const setViewerZoom = useAppStore((s) => s.setViewerZoom);
  const requestFitToView = useAppStore((s) => s.requestFitToView);
  const rotatePage = useAppStore((s) => s.rotatePage);
  const canvasMode = useAppStore((s) => s.canvasMode);
  const setCanvasMode = useAppStore((s) => s.setCanvasMode);
  const currentSourcePages = useAppStore((s) => s.currentSourcePages);
  const currentPageIndex = useAppStore((s) => s.currentPageIndex);
  const steps = useAppStore((s) => s.steps);
  const addStep = useAppStore((s) => s.addStep);
  const setActiveStep = useAppStore((s) => s.setActiveStep);
  const activeProjectId = useAppStore((s) => s.activeProjectId);
  const loadTracks = useAppStore((s) => s.loadTracks);
  const pushUndo = useAppStore((s) => s.pushUndo);

  const activeTrack = activeTrackId
    ? tracks.find((t) => t.id === activeTrackId) ?? null
    : null;

  const handleUploadPdf = useUploadPdf();

  const handleZoomIn = () => setViewerZoom(viewerZoom * 1.2);
  const handleZoomOut = () => setViewerZoom(viewerZoom / 1.2);
  const handleFitToView = () => requestFitToView();

  const zoomPercent = Math.round(viewerZoom * 100);

  const currentPage = currentSourcePages[currentPageIndex];

  const handleFullPage = async () => {
    if (!activeTrackId) {
      toast.info("Select a track first");
      return;
    }
    if (!currentPage) {
      toast.info("No page selected");
      return;
    }
    const trackSteps = steps.filter((s) => s.track_id === activeTrackId);
    const title = `Step ${trackSteps.length + 1}`;
    try {
      const step = await api.createStep({
        track_id: activeTrackId,
        title,
        source_page_id: currentPage.id,
        is_full_page: true,
        crop_x: 0,
        crop_y: 0,
        crop_w: currentPage.width,
        crop_h: currentPage.height,
      });
      addStep(step);
      pushUndo(step.id);
      setActiveStep(step.id);
      if (activeProjectId) loadTracks(activeProjectId);
    } catch (e) {
      toast.error(`Failed to create step: ${e}`);
    }
  };

  return (
    <div className="flex items-center gap-2 border-b border-border bg-background px-3 py-1">
      {/* Left: Mode toggle */}
      <SegmentedPill<BuildMode>
        items={[
          { value: "setup", label: "Setup", icon: <Settings2 className="h-3 w-3" /> },
          { value: "building", label: "Building", icon: <Hammer className="h-3 w-3" /> },
        ]}
        value={buildMode}
        onChange={setBuildMode}
        size="sm"
      />

      <Separator orientation="vertical" className="h-[14px]" />

      <span className="text-xs font-medium text-text-primary">
        {project?.name}
      </span>

      {activeTrack && (
        <>
          <Separator orientation="vertical" className="h-[14px]" />
          <div className="flex items-center gap-1.5">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: activeTrack.color }}
            />
            <span className="text-[11px] text-text-secondary">
              {activeTrack.name}
            </span>
          </div>
        </>
      )}

      <div className="flex-1" />

      {/* Right: Actions */}
      {instructionSources.length > 0 && (
        <>
          {buildMode === "setup" && (
            <>
              {/* Canvas mode toggle */}
              <div className="flex items-center rounded-md border border-border">
                <button
                  onClick={() => setCanvasMode("view")}
                  className={`rounded-l-[5px] px-1.5 py-1 ${
                    canvasMode === "view"
                      ? "bg-accent text-white"
                      : "text-text-tertiary hover:bg-muted hover:text-text-secondary"
                  }`}
                  title="View mode (V)"
                >
                  <MousePointer className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setCanvasMode("crop")}
                  className={`rounded-r-[5px] px-1.5 py-1 ${
                    canvasMode === "crop"
                      ? "bg-accent text-white"
                      : "text-text-tertiary hover:bg-muted hover:text-text-secondary"
                  }`}
                  title="Crop mode (C)"
                >
                  <Crop className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Full page button */}
              <button
                onClick={handleFullPage}
                className="rounded p-1 text-text-tertiary hover:bg-muted hover:text-text-secondary"
                title="Full page step (F)"
              >
                <RectangleHorizontal className="h-3.5 w-3.5" />
              </button>

              <Separator orientation="vertical" className="h-[14px]" />

              {/* Source manager */}
              <Button
                variant="ghost"
                size="sm"
                onClick={onOpenSourceManager}
                className="h-6 gap-1 px-1.5 text-[11px] text-text-tertiary hover:text-text-secondary"
              >
                <FileStack className="h-3.5 w-3.5" />
                Sources
              </Button>

              <Separator orientation="vertical" className="h-[14px]" />
            </>
          )}

          {/* Zoom controls */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={handleZoomOut}
              className="rounded p-1 text-text-tertiary hover:bg-muted hover:text-text-secondary"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <span className="min-w-[36px] text-center font-mono text-[10px] tabular-nums text-text-tertiary">
              {zoomPercent}%
            </span>
            <button
              onClick={handleZoomIn}
              className="rounded p-1 text-text-tertiary hover:bg-muted hover:text-text-secondary"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleFitToView}
              className="rounded p-1 text-text-tertiary hover:bg-muted hover:text-text-secondary"
              title="Fit to view"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={rotatePage}
              className="rounded p-1 text-text-tertiary hover:bg-muted hover:text-text-secondary"
              title="Rotate page (R)"
            >
              <RotateCw className="h-3.5 w-3.5" />
            </button>
          </div>

          <Separator orientation="vertical" className="h-[14px]" />
        </>
      )}

      {/* Shortcuts button */}
      {onOpenShortcuts && (
        <button
          onClick={onOpenShortcuts}
          className="rounded p-1 text-text-tertiary hover:bg-muted hover:text-text-secondary"
          title="Keyboard shortcuts (?)"
        >
          <Keyboard className="h-3.5 w-3.5" />
        </button>
      )}

      {/* Upload button (setup only) */}
      {buildMode === "setup" && (
        <Button
          size="sm"
          onClick={handleUploadPdf}
          className="h-6 gap-1 bg-accent px-2 text-[11px] text-white hover:bg-accent-hover"
        >
          <Upload className="h-3 w-3" />
          Upload PDF
        </Button>
      )}
    </div>
  );
}
