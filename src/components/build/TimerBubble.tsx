import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { Timer, X, ChevronDown, ChevronUp, Plus } from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/store";
import type { DryingTimer } from "@/shared/types";

function formatRemaining(timer: DryingTimer): string {
  const now = Math.floor(Date.now() / 1000);
  const end = timer.started_at + timer.duration_min * 60;
  const remaining = Math.max(0, end - now);
  const min = Math.floor(remaining / 60);
  const sec = remaining % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

function progressFraction(timer: DryingTimer): number {
  const now = Math.floor(Date.now() / 1000);
  const elapsed = now - timer.started_at;
  const total = timer.duration_min * 60;
  return Math.min(1, Math.max(0, elapsed / total));
}

function CircularProgress({ fraction, size = 24 }: { fraction: number; size?: number }) {
  const r = (size - 3) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - fraction);

  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        className="text-border"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="text-accent"
      />
    </svg>
  );
}

export function TimerBubble() {
  const activeTimers = useAppStore((s) => s.activeTimers);
  const expanded = useAppStore((s) => s.timerBubbleExpanded);
  const setExpanded = useAppStore((s) => s.setTimerBubbleExpanded);
  const removeTimer = useAppStore((s) => s.removeTimer);
  const addTimer = useAppStore((s) => s.addTimer);

  // Draggable state
  const [position, setPosition] = useState({ x: 16, y: 16 });
  const dragRef = useRef<{ startX: number; startY: number; posX: number; posY: number } | null>(null);
  const isDragging = useRef(false);

  // Inline "add timer" form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newDuration, setNewDuration] = useState("");

  // Force re-render every second for countdown display
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      isDragging.current = false;
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        posX: position.x,
        posY: position.y,
      };

      const handleMouseMove = (e: MouseEvent) => {
        if (!dragRef.current) return;
        const dx = e.clientX - dragRef.current.startX;
        const dy = e.clientY - dragRef.current.startY;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
          isDragging.current = true;
        }
        setPosition({
          x: dragRef.current.posX + dx,
          y: dragRef.current.posY + dy,
        });
      };

      const handleMouseUp = () => {
        dragRef.current = null;
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    },
    [position],
  );

  const handleHeaderClick = useCallback(() => {
    if (!isDragging.current) {
      setExpanded(!expanded);
    }
  }, [expanded, setExpanded]);

  const handleDismiss = useCallback(
    async (id: string) => {
      try {
        await removeTimer(id);
      } catch (e) {
        toast.error(`Failed to dismiss timer: ${e}`);
      }
    },
    [removeTimer],
  );

  const handleAddSubmit = useCallback(async () => {
    const label = newLabel.trim() || "Timer";
    const dur = parseInt(newDuration, 10);
    if (!dur || dur <= 0) {
      toast.error("Enter a valid duration");
      return;
    }
    try {
      await addTimer(null, label, dur);
      setNewLabel("");
      setNewDuration("");
      setShowAddForm(false);
    } catch (e) {
      toast.error(`Failed to create timer: ${e}`);
    }
  }, [newLabel, newDuration, addTimer]);

  // Memoize timer rows to avoid recalculating
  const timerRows = useMemo(
    () =>
      activeTimers.map((timer) => ({
        timer,
        remaining: formatRemaining(timer),
        fraction: progressFraction(timer),
      })),
    [activeTimers],
  );

  if (activeTimers.length === 0) return null;

  return (
    <div
      className="absolute z-30 w-[220px] rounded-lg border border-border bg-card shadow-lg"
      style={{ left: position.x, top: position.y }}
    >
      {/* Header — draggable */}
      <div
        onMouseDown={handleMouseDown}
        onClick={handleHeaderClick}
        className="flex cursor-grab items-center gap-2 rounded-t-lg border-b border-border bg-sidebar px-3 py-2 active:cursor-grabbing"
      >
        <Timer className="h-3.5 w-3.5 text-accent" />
        <span className="flex-1 text-[11px] font-semibold text-text-primary">
          Timers ({activeTimers.length})
        </span>
        {expanded ? (
          <ChevronUp className="h-3 w-3 text-text-tertiary" />
        ) : (
          <ChevronDown className="h-3 w-3 text-text-tertiary" />
        )}
      </div>

      {/* Timer rows — always visible */}
      <div className="space-y-0 p-1.5">
        {timerRows.map(({ timer, remaining, fraction }) => (
          <div
            key={timer.id}
            className="flex items-center gap-2 rounded px-1.5 py-1"
          >
            <CircularProgress fraction={fraction} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[10px] font-medium text-text-primary">
                {timer.label}
              </p>
              <p className="font-mono text-[11px] font-semibold text-accent">
                {remaining}
              </p>
            </div>
            {expanded && (
              <button
                onClick={() => handleDismiss(timer.id)}
                className="rounded p-0.5 text-text-tertiary hover:bg-muted hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Expanded: add timer form */}
      {expanded && (
        <div className="border-t border-border p-2">
          {showAddForm ? (
            <div className="space-y-1.5">
              <input
                type="text"
                placeholder="Label"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                className="w-full rounded border border-border bg-background px-2 py-1 text-[11px] text-text-primary outline-none focus:border-accent"
              />
              <div className="flex gap-1.5">
                <input
                  type="number"
                  placeholder="Min"
                  value={newDuration}
                  onChange={(e) => setNewDuration(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddSubmit()}
                  className="w-full rounded border border-border bg-background px-2 py-1 text-[11px] text-text-primary outline-none focus:border-accent"
                  min={1}
                />
                <button
                  onClick={handleAddSubmit}
                  className="shrink-0 rounded bg-accent px-2 py-1 text-[10px] font-semibold text-white hover:bg-accent-hover"
                >
                  Start
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="flex w-full items-center justify-center gap-1 rounded py-1 text-[10px] text-text-tertiary hover:bg-muted hover:text-accent"
            >
              <Plus className="h-3 w-3" />
              Add Timer
            </button>
          )}
        </div>
      )}
    </div>
  );
}
