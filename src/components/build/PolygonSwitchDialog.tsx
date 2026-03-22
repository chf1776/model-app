import { Pentagon } from "lucide-react";
import { useAppStore } from "@/store";

export function PolygonSwitchDialog() {
  const pendingPolygonSwitch = useAppStore((s) => s.pendingPolygonSwitch);
  const confirmPolygonSave = useAppStore((s) => s.confirmPolygonSave);
  const confirmPolygonDiscard = useAppStore((s) => s.confirmPolygonDiscard);
  const dismissPolygonSwitch = useAppStore((s) => s.dismissPolygonSwitch);
  const polygonDraftStepId = useAppStore((s) => s.polygonDraftStepId);
  const polygonDraftPoints = useAppStore((s) => s.polygonDraftPoints);
  const steps = useAppStore((s) => s.steps);

  if (!pendingPolygonSwitch) return null;

  const step = polygonDraftStepId ? steps.find((s) => s.id === polygonDraftStepId) : null;
  const canSave = polygonDraftPoints.length >= 3;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-[320px] rounded-lg border border-border bg-card p-5 shadow-xl">
        <div className="mb-3 flex items-center gap-2">
          <Pentagon className="h-4 w-4 text-accent" />
          <h2 className="text-sm font-bold text-text-primary">Unsaved Polygon</h2>
        </div>

        <p className="mb-4 text-[12px] text-text-secondary">
          You have an unsaved polygon{step ? ` on "${step.title}"` : ""}.
          What would you like to do?
        </p>

        <div className="flex items-center justify-end gap-2">
          <button
            onClick={dismissPolygonSwitch}
            className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-muted"
          >
            Cancel
          </button>
          <button
            onClick={confirmPolygonDiscard}
            className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
          >
            Discard
          </button>
          {canSave && (
            <button
              onClick={confirmPolygonSave}
              className="rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-hover"
            >
              Save
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
