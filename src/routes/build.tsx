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
import { KeyboardShortcutsDialog } from "@/components/build/KeyboardShortcutsDialog";
import { NavigationBar } from "@/components/build/NavigationBar";
import { BuildingRail } from "@/components/build/BuildingRail";
import { BuildingStepPanel } from "@/components/build/BuildingStepPanel";
import { CropCanvas } from "@/components/build/CropCanvas";
import { MilestoneDialog } from "@/components/build/MilestoneDialog";
import { RelationPill } from "@/components/build/RelationPill";
import { TimerBubble } from "@/components/build/TimerBubble";
import { flattenTrackSteps } from "@/components/build/tree-utils";
import { useUploadPdf } from "@/components/build/useUploadPdf";
import { useTimerTick } from "@/hooks/useTimerTick";

export default function BuildRoute() {
  const project = useAppStore((s) => s.project);
  const buildMode = useAppStore((s) => s.buildMode);
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
  const selectedStepIds = useAppStore((s) => s.selectedStepIds);
  const clearSelectedSteps = useAppStore((s) => s.clearSelectedSteps);
  const currentSourcePages = useAppStore((s) => s.currentSourcePages);
  const currentPageIndex = useAppStore((s) => s.currentPageIndex);
  const steps = useAppStore((s) => s.steps);
  const addStep = useAppStore((s) => s.addStep);
  const activeProjectId = useAppStore((s) => s.activeProjectId);
  const loadTracks = useAppStore((s) => s.loadTracks);
  const pushUndo = useAppStore((s) => s.pushUndo);
  const undoLastCrop = useAppStore((s) => s.undoLastCrop);
  const completeActiveStep = useAppStore((s) => s.completeActiveStep);
  const activeTimers = useAppStore((s) => s.activeTimers);
  const addTimer = useAppStore((s) => s.addTimer);
  const loadTimers = useAppStore((s) => s.loadTimers);

  useTimerTick();

  // Load timers on mount
  useEffect(() => {
    loadTimers();
  }, [loadTimers]);

  const [createOpen, setCreateOpen] = useState(false);
  const [sourceManagerOpen, setSourceManagerOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

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

      // Ctrl/Cmd+Z: undo last crop
      if (e.key === "z" && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
        e.preventDefault();
        undoLastCrop();
        return;
      }

      if (e.key === "?") {
        e.preventDefault();
        setShortcutsOpen(true);
        return;
      }

      // Building mode navigation + completion
      if (buildMode === "building") {
        if ((e.key === " " || e.key === "Enter") && activeStepId) {
          e.preventDefault();
          completeActiveStep();
          return;
        }
        if ((e.key === "t" || e.key === "T") && activeStepId) {
          e.preventDefault();
          const s = steps.find((st) => st.id === activeStepId);
          if (s?.drying_time_min && s.drying_time_min > 0 && !activeTimers.some((t) => t.step_id === s.id)) {
            addTimer(s.id, s.title, s.drying_time_min);
          }
          return;
        }
        if (e.key === "ArrowLeft" || e.key === "ArrowUp" || e.key === "ArrowRight" || e.key === "ArrowDown") {
          e.preventDefault();
          const ordered = flattenTrackSteps(steps, activeTrackId);
          const idx = ordered.findIndex((s) => s.id === activeStepId);
          if ((e.key === "ArrowLeft" || e.key === "ArrowUp") && idx > 0) {
            setActiveStep(ordered[idx - 1].id);
          } else if ((e.key === "ArrowRight" || e.key === "ArrowDown") && idx >= 0 && idx < ordered.length - 1) {
            setActiveStep(ordered[idx + 1].id);
          }
          return;
        }
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
          if (buildMode === "setup") setCanvasMode("crop");
          break;
        case "v":
          e.preventDefault();
          setCanvasMode("view");
          break;
        case "f":
        case "F": {
          e.preventDefault();
          if (buildMode === "building") break;
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
              pushUndo(step.id);
              setActiveStep(step.id);
              if (activeProjectId) loadTracks(activeProjectId);
            })
            .catch((err) => toast.error(`Failed to create step: ${err}`));
          break;
        }
        case "Escape":
          e.preventDefault();
          if (selectedStepIds.length > 0) {
            clearSelectedSteps();
          } else if (activeStepId) {
            setActiveStep(null);
          } else if (canvasMode === "crop") {
            setCanvasMode("view");
          }
          break;
      }
    },
    [
      buildMode,
      nextPage, prevPage, viewerZoom, setViewerZoom, requestFitToView, rotatePage,
      setCanvasMode, canvasMode, activeStepId, setActiveStep, activeTrackId,
      selectedStepIds, clearSelectedSteps,
      currentSourcePages, currentPageIndex, steps, addStep, pushUndo, activeProjectId, loadTracks,
      undoLastCrop, completeActiveStep, activeTimers, addTimer,
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
        onOpenShortcuts={() => setShortcutsOpen(true)}
      />

      <div className="flex flex-1 overflow-hidden">
        {buildMode === "setup" ? (
          <>
            <TrackRail />

            <div className="relative flex min-w-0 flex-1 flex-col bg-[#E8E4DF]">
              <div className="relative min-h-0 flex-1">
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
            </div>

            {activeStepId && <StepEditorPanel />}
          </>
        ) : (
          <>
            <BuildingRail />

            <div className="relative flex min-w-0 flex-1 flex-col bg-[#E8E4DF]">
              <div className="relative min-h-0 flex-1">
                <CropCanvas />
                <RelationPill />
                <TimerBubble />
              </div>
              <NavigationBar />
            </div>

            {activeStepId && <BuildingStepPanel />}
            <MilestoneDialog />
          </>
        )}
      </div>

      <KeyboardShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
    </div>
  );
}
