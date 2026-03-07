import { useState, useRef, useCallback, useEffect } from "react";
import { Timer, ChevronUp, Plus } from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/store";
import type { DryingTimer } from "@/shared/types";
import { ADHESIVE_TYPE_LABELS, parsePositiveMinutes } from "@/shared/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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

function TimerCircle({
  fraction,
  size = 24,
  onCancel,
}: {
  fraction: number;
  size?: number;
  onCancel: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const r = (size - 3) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - fraction);

  return (
    <div
      className="relative shrink-0 cursor-pointer"
      style={{ width: size, height: size }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={(e) => {
        e.stopPropagation();
        onCancel();
      }}
    >
      {hovered ? (
        <svg width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="currentColor"
            className="text-red-500"
          />
          <line
            x1={size / 2 - 3}
            y1={size / 2 - 3}
            x2={size / 2 + 3}
            y2={size / 2 + 3}
            stroke="white"
            strokeWidth={1.5}
            strokeLinecap="round"
          />
          <line
            x1={size / 2 + 3}
            y1={size / 2 - 3}
            x2={size / 2 - 3}
            y2={size / 2 + 3}
            stroke="white"
            strokeWidth={1.5}
            strokeLinecap="round"
          />
        </svg>
      ) : (
        <svg width={size} height={size} className="-rotate-90">
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
      )}
    </div>
  );
}

export function TimerBubble() {
  const activeTimers = useAppStore((s) => s.activeTimers);
  const removeTimer = useAppStore((s) => s.removeTimer);
  const addTimer = useAppStore((s) => s.addTimer);
  const steps = useAppStore((s) => s.steps);
  const tracks = useAppStore((s) => s.tracks);
  const setActiveStep = useAppStore((s) => s.setActiveStep);

  // Draggable state — default bottom-right
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; posX: number; posY: number } | null>(null);
  const isDragging = useRef(false);
  const dragCleanupRef = useRef<(() => void) | null>(null);

  // Clean up window listeners if component unmounts mid-drag
  useEffect(() => () => { dragCleanupRef.current?.(); }, []);

  // Add timer form toggle
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newDuration, setNewDuration] = useState("");

  // Subscribe to store tick counter for 1-second re-renders (driven by useTimerTick)
  useAppStore((s) => s.timerTickCount);

  // Cancel confirmation
  const [cancelTimerId, setCancelTimerId] = useState<string | null>(null);
  const cancelTimer = cancelTimerId ? activeTimers.find((t) => t.id === cancelTimerId) : null;

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      isDragging.current = false;

      let pos = position;
      if (!pos && bubbleRef.current) {
        const parent = bubbleRef.current.offsetParent as HTMLElement | null;
        const parentRect = parent?.getBoundingClientRect() ?? { left: 0, top: 0 };
        const rect = bubbleRef.current.getBoundingClientRect();
        pos = { x: rect.left - parentRect.left, y: rect.top - parentRect.top };
        setPosition(pos);
      }
      pos = pos ?? { x: 0, y: 0 };

      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        posX: pos.x,
        posY: pos.y,
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

      const cleanup = () => {
        dragRef.current = null;
        dragCleanupRef.current = null;
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", cleanup);
      };

      dragCleanupRef.current = cleanup;
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", cleanup);
    },
    [position],
  );

  const handleToggleAddForm = useCallback(() => {
    if (!isDragging.current) {
      setShowAddForm((v) => !v);
      setNewLabel("");
      setNewDuration("");
    }
  }, []);

  const handleConfirmCancel = useCallback(async () => {
    if (!cancelTimerId) return;
    try {
      await removeTimer(cancelTimerId);
    } catch (e) {
      toast.error(`Failed to cancel timer: ${e}`);
    }
    setCancelTimerId(null);
  }, [cancelTimerId, removeTimer]);

  const handleAddSubmit = useCallback(async () => {
    const label = newLabel.trim() || "Timer";
    const dur = parsePositiveMinutes(newDuration);
    if (!dur) { toast.error("Enter a valid duration"); return; }
    try {
      await addTimer(null, label, dur);
      setNewLabel("");
      setNewDuration("");
      setShowAddForm(false);
    } catch (e) {
      toast.error(`Failed to create timer: ${e}`);
    }
  }, [newLabel, newDuration, addTimer]);

  const timerRows = activeTimers.map((timer) => ({
    timer,
    remaining: formatRemaining(timer),
    fraction: progressFraction(timer),
  }));

  if (activeTimers.length === 0 && !showAddForm) return null;

  return (
    <>
      <div
        ref={bubbleRef}
        className="absolute z-30 w-[220px] rounded-lg border border-border bg-card shadow-lg"
        style={position
          ? { left: position.x, top: position.y }
          : { right: 16, bottom: 48 }
        }
      >
        {/* Header — draggable */}
        <div
          onMouseDown={handleMouseDown}
          className="flex cursor-grab items-center gap-2 rounded-t-lg border-b border-border bg-sidebar px-3 py-2 active:cursor-grabbing"
        >
          <Timer className="h-3.5 w-3.5 text-accent" />
          <span className="flex-1 text-[11px] font-semibold text-text-primary">
            Timers{activeTimers.length > 0 ? ` (${activeTimers.length})` : ""}
          </span>
          <button
            onClick={handleToggleAddForm}
            className="rounded p-0.5 text-text-tertiary hover:text-accent"
          >
            {showAddForm ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <Plus className="h-3 w-3" />
            )}
          </button>
        </div>

        {/* Timer rows */}
        {timerRows.length > 0 && (
          <div className="space-y-0 p-1.5">
            {timerRows.map(({ timer, remaining, fraction }) => {
              const step = timer.step_id ? steps.find((s) => s.id === timer.step_id) : null;
              const track = step ? tracks.find((t) => t.id === step.track_id) : null;
              const adhesiveLabel = step?.adhesive_type && step.adhesive_type !== "none"
                ? ADHESIVE_TYPE_LABELS[step.adhesive_type]
                : null;

              return (
                <div
                  key={timer.id}
                  className={`flex items-center gap-2 rounded px-1.5 py-1.5 ${timer.step_id ? "cursor-pointer hover:bg-muted/50" : ""}`}
                  onClick={() => timer.step_id && setActiveStep(timer.step_id)}
                >
                  <TimerCircle
                    fraction={fraction}
                    onCancel={() => setCancelTimerId(timer.id)}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      {track && (
                        <span
                          className="inline-block h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: track.color }}
                        />
                      )}
                      <p className="truncate text-[10px] font-medium text-text-primary">
                        {timer.label}
                      </p>
                    </div>
                    <div className="flex items-baseline gap-1.5 pl-3.5">
                      <p className="font-mono text-[11px] font-semibold text-accent">
                        {remaining}
                      </p>
                      <span className="truncate text-[9px] text-text-tertiary">
                        {adhesiveLabel ? `${adhesiveLabel} · ` : ""}{timer.duration_min}m
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add timer form */}
        {showAddForm && (
          <div className="border-t border-border p-2">
            <div className="space-y-1.5">
              <input
                type="text"
                placeholder="Label"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                autoFocus
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
          </div>
        )}
      </div>

      {/* Cancel confirmation dialog */}
      <AlertDialog open={cancelTimerId !== null} onOpenChange={(open) => !open && setCancelTimerId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel timer?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel the drying timer for{" "}
              <span className="font-medium">{cancelTimer?.label ?? "this step"}</span>
              {cancelTimer ? ` (${formatRemaining(cancelTimer)} remaining)` : ""}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Timer</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmCancel}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              Cancel Timer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
