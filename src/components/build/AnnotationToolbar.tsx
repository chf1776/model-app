import { useState, useEffect } from "react";
import { Check, Circle, MoveRight, X, Highlighter, Pencil, Type, Trash2, Undo2 } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useAppStore } from "@/store";
import type { Annotation, AnnotationTool } from "@/shared/types";

const EMPTY_ANNOTATIONS: Annotation[] = [];

const TOOLS: { tool: AnnotationTool; icon: React.ReactNode; label: string; key: string }[] = [
  { tool: "checkmark", icon: <Check className="h-3.5 w-3.5" />, label: "Checkmark", key: "1" },
  { tool: "circle", icon: <Circle className="h-3.5 w-3.5" />, label: "Circle", key: "2" },
  { tool: "arrow", icon: <MoveRight className="h-3.5 w-3.5" />, label: "Arrow", key: "3" },
  { tool: "cross", icon: <X className="h-3.5 w-3.5" />, label: "Cross", key: "4" },
  { tool: "highlight", icon: <Highlighter className="h-3.5 w-3.5" />, label: "Highlight", key: "5" },
  { tool: "freehand", icon: <Pencil className="h-3.5 w-3.5" />, label: "Freehand", key: "6" },
  { tool: "text", icon: <Type className="h-3.5 w-3.5" />, label: "Text", key: "7" },
];

const COLOR_SWATCHES = [
  "#ef4444", // red
  "#3b82f6", // blue
  "#22c55e", // green
  "#facc15", // yellow
  "#ffffff", // white
  "#171717", // black
];

export function AnnotationToolbar() {
  const annotationMode = useAppStore((s) => s.annotationMode);
  const setAnnotationMode = useAppStore((s) => s.setAnnotationMode);
  const annotationColor = useAppStore((s) => s.annotationColor);
  const setAnnotationColor = useAppStore((s) => s.setAnnotationColor);
  const annotationToolbarVisible = useAppStore((s) => s.annotationToolbarVisible);
  const activeStepId = useAppStore((s) => s.activeStepId);
  const annotations = useAppStore((s) => s.activeStepId ? (s.stepAnnotations[s.activeStepId] ?? EMPTY_ANNOTATIONS) : EMPTY_ANNOTATIONS);
  const removeAnnotation = useAppStore((s) => s.removeAnnotation);
  const steps = useAppStore((s) => s.steps);

  const step = activeStepId ? steps.find((s) => s.id === activeStepId) : null;
  const hasCrop = step?.crop_x != null;

  const [confirmClear, setConfirmClear] = useState(false);

  // Reset confirm state after 2 seconds
  useEffect(() => {
    if (!confirmClear) return;
    const t = setTimeout(() => setConfirmClear(false), 2000);
    return () => clearTimeout(t);
  }, [confirmClear]);

  if (!annotationToolbarVisible || !hasCrop || !activeStepId) return null;

  const handleUndo = () => {
    if (annotations.length > 0) {
      const last = annotations[annotations.length - 1];
      removeAnnotation(activeStepId, last.id);
    }
  };

  const handleClear = () => {
    if (annotations.length === 0) return;
    if (!confirmClear) {
      setConfirmClear(true);
      return;
    }
    setConfirmClear(false);
    for (const ann of [...annotations]) {
      removeAnnotation(activeStepId, ann.id);
    }
  };

  return (
    <div className="absolute left-1/2 top-2 z-10 flex -translate-x-1/2 items-center gap-0.5 rounded-lg border border-border bg-background/95 px-1.5 py-1 shadow-md backdrop-blur-sm">
      {/* Tool buttons */}
      {TOOLS.map(({ tool, icon, label, key }) => (
        <Tooltip key={tool}>
          <TooltipTrigger asChild>
            <button
              onClick={() => setAnnotationMode(annotationMode === tool ? null : tool)}
              className={`rounded p-1.5 transition-colors ${
                annotationMode === tool
                  ? "bg-accent text-white"
                  : "text-text-tertiary hover:bg-muted hover:text-text-secondary"
              }`}
            >
              {icon}
            </button>
          </TooltipTrigger>
          <TooltipContent>{label} ({key})</TooltipContent>
        </Tooltip>
      ))}

      {/* Separator */}
      <div className="mx-0.5 h-4 w-px bg-border" />

      {/* Color swatches */}
      {COLOR_SWATCHES.map((color) => (
        <button
          key={color}
          onClick={() => setAnnotationColor(color)}
          className="rounded p-0.5"
          title={color}
        >
          <div
            className="h-4 w-4 rounded-full border transition-transform"
            style={{
              backgroundColor: color,
              borderColor: annotationColor === color ? "#4E7282" : color === "#ffffff" ? "#d4d4d4" : color,
              borderWidth: annotationColor === color ? 2 : 1,
              transform: annotationColor === color ? "scale(1.15)" : "scale(1)",
            }}
          />
        </button>
      ))}

      {/* Separator */}
      <div className="mx-0.5 h-4 w-px bg-border" />

      {/* Undo */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleUndo}
            disabled={annotations.length === 0}
            className="rounded p-1.5 text-text-tertiary hover:bg-muted hover:text-text-secondary disabled:opacity-30"
          >
            <Undo2 className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent>Undo last</TooltipContent>
      </Tooltip>

      {/* Clear */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleClear}
            disabled={annotations.length === 0}
            className={`rounded p-1.5 transition-colors disabled:opacity-30 ${
              confirmClear
                ? "bg-red-500/10 text-red-500"
                : "text-text-tertiary hover:bg-muted hover:text-red-500"
            }`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent>{confirmClear ? "Click again to confirm" : "Clear all"}</TooltipContent>
      </Tooltip>
    </div>
  );
}
