import { useEffect } from "react";
import { useAppStore } from "@/store";

export function useSetupKeyboard() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const s = useAppStore.getState();
      if (s.buildView.kind !== "setup-tracks" && s.buildView.kind !== "setup-sprues") return;

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
          if ("canvasMode" in s.buildView && s.buildView.canvasMode === "polygon" && s.polygonDraftPoints.length >= 3) {
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
        case "F":
          e.preventDefault();
          s.createFullPageStep();
          return;
        case "Escape":
          e.preventDefault();
          if ("canvasMode" in s.buildView && s.buildView.canvasMode === "polygon") {
            if (s.polygonDraftPoints.length > 0) {
              s.removeLastPolygonPoint();
            } else {
              s.setCanvasMode("view");
            }
          } else if (s.selectedStepIds.length > 0) {
            s.clearSelectedSteps();
          } else if (s.activeStepId) {
            s.setActiveStep(null);
          } else if ("canvasMode" in s.buildView && s.buildView.canvasMode === "crop") {
            s.setCanvasMode("view");
          }
          return;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
}
