import { useEffect } from "react";
import { Check, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAppStore } from "@/store";
import * as api from "@/api";

export function InfoBar() {
  const activeStepId = useAppStore((s) => s.activeStepId);
  const steps = useAppStore((s) => s.steps);
  const tracks = useAppStore((s) => s.tracks);
  const updateStepStore = useAppStore((s) => s.updateStepStore);
  const setActiveStep = useAppStore((s) => s.setActiveStep);
  const stepTags = useAppStore((s) => s.stepTags);
  const loadStepTags = useAppStore((s) => s.loadStepTags);

  const step = steps.find((s) => s.id === activeStepId);
  const track = step ? tracks.find((t) => t.id === step.track_id) : null;
  const tags = activeStepId ? stepTags[activeStepId] ?? [] : [];

  // Load tags when active step changes
  useEffect(() => {
    if (activeStepId) loadStepTags(activeStepId);
  }, [activeStepId, loadStepTags]);

  if (!step || !track) return null;

  const hasQuantity = step.quantity !== null && step.quantity > 1;
  const quantityProgress = hasQuantity
    ? `${step.quantity_current}/${step.quantity}`
    : null;

  const handleToggleComplete = async () => {
    const newCompleted = !step.is_completed;
    try {
      const updated = await api.updateStep({
        id: step.id,
        is_completed: newCompleted,
      });
      updateStepStore(updated);

      // Auto-advance to next incomplete step in same track
      if (newCompleted) {
        const trackSteps = steps
          .filter((s) => s.track_id === step.track_id && !s.parent_step_id)
          .sort((a, b) => a.display_order - b.display_order);
        const currentIdx = trackSteps.findIndex((s) => s.id === step.id);
        const nextIncomplete = trackSteps.find(
          (s, i) => i > currentIdx && !s.is_completed && s.id !== step.id,
        );
        if (nextIncomplete) {
          setActiveStep(nextIncomplete.id);
        }
      }
    } catch (e) {
      toast.error(`Failed to update step: ${e}`);
    }
  };

  return (
    <div className="flex items-center gap-3 border-t border-border bg-background px-3 py-1.5">
      {/* Track dot + step title */}
      <div className="flex items-center gap-1.5 min-w-0">
        <span
          className="inline-block h-2 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: track.color }}
        />
        <span className="truncate text-xs font-semibold text-text-primary">
          {step.title}
        </span>
      </div>

      {/* Pre-paint flag */}
      {step.pre_paint && (
        <Badge variant="outline" className="h-5 border-amber-300 bg-amber-50 px-1.5 text-[10px] text-amber-700">
          Pre-paint
        </Badge>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex items-center gap-1">
          {tags.map((tag) => (
            <Badge
              key={tag.id}
              variant="secondary"
              className="h-5 px-1.5 text-[10px]"
            >
              {tag.name}
            </Badge>
          ))}
        </div>
      )}

      {/* Notes preview */}
      {step.notes && (
        <Popover>
          <PopoverTrigger asChild>
            <button className="max-w-[200px] truncate text-[11px] text-text-tertiary hover:text-text-secondary">
              {step.notes}
            </button>
          </PopoverTrigger>
          <PopoverContent side="top" className="max-w-[320px] text-xs whitespace-pre-wrap">
            {step.notes}
          </PopoverContent>
        </Popover>
      )}

      <div className="flex-1" />

      {/* Quantity progress */}
      {quantityProgress && (
        <span className="text-[11px] font-medium tabular-nums text-text-secondary">
          {quantityProgress}
        </span>
      )}

      {/* Complete / Un-complete button */}
      <Button
        size="sm"
        onClick={handleToggleComplete}
        className={`h-6 gap-1 px-2.5 text-[11px] ${
          step.is_completed
            ? "bg-text-tertiary text-white hover:bg-text-secondary"
            : "bg-accent text-white hover:bg-accent-hover"
        }`}
      >
        {step.is_completed ? (
          <>
            <Undo2 className="h-3 w-3" />
            Un-complete
          </>
        ) : (
          <>
            <Check className="h-3 w-3" />
            Complete
          </>
        )}
      </Button>
    </div>
  );
}
