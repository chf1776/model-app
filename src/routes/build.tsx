import { useState, useEffect, useCallback } from "react";
import { Wrench, Plus } from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/store";
import * as api from "@/api";
import { CreateProjectDialog } from "@/components/shared/CreateProjectDialog";
import { Button } from "@/components/ui/button";
import { BuildToolbar } from "@/components/build/BuildToolbar";
import { InstructionCanvas } from "@/components/build/InstructionCanvas";
import { PageNavigator } from "@/components/build/PageNavigator";
import { EmptyInstructionsState } from "@/components/build/EmptyInstructionsState";
import { ProcessingOverlay } from "@/components/build/ProcessingOverlay";
import { SourceManagerPanel } from "@/components/build/SourceManagerPanel";
import { TrackRail } from "@/components/build/TrackRail";
import { StepEditorPanel } from "@/components/build/StepEditorPanel";
import { useUploadPdf } from "@/components/build/useUploadPdf";

export default function BuildRoute() {
  const project = useAppStore((s) => s.project);
  const instructionSources = useAppStore((s) => s.instructionSources);
  const isProcessingPdf = useAppStore((s) => s.isProcessingPdf);
  const nextPage = useAppStore((s) => s.nextPage);
  const prevPage = useAppStore((s) => s.prevPage);
  const viewerZoom = useAppStore((s) => s.viewerZoom);
  const setViewerZoom = useAppStore((s) => s.setViewerZoom);
  const requestFitToView = useAppStore((s) => s.requestFitToView);
  const rotatePage = useAppStore((s) => s.rotatePage);
  const activeStepId = useAppStore((s) => s.activeStepId);
  const setActiveStep = useAppStore((s) => s.setActiveStep);
  const canvasMode = useAppStore((s) => s.canvasMode);
  const setCanvasMode = useAppStore((s) => s.setCanvasMode);
  const activeTrackId = useAppStore((s) => s.activeTrackId);
  const currentSourcePages = useAppStore((s) => s.currentSourcePages);
  const currentPageIndex = useAppStore((s) => s.currentPageIndex);
  const steps = useAppStore((s) => s.steps);
  const addStep = useAppStore((s) => s.addStep);
  const activeProjectId = useAppStore((s) => s.activeProjectId);
  const loadTracks = useAppStore((s) => s.loadTracks);

  const [createOpen, setCreateOpen] = useState(false);
  const [sourceManagerOpen, setSourceManagerOpen] = useState(false);

  const hasSources = instructionSources.length > 0;
  const handleUploadPdf = useUploadPdf();

  // Close source manager when processing starts
  useEffect(() => {
    if (isProcessingPdf) setSourceManagerOpen(false);
  }, [isProcessingPdf]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't capture keys when typing in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key) {
        case "Tab":
          e.preventDefault();
          if (e.shiftKey) {
            prevPage();
          } else {
            nextPage();
          }
          break;
        case "+":
        case "=":
          e.preventDefault();
          setViewerZoom(viewerZoom * 1.2);
          break;
        case "-":
          e.preventDefault();
          setViewerZoom(viewerZoom / 1.2);
          break;
        case "0":
          e.preventDefault();
          requestFitToView();
          break;
        case "r":
        case "R":
          e.preventDefault();
          rotatePage();
          break;
        case "c":
        case "C":
          e.preventDefault();
          setCanvasMode("crop");
          break;
        case "v":
          e.preventDefault();
          setCanvasMode("view");
          break;
        case "f":
        case "F": {
          e.preventDefault();
          const page = currentSourcePages[currentPageIndex];
          if (!activeTrackId) {
            toast.info("Select a track first");
            break;
          }
          if (!page) break;
          const trackSteps = steps.filter((s) => s.track_id === activeTrackId);
          const title = `Step ${trackSteps.length + 1}`;
          api
            .createStep({
              track_id: activeTrackId,
              title,
              source_page_id: page.id,
              is_full_page: true,
              crop_x: 0,
              crop_y: 0,
              crop_w: page.width,
              crop_h: page.height,
            })
            .then((step) => {
              addStep(step);
              setActiveStep(step.id);
              if (activeProjectId) loadTracks(activeProjectId);
            })
            .catch((err) => toast.error(`Failed to create step: ${err}`));
          break;
        }
        case "Escape":
          e.preventDefault();
          if (activeStepId) {
            setActiveStep(null);
          } else if (canvasMode === "crop") {
            setCanvasMode("view");
          }
          break;
      }
    },
    [
      nextPage, prevPage, viewerZoom, setViewerZoom, requestFitToView, rotatePage,
      setCanvasMode, canvasMode, activeStepId, setActiveStep, activeTrackId,
      currentSourcePages, currentPageIndex, steps, addStep, activeProjectId, loadTracks,
    ],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!project) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
            <Wrench className="h-6 w-6 text-accent" />
          </div>
          <h2 className="mb-1 text-sm font-semibold text-text-primary">
            No Active Project
          </h2>
          <p className="mb-4 max-w-[240px] text-xs text-text-tertiary">
            Create a project or select one from the dropdown to start building.
          </p>
          <Button
            size="sm"
            onClick={() => setCreateOpen(true)}
            className="gap-1.5 bg-accent text-xs text-white hover:bg-accent-hover"
          >
            <Plus className="h-3.5 w-3.5" />
            New Project
          </Button>
        </div>
        <CreateProjectDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
        />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <BuildToolbar
        onOpenSourceManager={() => setSourceManagerOpen((v) => !v)}
      />

      <div className="flex flex-1 overflow-hidden">
        <TrackRail />

        <div className="relative flex-1 bg-[#E8E4DF]">
          {isProcessingPdf && <ProcessingOverlay />}

          {sourceManagerOpen && (
            <SourceManagerPanel onClose={() => setSourceManagerOpen(false)} />
          )}

          {hasSources ? (
            <>
              <InstructionCanvas />
              <PageNavigator />
            </>
          ) : (
            <EmptyInstructionsState onUpload={handleUploadPdf} />
          )}
        </div>

        {activeStepId && <StepEditorPanel />}
      </div>
    </div>
  );
}
