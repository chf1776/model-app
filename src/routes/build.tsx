import { useState, useEffect, useCallback } from "react";
import { Wrench, Plus } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { useAppStore } from "@/store";
import { CreateProjectDialog } from "@/components/shared/CreateProjectDialog";
import { Button } from "@/components/ui/button";
import { BuildToolbar } from "@/components/build/BuildToolbar";
import { InstructionCanvas } from "@/components/build/InstructionCanvas";
import { PageNavigator } from "@/components/build/PageNavigator";
import { EmptyInstructionsState } from "@/components/build/EmptyInstructionsState";
import { ProcessingOverlay } from "@/components/build/ProcessingOverlay";
import { SourceManagerPanel } from "@/components/build/SourceManagerPanel";
import { TrackRail } from "@/components/build/TrackRail";
import { SprueRail } from "@/components/build/SprueRail";
import { StepEditorPanel } from "@/components/build/StepEditorPanel";
import { KeyboardShortcutsDialog } from "@/components/build/KeyboardShortcutsDialog";
import { NavigationBar } from "@/components/build/NavigationBar";
import { BuildingRail } from "@/components/build/BuildingRail";
import { BuildingStepPanel } from "@/components/build/BuildingStepPanel";
import { PageInfoPanel } from "@/components/build/PageInfoPanel";
import { CropCanvas } from "@/components/build/CropCanvas";
import { AnnotationToolbar } from "@/components/build/AnnotationToolbar";
import { PageRail } from "@/components/build/PageRail";
import { PageCanvas } from "@/components/build/PageCanvas";
import { MilestoneDialog } from "@/components/build/MilestoneDialog";
import { CompletionWarningDialog } from "@/components/build/CompletionWarningDialog";
import { PolygonSwitchDialog } from "@/components/build/PolygonSwitchDialog";
import { RelationPill } from "@/components/build/RelationPill";
import { TimerBubble } from "@/components/build/TimerBubble";
import { useUploadPdf } from "@/components/build/useUploadPdf";
import { useSharedKeyboard } from "@/hooks/useSharedKeyboard";
import { useSetupKeyboard } from "@/hooks/useSetupKeyboard";
import { useBuildingKeyboard } from "@/hooks/useBuildingKeyboard";

export default function BuildRoute() {
  // Only subscribe to state needed for rendering layout decisions
  const project = useAppStore((s) => s.project);
  const buildView = useAppStore((s) => s.buildView);
  const instructionSources = useAppStore((s) => s.instructionSources);
  const isProcessingPdf = useAppStore((s) => s.isProcessingPdf);
  const activeStepId = useAppStore((s) => s.activeStepId);
  const loadTimers = useAppStore((s) => s.loadTimers);
  const activeProjectId = useAppStore((s) => s.activeProjectId);
  const refreshPaletteEntries = useAppStore((s) => s.refreshProjectPaletteEntries);

  const isSetup = buildView.kind === "setup-tracks" || buildView.kind === "setup-sprues";

  // Load timers and refresh palette entries on mount
  useEffect(() => {
    loadTimers();
    if (activeProjectId) refreshPaletteEntries();
  }, [loadTimers, activeProjectId, refreshPaletteEntries]);

  const [createOpen, setCreateOpen] = useState(false);
  const [sourceManagerOpen, setSourceManagerOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  const hasSources = instructionSources.length > 0;
  const handleUploadPdf = useUploadPdf();

  // Close source manager when processing starts
  useEffect(() => {
    if (isProcessingPdf) setSourceManagerOpen(false);
  }, [isProcessingPdf]);

  // Keyboard hooks (each registers its own window listener, reads state on-demand)
  const openShortcuts = useCallback(() => setShortcutsOpen(true), []);
  useSharedKeyboard(openShortcuts);
  useSetupKeyboard();
  useBuildingKeyboard();

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
        {isSetup ? (
          <>
            {buildView.kind === "setup-sprues" ? <SprueRail /> : <TrackRail />}

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

                <Toaster
                  id="canvas"
                  position="bottom-right"
                  style={{ position: "absolute" }}
                  offset={8}
                />
              </div>
            </div>

            {activeStepId && <StepEditorPanel />}
          </>
        ) : (
          <>
            {buildView.kind === "building-track" ? <BuildingRail /> : <PageRail />}

            <div className="relative flex min-w-0 flex-1 flex-col bg-[#E8E4DF]">
              <div className="relative min-h-0 flex-1">
                {buildView.kind === "building-track" ? <CropCanvas /> : <PageCanvas />}
                {buildView.kind === "building-track" && <AnnotationToolbar />}
                <RelationPill />
              </div>
              <NavigationBar />
            </div>

            {buildView.kind === "building-page" ? <PageInfoPanel /> : activeStepId && <BuildingStepPanel />}
            <MilestoneDialog />
            <CompletionWarningDialog />
            <PolygonSwitchDialog />
          </>
        )}
      </div>

      <KeyboardShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
      <TimerBubble />
    </div>
  );
}
