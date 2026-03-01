import { LayoutDashboard } from "lucide-react";
import { useAppStore } from "@/store";

export default function OverviewRoute() {
  const project = useAppStore((s) => s.project);

  if (!project) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
            <LayoutDashboard className="h-6 w-6 text-accent" />
          </div>
          <h2 className="mb-1 text-sm font-semibold text-text-primary">
            No Active Project
          </h2>
          <p className="max-w-[240px] text-xs text-text-tertiary">
            Select a project from the dropdown to view its overview.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Overview content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 gap-3">
          {["Assembly Map", "Gallery", "Build Log", "Materials"].map(
            (title) => (
              <div
                key={title}
                className="flex h-32 cursor-pointer flex-col rounded-md border border-border bg-card p-2.5 transition-colors hover:border-accent/30"
              >
                <span className="text-[11px] font-semibold text-text-primary">
                  {title}
                </span>
                <span className="text-[10px] text-text-tertiary">
                  Coming in Phase 3
                </span>
              </div>
            ),
          )}
        </div>
      </div>
    </div>
  );
}
