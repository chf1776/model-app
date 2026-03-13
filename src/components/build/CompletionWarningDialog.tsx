import { useMemo } from "react";
import { AlertTriangle } from "lucide-react";
import { useAppStore } from "@/store";
import { StepCompletionMarker } from "./StepCompletionMarker";
import { getCompletionWarnings, hasCompletionWarnings } from "./tree-utils";

export function CompletionWarningDialog() {
  const pendingCompletion = useAppStore((s) => s.pendingCompletion);
  const confirmCompletionAnyway = useAppStore((s) => s.confirmCompletionAnyway);
  const dismissCompletionWarning = useAppStore((s) => s.dismissCompletionWarning);
  const requestStepCompletion = useAppStore((s) => s.requestStepCompletion);
  const steps = useAppStore((s) => s.steps);
  const tracks = useAppStore((s) => s.tracks);
  const stepRelations = useAppStore((s) => s.stepRelations);

  // Re-derive warnings from current steps state so inline completions update the dialog
  const liveWarnings = useMemo(() => {
    if (!pendingCompletion) return null;
    const relations = stepRelations[pendingCompletion.stepId] ?? [];
    return getCompletionWarnings(pendingCompletion.stepId, steps, relations);
  }, [pendingCompletion, steps, stepRelations]);

  if (!pendingCompletion || !liveWarnings) return null;

  const { incompleteBlockers, accessLossSteps, prePaintTrappedSteps } = liveWarnings;
  const step = steps.find((s) => s.id === pendingCompletion.stepId);
  if (!step) return null;

  const allResolved = !hasCompletionWarnings(liveWarnings);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-[340px] rounded-lg border border-border bg-card p-5 shadow-xl">
        <div className="mb-3 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <h2 className="text-sm font-bold text-text-primary">Complete Step?</h2>
        </div>

        {/* Blocked by section */}
        {incompleteBlockers.length > 0 && (
          <div className="mb-3">
            <p className="mb-1.5 text-[11px] font-medium text-text-secondary">
              Blocked by incomplete steps:
            </p>
            <div className="space-y-1">
              {incompleteBlockers.map((blocker) => {
                const track = tracks.find((t) => t.id === blocker.track_id);
                return (
                  <div
                    key={blocker.id}
                    className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-muted/50"
                  >
                    <StepCompletionMarker
                      completed={false}
                      onClick={() => requestStepCompletion(blocker.id)}
                    />
                    <span className="flex-1 truncate text-[11px] text-text-primary">
                      {blocker.title}
                    </span>
                    {track && (
                      <span className="flex items-center gap-1 text-[9px] text-text-tertiary">
                        <span
                          className="inline-block h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: track.color }}
                        />
                        {track.name}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Access loss section */}
        {accessLossSteps.length > 0 && (
          <div className="mb-3">
            <p className="mb-1.5 text-[11px] font-medium text-text-secondary">
              Will block access to:
            </p>
            <div className="space-y-1">
              {accessLossSteps.map((s) => {
                const track = tracks.find((t) => t.id === s.track_id);
                const isPrePaint = s.pre_paint;
                return (
                  <div
                    key={s.id}
                    className={`flex items-center gap-2 rounded px-2 py-1.5 ${
                      isPrePaint ? "bg-red-500/5" : "hover:bg-muted/50"
                    }`}
                  >
                    <StepCompletionMarker
                      completed={false}
                      onClick={() => requestStepCompletion(s.id)}
                    />
                    <span
                      className={`flex-1 truncate text-[11px] ${
                        isPrePaint ? "font-medium text-red-700" : "text-text-primary"
                      }`}
                    >
                      {s.title}
                    </span>
                    {isPrePaint && (
                      <span className="shrink-0 rounded-full bg-red-500/15 px-1.5 py-0.5 text-[9px] font-semibold text-red-600">
                        PRE-PAINT
                      </span>
                    )}
                    {track && (
                      <span className="flex items-center gap-1 text-[9px] text-text-tertiary">
                        <span
                          className="inline-block h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: track.color }}
                        />
                        {track.name}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Pre-paint callout */}
        {prePaintTrappedSteps.length > 0 && (
          <div className="mb-3 rounded-md border border-red-300 bg-red-50 px-3 py-2">
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-red-500" />
              <span className="text-[11px] font-semibold text-red-700">
                Unpainted area will be sealed!
              </span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={dismissCompletionWarning}
            className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-muted"
          >
            Cancel
          </button>
          <button
            onClick={confirmCompletionAnyway}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold text-white ${
              allResolved
                ? "bg-success hover:bg-success/90"
                : "bg-accent hover:bg-accent-hover"
            }`}
          >
            {allResolved ? "Complete" : "Complete Anyway"}
          </button>
        </div>
      </div>
    </div>
  );
}
