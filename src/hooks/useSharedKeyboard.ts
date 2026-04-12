import { useEffect } from "react";
import { useAppStore } from "@/store";
import { zoomIn, zoomOut } from "@/components/build/zoom-utils";

export function useSharedKeyboard(onOpenShortcuts: () => void) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.ctrlKey || e.metaKey) return; // let other hooks handle Ctrl combos

      const s = useAppStore.getState();

      switch (e.key) {
        case "?":
          e.preventDefault();
          onOpenShortcuts();
          return;
        case "Tab":
          e.preventDefault();
          if (e.shiftKey) s.prevPage();
          else s.nextPage();
          return;
        case "+":
        case "=":
          e.preventDefault();
          zoomIn();
          return;
        case "-":
          e.preventDefault();
          zoomOut();
          return;
        case "0":
          e.preventDefault();
          s.requestFitToView();
          return;
        case "r":
        case "R":
          e.preventDefault();
          s.rotatePage();
          return;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onOpenShortcuts]);
}
