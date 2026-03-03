import { Upload, ZoomIn, ZoomOut, Maximize2, FileStack, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAppStore } from "@/store";
import { useUploadPdf } from "./useUploadPdf";

interface BuildToolbarProps {
  onOpenSourceManager: () => void;
}

export function BuildToolbar({ onOpenSourceManager }: BuildToolbarProps) {
  const project = useAppStore((s) => s.project);
  const instructionSources = useAppStore((s) => s.instructionSources);
  const viewerZoom = useAppStore((s) => s.viewerZoom);
  const setViewerZoom = useAppStore((s) => s.setViewerZoom);
  const requestFitToView = useAppStore((s) => s.requestFitToView);
  const rotatePage = useAppStore((s) => s.rotatePage);

  const handleUploadPdf = useUploadPdf();

  const handleZoomIn = () => setViewerZoom(viewerZoom * 1.2);
  const handleZoomOut = () => setViewerZoom(viewerZoom / 1.2);

  const handleFitToView = () => requestFitToView();

  const zoomPercent = Math.round(viewerZoom * 100);

  return (
    <div className="flex items-center gap-2 border-b border-border bg-background px-3 py-1">
      {/* Left: Mode label */}
      <span className="text-[11px] font-medium text-accent">Setup</span>

      <Separator orientation="vertical" className="h-[14px]" />

      <span className="text-xs font-medium text-text-primary">
        {project?.name}
      </span>

      <div className="flex-1" />

      {/* Right: Actions */}
      {instructionSources.length > 0 && (
        <>
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

      {/* Upload button */}
      <Button
        size="sm"
        onClick={handleUploadPdf}
        className="h-6 gap-1 bg-accent px-2 text-[11px] text-white hover:bg-accent-hover"
      >
        <Upload className="h-3 w-3" />
        Upload PDF
      </Button>
    </div>
  );
}
