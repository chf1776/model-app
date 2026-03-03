import { Upload, ZoomIn, ZoomOut, Maximize2, FileStack } from "lucide-react";
import { open as openFileDialog } from "@tauri-apps/plugin-dialog";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAppStore } from "@/store";
import * as api from "@/api";

interface BuildToolbarProps {
  onOpenSourceManager: () => void;
}

export function BuildToolbar({ onOpenSourceManager }: BuildToolbarProps) {
  const project = useAppStore((s) => s.project);
  const activeProjectId = useAppStore((s) => s.activeProjectId);
  const instructionSources = useAppStore((s) => s.instructionSources);
  const viewerZoom = useAppStore((s) => s.viewerZoom);
  const setViewerZoom = useAppStore((s) => s.setViewerZoom);
  const setIsProcessingPdf = useAppStore((s) => s.setIsProcessingPdf);
  const addInstructionSource = useAppStore((s) => s.addInstructionSource);
  const setCurrentSource = useAppStore((s) => s.setCurrentSource);
  const requestFitToView = useAppStore((s) => s.requestFitToView);

  const handleUploadPdf = async () => {
    if (!activeProjectId) return;

    const selected = await openFileDialog({
      multiple: false,
      filters: [{ name: "PDF", extensions: ["pdf"] }],
    });

    if (!selected) return;

    setIsProcessingPdf(true);
    try {
      const source = await api.uploadInstructionPdf(
        activeProjectId,
        selected,
      );
      addInstructionSource(source);
      setCurrentSource(source.id);
      toast.success(`Imported "${source.name}" (${source.page_count} pages)`);
    } catch (err) {
      toast.error(`Failed to import PDF: ${err}`);
    } finally {
      setIsProcessingPdf(false);
    }
  };

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
