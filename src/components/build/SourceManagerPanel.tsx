import { FileText, Trash2, RefreshCw, X, Upload } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAppStore } from "@/store";
import { formatProvenanceLabel } from "@/shared/types";
import * as api from "@/api";
import { useUploadPdf } from "./useUploadPdf";

interface SourceManagerPanelProps {
  onClose: () => void;
}

export function SourceManagerPanel({ onClose }: SourceManagerPanelProps) {
  const activeProjectId = useAppStore((s) => s.activeProjectId);
  const instructionSources = useAppStore((s) => s.instructionSources);
  const currentSourceId = useAppStore((s) => s.currentSourceId);
  const setCurrentSource = useAppStore((s) => s.setCurrentSource);
  const removeInstructionSource = useAppStore((s) => s.removeInstructionSource);
  const setIsProcessingPdf = useAppStore((s) => s.setIsProcessingPdf);
  const loadInstructionSources = useAppStore((s) => s.loadInstructionSources);

  const handleUpload = useUploadPdf();

  const handleDelete = async (sourceId: string, sourceName: string) => {
    try {
      await api.deleteInstructionSource(sourceId);
      removeInstructionSource(sourceId);
      toast.success(`Deleted "${sourceName}"`);
    } catch (err) {
      toast.error(`Failed to delete: ${err}`);
    }
  };

  const handleProcess = async (sourceId: string) => {
    setIsProcessingPdf(true);
    try {
      const updated = await api.processInstructionSource(sourceId);
      // Reload sources to get updated page counts
      if (activeProjectId) {
        await loadInstructionSources(activeProjectId);
      }
      setCurrentSource(updated.id);
      toast.success(`Processed "${updated.name}" (${updated.page_count} pages)`);
    } catch (err) {
      toast.error(`Failed to process: ${err}`);
    } finally {
      setIsProcessingPdf(false);
    }
  };

  return (
    <div className="absolute right-3 top-1 z-30 w-64 rounded-md border border-border bg-card shadow-lg">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="text-xs font-semibold text-text-primary">
          Instruction Sources
        </span>
        <button
          onClick={onClose}
          className="rounded p-0.5 text-text-tertiary hover:bg-muted hover:text-text-secondary"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="max-h-[240px] overflow-y-auto p-1.5">
        {instructionSources.length === 0 ? (
          <p className="px-2 py-3 text-center text-xs text-text-tertiary">
            No sources uploaded
          </p>
        ) : (
          instructionSources.map((source) => (
            <div
              key={source.id}
              className={`group flex items-center gap-2 rounded px-2 py-1.5 ${
                source.id === currentSourceId
                  ? "bg-accent/8"
                  : "hover:bg-muted"
              }`}
            >
              <button
                onClick={() => setCurrentSource(source.id)}
                className="flex min-w-0 flex-1 items-center gap-2"
              >
                <FileText className="h-3.5 w-3.5 shrink-0 text-text-tertiary" />
                <div className="min-w-0 text-left">
                  <p className="truncate text-xs font-medium text-text-primary">
                    {source.name}
                  </p>
                  <p className="text-[10px] text-text-tertiary">
                    {source.page_count > 0
                      ? `${source.page_count} pages`
                      : "Unprocessed"}
                  </p>
                  {formatProvenanceLabel(source.source_kit_name, source.source_kit_year) && (
                    <p className="text-[9px] text-text-tertiary">
                      {formatProvenanceLabel(source.source_kit_name, source.source_kit_year)}
                    </p>
                  )}
                </div>
              </button>

              <div className="flex shrink-0 items-center gap-0.5 opacity-0 group-hover:opacity-100">
                {source.page_count === 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => handleProcess(source.id)}
                        className="rounded p-1 text-text-tertiary hover:bg-muted hover:text-accent"
                      >
                        <RefreshCw className="h-3 w-3" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Process PDF</TooltipContent>
                  </Tooltip>
                )}

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          className="rounded p-1 text-text-tertiary hover:bg-red-50 hover:text-red-500"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Delete source</TooltipContent>
                    </Tooltip>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Source?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will delete "{source.name}" and all its rendered
                        pages. This cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="text-xs">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(source.id, source.name)}
                        className="bg-red-500 text-xs hover:bg-red-600"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="border-t border-border p-1.5">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleUpload}
          className="h-7 w-full gap-1.5 text-xs text-text-secondary hover:text-accent"
        >
          <Upload className="h-3 w-3" />
          Upload PDF
        </Button>
      </div>
    </div>
  );
}
