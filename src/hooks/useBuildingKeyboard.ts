import { useEffect } from "react";
import { toast } from "sonner";
import { useAppStore } from "@/store";
import { flattenTrackSteps, getReplacedStepIds } from "@/components/build/tree-utils";
import { getEffectiveDryingMinutes } from "@/shared/types";

export function useBuildingKeyboard() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const s = useAppStore.getState();
      if (s.buildView.kind !== "building-track" && s.buildView.kind !== "building-page") return;

      // Ctrl/Cmd+Shift+Z: redo annotation
      if (e.key === "z" && (e.ctrlKey || e.metaKey) && e.shiftKey) {
        e.preventDefault();
        if (s.activeStepId) s.redoAnnotation(s.activeStepId);
        return;
      }
      // Ctrl/Cmd+Z: undo annotation
      if (e.key === "z" && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
        e.preventDefault();
        if (s.activeStepId) s.undoAnnotation(s.activeStepId);
        return;
      }

      if ((e.key === " " || e.key === "Enter") && s.activeStepId) {
        e.preventDefault();
        s.requestStepCompletion(s.activeStepId);
        return;
      }
      if (e.key === "a" || e.key === "A") {
        e.preventDefault();
        if (s.buildView.kind === "building-track" && s.buildView.annotationMode) s.setAnnotationMode(null);
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
        if (s.buildView.kind === "building-page" && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
          if (e.key === "ArrowLeft") s.prevPage();
          else s.nextPage();
        } else {
          const replacedIds = getReplacedStepIds(s.steps);
          const ordered = flattenTrackSteps(s.steps, s.activeTrackId, { excludeReplacedIds: replacedIds });
          const idx = ordered.findIndex((st) => st.id === s.activeStepId);
          if ((e.key === "ArrowLeft" || e.key === "ArrowUp") && idx > 0) {
            s.setActiveStep(ordered[idx - 1].id);
          } else if ((e.key === "ArrowRight" || e.key === "ArrowDown") && idx >= 0 && idx < ordered.length - 1) {
            s.setActiveStep(ordered[idx + 1].id);
          }
        }
        return;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
}
