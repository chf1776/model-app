import { useEffect } from "react";
import { toast } from "sonner";
import { useAppStore } from "@/store";
import * as api from "@/api";

export function useSetupKeyboard() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const s = useAppStore.getState();
      if (s.buildMode !== "setup") return;

      // Ctrl/Cmd+Z: undo last crop
      if (e.key === "z" && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
        e.preventDefault();
        s.undoLastCrop();
        return;
      }

      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          s.prevPage();
          return;
        case "ArrowRight":
          e.preventDefault();
          s.nextPage();
          return;
        case "Enter":
          if (s.canvasMode === "polygon" && s.polygonDraftPoints.length >= 3) {
            e.preventDefault();
            s.savePolygon();
          }
          return;
        case "c":
        case "C":
          e.preventDefault();
          s.setCanvasMode("crop");
          return;
        case "p":
        case "P":
          e.preventDefault();
          s.setCanvasMode("polygon");
          return;
        case "v":
          e.preventDefault();
          s.setCanvasMode("view");
          return;
        case "f":
        case "F": {
          e.preventDefault();
          const page = s.currentSourcePages[s.currentPageIndex];
          if (!s.activeTrackId) {
            toast.info("Select a track first");
            return;
          }
          if (!page) return;
          const trackSteps = s.steps.filter((st) => st.track_id === s.activeTrackId);
          const rootCount = trackSteps.filter((st) => !st.parent_step_id).length;
          const title = `Step ${rootCount + 1}`;
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
              fresh.triggerAutoDetect(step.id);
              if (fresh.activeProjectId) fresh.loadTracks(fresh.activeProjectId);
              toast.success("Step created", { toasterId: "canvas" });
            })
            .catch((err) => toast.error(`Failed to create step: ${err}`, { toasterId: "canvas" }));
          return;
        }
        case "Escape":
          e.preventDefault();
          if (s.canvasMode === "polygon") {
            if (s.polygonDraftPoints.length > 0) {
              s.removeLastPolygonPoint();
            } else {
              s.setCanvasMode("view");
            }
          } else if (s.selectedStepIds.length > 0) {
            s.clearSelectedSteps();
          } else if (s.activeStepId) {
            s.setActiveStep(null);
          } else if (s.canvasMode === "crop") {
            s.setCanvasMode("view");
          }
          return;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
}
