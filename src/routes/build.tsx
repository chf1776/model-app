import { useState } from "react";
import { Wrench, Plus, Package } from "lucide-react";
import { useAppStore } from "@/store";
import { CreateProjectDialog } from "@/components/shared/CreateProjectDialog";
import { Button } from "@/components/ui/button";

export default function BuildRoute() {
  const project = useAppStore((s) => s.project);
  const [createOpen, setCreateOpen] = useState(false);

  if (!project) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
            <Wrench className="h-6 w-6 text-accent" />
          </div>
          <h2 className="mb-1 text-sm font-semibold text-text-primary">
            No Active Project
          </h2>
          <p className="mb-4 max-w-[240px] text-xs text-text-tertiary">
            Create a project or select one from the dropdown to start building.
          </p>
          <Button
            size="sm"
            onClick={() => setCreateOpen(true)}
            className="gap-1.5 bg-accent text-xs text-white hover:bg-accent-hover"
          >
            <Plus className="h-3.5 w-3.5" />
            New Project
          </Button>
        </div>
        <CreateProjectDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
        />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Build toolbar shell */}
      <div className="flex items-center gap-2 border-b border-border bg-background px-3 py-1">
        <div className="flex items-center gap-1.5 text-xs text-text-secondary">
          <Package className="h-3.5 w-3.5 text-accent" />
          <span className="font-medium">{project.name}</span>
        </div>
        <div className="flex-1" />
        <span className="text-[10px] text-text-tertiary">
          Build workspace coming in Phase 2
        </span>
      </div>

      {/* Build content area */}
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-text-tertiary">
            Build workspace will be available in Phase 2
          </p>
          <p className="mt-1 text-xs text-text-tertiary">
            Upload instructions, create tracks, and track your build progress
          </p>
        </div>
      </div>
    </div>
  );
}
