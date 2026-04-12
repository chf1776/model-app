import { useState, useEffect } from "react";
import { Check, Circle, MoveRight, X, Highlighter, Pencil, Type, Trash2, Undo2, Redo2 } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useAppStore } from "@/store";
import { useTheme } from "@/hooks/useTheme";
import type { Annotation, AnnotationTool } from "@/shared/types";
import { ANNOTATION_TOOL_LABELS } from "@/shared/types";

const EMPTY_ANNOTATIONS: Annotation[] = [];
const EMPTY_STACK: Annotation[][] = [];

const TOOLS: { tool: Exclude<AnnotationTool, null>; icon: React.ReactNode; key: string }[] = [
  { tool: "checkmark", icon: <Check className="h-3.5 w-3.5" />, key: "1" },
  { tool: "circle", icon: <Circle className="h-3.5 w-3.5" />, key: "2" },
  { tool: "arrow", icon: <MoveRight className="h-3.5 w-3.5" />, key: "3" },
  { tool: "cross", icon: <X className="h-3.5 w-3.5" />, key: "4" },
  { tool: "highlight", icon: <Highlighter className="h-3.5 w-3.5" />, key: "5" },
  { tool: "freehand", icon: <Pencil className="h-3.5 w-3.5" />, key: "6" },
  { tool: "text", icon: <Type className="h-3.5 w-3.5" />, key: "7" },
];

const COLOR_SWATCHES = [
  "#ef4444", // red
  "#3b82f6", // blue
  "#22c55e", // green
  "#facc15", // yellow
  "#ffffff", // white
  "#171717", // black
];

const STROKE_PRESETS: { label: string; value: number; thickness: number }[] = [
  { label: "Thin", value: 0.002, thickness: 1 },
  { label: "Medium", value: 0.003, thickness: 2 },
  { label: "Thick", value: 0.005, thickness: 3 },
];

export function AnnotationToolbar() {
  const { accent } = useTheme();
  const annotationMode = useAppStore((s) => s.buildView.kind === "building-track" ? s.buildView.annotationMode : null);
  const setAnnotationMode = useAppStore((s) => s.setAnnotationMode);
  const annotationColor = useAppStore((s) => s.annotationColor);
  const setAnnotationColor = useAppStore((s) => s.setAnnotationColor);
  const annotationStrokeWidth = useAppStore((s) => s.annotationStrokeWidth);
  const setAnnotationStrokeWidth = useAppStore((s) => s.setAnnotationStrokeWidth);
  const activeStepId = useAppStore((s) => s.activeStepId);
  const annotations = useAppStore((s) => s.activeStepId ? (s.stepContexts[s.activeStepId]?.annotations ?? EMPTY_ANNOTATIONS) : EMPTY_ANNOTATIONS);
  const clearAnnotations = useAppStore((s) => s.clearAnnotations);
  const undoAnnotation = useAppStore((s) => s.undoAnnotation);
  const redoAnnotation = useAppStore((s) => s.redoAnnotation);
  const undoStack = useAppStore((s) => s.activeStepId ? (s.annotationUndoStacks[s.activeStepId] ?? EMPTY_STACK) : EMPTY_STACK);
  const redoStack = useAppStore((s) => s.activeStepId ? (s.annotationRedoStacks[s.activeStepId] ?? EMPTY_STACK) : EMPTY_STACK);
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

  if (!hasCrop || !activeStepId) return null;

  const handleUndo = () => {
    if (undoStack.length > 0) {
      undoAnnotation(activeStepId);
    }
  };

  const handleRedo = () => {
    if (redoStack.length > 0) {
      redoAnnotation(activeStepId);
    }
  };

  const handleClear = () => {
    if (annotations.length === 0) return;
    if (!confirmClear) {
      setConfirmClear(true);
      return;
    }
    setConfirmClear(false);
    clearAnnotations(activeStepId);
  };

  return (
    <div className="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 items-center gap-0.5 rounded-lg border border-border bg-background/95 px-1.5 py-1 shadow-md backdrop-blur-sm">
      {/* Tool buttons */}
      {TOOLS.map(({ tool, icon, key }) => (
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
          <TooltipContent>{ANNOTATION_TOOL_LABELS[tool]} ({key})</TooltipContent>
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
              borderColor: annotationColor === color ? accent : color === "#ffffff" ? "#d4d4d4" : color,
              borderWidth: annotationColor === color ? 2 : 1,
              transform: annotationColor === color ? "scale(1.15)" : "scale(1)",
            }}
          />
        </button>
      ))}

      {/* Separator */}
      <div className="mx-0.5 h-4 w-px bg-border" />

      {/* Stroke width presets */}
      {STROKE_PRESETS.map(({ label, value, thickness }) => (
        <Tooltip key={label}>
          <TooltipTrigger asChild>
            <button
              onClick={() => setAnnotationStrokeWidth(value)}
              className={`flex items-center justify-center rounded p-1.5 transition-colors ${
                annotationStrokeWidth === value
                  ? "bg-accent/15 text-accent"
                  : "text-text-tertiary hover:bg-muted hover:text-text-secondary"
              }`}
            >
              <div
                className="rounded-full bg-current"
                style={{ width: thickness * 3 + 2, height: thickness * 3 + 2 }}
              />
            </button>
          </TooltipTrigger>
          <TooltipContent>{label}</TooltipContent>
        </Tooltip>
      ))}

      {/* Separator */}
      <div className="mx-0.5 h-4 w-px bg-border" />

      {/* Undo */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleUndo}
            disabled={undoStack.length === 0}
            className="flex items-center gap-0.5 rounded p-1.5 text-text-tertiary hover:bg-muted hover:text-text-secondary disabled:opacity-30"
          >
            <Undo2 className="h-3.5 w-3.5" />
            {annotations.length > 0 && (
              <span className="text-[9px] tabular-nums">{annotations.length}</span>
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent>Undo (⌘Z)</TooltipContent>
      </Tooltip>

      {/* Redo */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleRedo}
            disabled={redoStack.length === 0}
            className="rounded p-1.5 text-text-tertiary hover:bg-muted hover:text-text-secondary disabled:opacity-30"
          >
            <Redo2 className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent>Redo (⌘⇧Z)</TooltipContent>
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
