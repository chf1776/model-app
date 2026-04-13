import { Upload, ZoomIn, ZoomOut, Maximize2, FileStack, RotateCw, MousePointer, Crop, Pentagon, RectangleHorizontal, Keyboard, Settings2, Hammer, List, FileText, Eraser, Box } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { SegmentedPill } from "@/components/shared/SegmentedPill";
import { useAppStore } from "@/store";
import { getCanvasMode } from "@/shared/types";
import { useUploadPdf } from "./useUploadPdf";
import { zoomIn, zoomOut } from "./zoom-utils";

interface BuildToolbarProps {
  onOpenSourceManager: () => void;
  onOpenShortcuts?: () => void;
}

export function BuildToolbar({ onOpenSourceManager, onOpenShortcuts }: BuildToolbarProps) {
  const project = useAppStore((s) => s.project);
  const buildView = useAppStore((s) => s.buildView);
  const setBuildView = useAppStore((s) => s.setBuildView);
  const tracks = useAppStore((s) => s.tracks);
  const activeTrackId = useAppStore((s) => s.activeTrackId);
  const instructionSources = useAppStore((s) => s.instructionSources);
  const viewerZoom = useAppStore((s) => s.viewerZoom);
  const requestFitToView = useAppStore((s) => s.requestFitToView);
  const rotatePage = useAppStore((s) => s.rotatePage);
  const setCanvasMode = useAppStore((s) => s.setCanvasMode);
  const activeStepId = useAppStore((s) => s.activeStepId);
  const clearClipPolygon = useAppStore((s) => s.clearClipPolygon);
  const sprueRefs = useAppStore((s) => s.sprueRefs);
  const steps = useAppStore((s) => s.steps);
  const createFullPageStep = useAppStore((s) => s.createFullPageStep);

  const isSetup = buildView.kind === "setup-tracks" || buildView.kind === "setup-sprues";
  const canvasMode = getCanvasMode(buildView);
  const setupRailMode = buildView.kind === "setup-sprues" ? "sprues" : "steps";
  const navMode = buildView.kind === "building-page" ? "page" : "track";

  const activeTrack = activeTrackId
    ? tracks.find((t) => t.id === activeTrackId) ?? null
    : null;

  const handleUploadPdf = useUploadPdf();

  const handleZoomIn = zoomIn;
  const handleZoomOut = zoomOut;
  const handleFitToView = () => requestFitToView();

  const zoomPercent = Math.round(viewerZoom * 100);

  // Polygon mode requires a track (same as crop mode)
  const activeStep = activeStepId ? steps.find((s) => s.id === activeStepId) : null;
  const canPolygon = activeTrackId != null;
  const hasPolygon = activeStep != null && activeStep.clip_polygon != null;

  return (
    <div className="flex items-center gap-2 border-b border-border bg-background px-3 py-1">
      {/* Left: Mode toggle */}
      <SegmentedPill
        size="sm"
        items={[
          { value: "setup" as const, label: "Setup", icon: <Settings2 className="h-3 w-3" /> },
          { value: "building" as const, label: "Building", icon: <Hammer className="h-3 w-3" /> },
        ]}
        value={isSetup ? "setup" : "building"}
        onChange={(v) => {
          if (v === "setup") setBuildView({ kind: "setup-tracks", canvasMode: "view" });
          else setBuildView({ kind: "building-track", annotationMode: null });
        }}
      />

      {isSetup && (
        <>
          <Separator orientation="vertical" className="h-[14px]" />
          <SegmentedPill
            size="sm"
            items={[
              { value: "steps" as const, label: "Steps", icon: <List className="h-3 w-3" /> },
              { value: "sprues" as const, label: "Sprues", icon: <Box className="h-3 w-3" />, count: sprueRefs.length || undefined },
            ]}
            value={setupRailMode}
            onChange={(v) => {
              if (v === "sprues") setBuildView({ kind: "setup-sprues", canvasMode: "view" });
              else setBuildView({ kind: "setup-tracks", canvasMode: "view" });
            }}
          />
        </>
      )}

      {!isSetup && instructionSources.length > 0 && (
        <>
          <Separator orientation="vertical" className="h-[14px]" />
          <SegmentedPill
            size="sm"
            items={[
              { value: "track" as const, label: "Steps", icon: <List className="h-3 w-3" /> },
              { value: "page" as const, label: "Pages", icon: <FileText className="h-3 w-3" /> },
            ]}
            value={navMode}
            onChange={(v) => {
              if (v === "page") setBuildView({ kind: "building-page" });
              else setBuildView({ kind: "building-track", annotationMode: null });
            }}
          />
        </>
      )}

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
          {/* View/Crop toggle — setup only */}
          {isSetup && (
            <>
              <div className="flex items-center rounded-md border border-border">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setCanvasMode("view")}
                      className={`rounded-l-[5px] px-1.5 py-1 ${
                        canvasMode === "view"
                          ? "bg-accent text-white"
                          : "text-text-tertiary hover:bg-muted hover:text-text-secondary"
                      }`}
                    >
                      <MousePointer className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>View mode (V)</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setCanvasMode("crop")}
                      className={`px-1.5 py-1 ${
                        canvasMode === "crop"
                          ? "bg-accent text-white"
                          : "text-text-tertiary hover:bg-muted hover:text-text-secondary"
                      }`}
                    >
                      <Crop className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Crop mode (C)</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setCanvasMode("polygon")}
                      disabled={!canPolygon}
                      className={`rounded-r-[5px] px-1.5 py-1 ${
                        canvasMode === "polygon"
                          ? "bg-accent text-white"
                          : canPolygon
                            ? "text-text-tertiary hover:bg-muted hover:text-text-secondary"
                            : "cursor-not-allowed text-text-tertiary/40"
                      }`}
                    >
                      <Pentagon className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Polygon crop (P)</TooltipContent>
                </Tooltip>
              </div>

              {/* Clear Polygon button — only when active step has a saved polygon */}
              {hasPolygon && canvasMode !== "polygon" && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => activeStepId && clearClipPolygon(activeStepId)}
                      className="rounded p-1 text-text-tertiary hover:bg-muted hover:text-text-secondary"
                    >
                      <Eraser className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Clear polygon</TooltipContent>
                </Tooltip>
              )}

              {/* Full page button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={createFullPageStep}
                    className="rounded p-1 text-text-tertiary hover:bg-muted hover:text-text-secondary"
                  >
                    <RectangleHorizontal className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Full page step (F)</TooltipContent>
              </Tooltip>

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

          {/* Zoom controls — both modes */}
          <div className="flex items-center gap-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleZoomOut}
                  className="rounded p-1 text-text-tertiary hover:bg-muted hover:text-text-secondary"
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Zoom out</TooltipContent>
            </Tooltip>
            <span className="min-w-[36px] text-center font-mono text-[10px] tabular-nums text-text-tertiary">
              {zoomPercent}%
            </span>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleZoomIn}
                  className="rounded p-1 text-text-tertiary hover:bg-muted hover:text-text-secondary"
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Zoom in</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleFitToView}
                  className="rounded p-1 text-text-tertiary hover:bg-muted hover:text-text-secondary"
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Fit to view</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={rotatePage}
                  className="rounded p-1 text-text-tertiary hover:bg-muted hover:text-text-secondary"
                >
                  <RotateCw className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Rotate page (R)</TooltipContent>
            </Tooltip>
          </div>

          <Separator orientation="vertical" className="h-[14px]" />
        </>
      )}

      {/* Shortcuts button — both modes */}
      {onOpenShortcuts && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onOpenShortcuts}
              className="rounded p-1 text-text-tertiary hover:bg-muted hover:text-text-secondary"
            >
              <Keyboard className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Keyboard shortcuts (?)</TooltipContent>
        </Tooltip>
      )}

      {/* Upload button — setup only */}
      {isSetup && (
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
