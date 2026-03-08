import { useState, useEffect } from "react";
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
import { AnnotationToolbar } from "@/components/build/AnnotationToolbar";
import { PageRail } from "@/components/build/PageRail";
import { PageCanvas } from "@/components/build/PageCanvas";
import { MilestoneDialog } from "@/components/build/MilestoneDialog";
import { RelationPill } from "@/components/build/RelationPill";
import { TimerBubble } from "@/components/build/TimerBubble";
import { flattenTrackSteps } from "@/components/build/tree-utils";
import { useUploadPdf } from "@/components/build/useUploadPdf";
import { getEffectiveDryingMinutes } from "@/shared/types";
import { zoomIn, zoomOut } from "@/components/build/zoom-utils";

export default function BuildRoute() {
  // Only subscribe to state needed for rendering layout decisions
  const project = useAppStore((s) => s.project);
  const buildMode = useAppStore((s) => s.buildMode);
  const instructionSources = useAppStore((s) => s.instructionSources);
  const isProcessingPdf = useAppStore((s) => s.isProcessingPdf);
  const activeStepId = useAppStore((s) => s.activeStepId);
  const navMode = useAppStore((s) => s.navMode);
  const loadTimers = useAppStore((s) => s.loadTimers);

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

  // Keyboard navigation — reads store state on-demand via getState()
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const s = useAppStore.getState();

      // Ctrl/Cmd+Shift+Z: redo annotation (building mode only)
      if (e.key === "z" && (e.ctrlKey || e.metaKey) && e.shiftKey) {
        e.preventDefault();
        if (s.buildMode === "building" && s.activeStepId) {
          s.redoAnnotation(s.activeStepId);
        }
        return;
      }
      // Ctrl/Cmd+Z: undo annotation (building) or undo last crop (setup)
      if (e.key === "z" && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
        e.preventDefault();
        if (s.buildMode === "building" && s.activeStepId) {
          s.undoAnnotation(s.activeStepId);
        } else {
          s.undoLastCrop();
        }
        return;
      }

      if (e.key === "?") {
        e.preventDefault();
        setShortcutsOpen(true);
        return;
      }

      // Building mode navigation + completion
      if (s.buildMode === "building") {
        if ((e.key === " " || e.key === "Enter") && s.activeStepId) {
          e.preventDefault();
          s.completeActiveStep();
          return;
        }
        if (e.key === "a" || e.key === "A") {
          e.preventDefault();
          if (s.annotationMode) s.setAnnotationMode(null);
          return;
        }
        if (e.key >= "1" && e.key <= "7") {
          e.preventDefault();
          const toolMap = ["checkmark", "circle", "arrow", "cross", "highlight", "freehand", "text"] as const;
          const idx = parseInt(e.key) - 1;
          s.setAnnotationMode(toolMap[idx]);
          return;
        }
        if ((e.key === "t" || e.key === "T") && s.activeStepId) {
          e.preventDefault();
          const step = s.steps.find((st) => st.id === s.activeStepId);
          if (step && !s.activeTimers.some((t) => t.step_id === step.id)) {
            const mins = getEffectiveDryingMinutes(step);
            if (mins) {
              s.addTimer(step.id, step.title, mins);
            } else {
              toast.info("Use the Start Timer button to enter a duration");
            }
          }
          return;
        }
        if (e.key === "ArrowLeft" || e.key === "ArrowUp" || e.key === "ArrowRight" || e.key === "ArrowDown") {
          e.preventDefault();
          const ordered = flattenTrackSteps(s.steps, s.activeTrackId);
          const idx = ordered.findIndex((st) => st.id === s.activeStepId);
          if ((e.key === "ArrowLeft" || e.key === "ArrowUp") && idx > 0) {
            s.setActiveStep(ordered[idx - 1].id);
          } else if ((e.key === "ArrowRight" || e.key === "ArrowDown") && idx >= 0 && idx < ordered.length - 1) {
            s.setActiveStep(ordered[idx + 1].id);
          }
          return;
        }
      }

      // Setup mode: arrow keys navigate pages
      if (s.buildMode === "setup" && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
        e.preventDefault();
        if (e.key === "ArrowLeft") {
          s.prevPage();
        } else {
          s.nextPage();
        }
        return;
      }

      switch (e.key) {
        case "Tab":
          e.preventDefault();
          if (e.shiftKey) {
            s.prevPage();
          } else {
            s.nextPage();
          }
          break;
        case "+":
        case "=":
          e.preventDefault();
          zoomIn();
          break;
        case "-":
          e.preventDefault();
          zoomOut();
          break;
        case "0":
          e.preventDefault();
          s.requestFitToView();
          break;
        case "r":
        case "R":
          e.preventDefault();
          s.rotatePage();
          break;
        case "c":
        case "C":
          e.preventDefault();
          if (s.buildMode === "setup") s.setCanvasMode("crop");
          break;
        case "v":
          e.preventDefault();
          s.setCanvasMode("view");
          break;
        case "f":
        case "F": {
          e.preventDefault();
          if (s.buildMode === "building") break;
          const page = s.currentSourcePages[s.currentPageIndex];
          if (!s.activeTrackId) {
            toast.info("Select a track first");
            break;
          }
          if (!page) break;
          const trackSteps = s.steps.filter((st) => st.track_id === s.activeTrackId);
          const title = `Step ${trackSteps.length + 1}`;
          api
            .createStep({
              track_id: s.activeTrackId,
              title,
              source_page_id: page.id,
              is_full_page: true,
              crop_x: 0,
              crop_y: 0,
              crop_w: page.width,
              crop_h: page.height,
            })
            .then((step) => {
              const fresh = useAppStore.getState();
              fresh.addStep(step);
              fresh.pushUndo(step.id);
              fresh.setActiveStep(step.id);
              if (fresh.activeProjectId) fresh.loadTracks(fresh.activeProjectId);
            })
            .catch((err) => toast.error(`Failed to create step: ${err}`));
          break;
        }
        case "Escape":
          e.preventDefault();
          if (s.selectedStepIds.length > 0) {
            s.clearSelectedSteps();
          } else if (s.activeStepId) {
            s.setActiveStep(null);
          } else if (s.canvasMode === "crop") {
            s.setCanvasMode("view");
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- reads state on-demand via getState()

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
            {navMode === "track" ? <BuildingRail /> : <PageRail />}

            <div className="relative flex min-w-0 flex-1 flex-col bg-[#E8E4DF]">
              <div className="relative min-h-0 flex-1">
                {navMode === "track" ? <CropCanvas /> : <PageCanvas />}
                {navMode === "track" && <AnnotationToolbar />}
                <RelationPill />
              </div>
              <NavigationBar />
            </div>

            {activeStepId && <BuildingStepPanel />}
            <MilestoneDialog />
          </>
        )}
      </div>

      <KeyboardShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
      <TimerBubble />
    </div>
  );
}
