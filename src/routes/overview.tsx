import { useEffect } from "react";
import { LayoutDashboard } from "lucide-react";
import { useAppStore } from "@/store";
import { Skeleton } from "@/components/ui/skeleton";
import { AssemblyMap } from "@/components/overview/AssemblyMap";
import { ProjectInfoCard } from "@/components/overview/ProjectInfoCard";
import { GalleryCard } from "@/components/overview/GalleryCard";
import { BuildLogCard } from "@/components/overview/BuildLogCard";
import { MaterialsCard } from "@/components/overview/MaterialsCard";

export default function OverviewRoute() {
  const project = useAppStore((s) => s.project);
  const activeProjectId = useAppStore((s) => s.activeProjectId);
  const activeZone = useAppStore((s) => s.activeZone);
  const overviewLoading = useAppStore((s) => s.overviewLoading);
  const loadOverviewData = useAppStore((s) => s.loadOverviewData);

  useEffect(() => {
    if (activeProjectId && activeZone === "overview") {
      loadOverviewData(activeProjectId);
    }
  }, [activeProjectId, activeZone, loadOverviewData]);

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

  if (overviewLoading) {
    return (
      <div className="flex h-full flex-col gap-2.5 overflow-hidden p-3">
        <Skeleton className="h-20 rounded-lg" />
        <div className="grid min-h-0 flex-1 grid-cols-2 gap-2.5">
          <Skeleton className="rounded-lg" />
          <Skeleton className="rounded-lg" />
          <Skeleton className="rounded-lg" />
          <Skeleton className="rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-2.5 overflow-hidden p-3">
      <AssemblyMap />
      <div className="grid min-h-0 flex-1 grid-cols-2 gap-2.5">
        <ProjectInfoCard />
        <GalleryCard />
        <BuildLogCard />
        <MaterialsCard />
      </div>
    </div>
  );
}
