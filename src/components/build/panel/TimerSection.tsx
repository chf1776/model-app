import { useState } from "react";
import { Timer } from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/store";
import type { Step } from "@/shared/types";
import { getEffectiveDryingMinutes, parsePositiveMinutes } from "@/shared/types";

export function StartTimerButton({ step }: { step: Step }) {
  const activeTimers = useAppStore((s) => s.activeTimers);
  const addTimer = useAppStore((s) => s.addTimer);
  const settings = useAppStore((s) => s.settings);
  const [showInput, setShowInput] = useState(false);
  const [customMin, setCustomMin] = useState("");

  const hasTimer = activeTimers.some((t) => t.step_id === step.id);
  const presetMin = getEffectiveDryingMinutes(step, settings);

  const startTimer = async (minutes: number) => {
    try {
      await addTimer(step.id, step.title, minutes);
      toast.success(`Timer started: ${minutes} min`);
      setShowInput(false);
      setCustomMin("");
    } catch (e) {
      toast.error(`Failed to start timer: ${e}`);
    }
  };

  const handleClick = () => {
    if (presetMin) {
      startTimer(presetMin);
    } else {
      setShowInput(true);
    }
  };

  const handleSubmit = () => {
    const min = parsePositiveMinutes(customMin);
    if (!min) { toast.error("Enter a valid duration"); return; }
    startTimer(min);
  };

  if (hasTimer) {
    return (
      <div className="flex w-full items-center justify-center gap-1.5 rounded-md border border-accent/30 px-3 py-2 text-xs font-medium text-accent/50">
        <Timer className="h-3.5 w-3.5" />
        Timer Running
      </div>
    );
  }

  if (showInput) {
    return (
      <div className="flex w-full gap-1.5">
        <input
          type="number"
          min={1}
          placeholder="Minutes"
          value={customMin}
          onChange={(e) => setCustomMin(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          autoFocus
          className="min-w-0 flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-xs text-text-primary outline-none focus:border-accent"
        />
        <button
          onClick={handleSubmit}
          className="rounded-md bg-accent px-2.5 py-1.5 text-xs font-medium text-white hover:bg-accent-hover"
        >
          Start
        </button>
        <button
          onClick={() => { setShowInput(false); setCustomMin(""); }}
          className="rounded-md border border-border px-2 py-1.5 text-xs text-text-tertiary hover:bg-muted"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleClick}
      className="flex w-full items-center justify-center gap-1.5 rounded-md border border-accent/30 px-3 py-2 text-xs font-medium text-accent transition-colors hover:bg-accent/5"
    >
      <Timer className="h-3.5 w-3.5" />
      {presetMin ? `Start Timer (${presetMin} min)` : "Start Timer"}
    </button>
  );
}
