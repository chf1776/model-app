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
  const focusedCard = useAppStore((s) => s.focusedCard);
  const setFocusedCard = useAppStore((s) => s.setFocusedCard);

  useEffect(() => {
    if (activeProjectId && activeZone === "overview") {
      loadOverviewData(activeProjectId);
    }
  }, [activeProjectId, activeZone, loadOverviewData]);

  // Clear focused card when leaving overview zone
  useEffect(() => {
    if (activeZone !== "overview") {
      setFocusedCard(null);
    }
  }, [activeZone, setFocusedCard]);

  // Escape key to collapse focused card
  useEffect(() => {
    if (!focusedCard) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      setFocusedCard(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [focusedCard, setFocusedCard]);

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

  const collapse = () => setFocusedCard(null);

  // Focused / expanded card view
  if (focusedCard) {
    return (
      <div className="flex h-full min-h-0 flex-1 flex-col gap-2.5 overflow-hidden p-3">
        {focusedCard === "project_info" && (
          <ProjectInfoCard expanded onCollapse={collapse} />
        )}
        {focusedCard === "gallery" && (
          <GalleryCard expanded onCollapse={collapse} />
        )}
        {focusedCard === "build_log" && (
          <BuildLogCard expanded onCollapse={collapse} />
        )}
        {focusedCard === "materials" && (
          <MaterialsCard expanded onCollapse={collapse} />
        )}
      </div>
    );
  }

  // Default 2x2 mosaic view
  return (
    <div className="flex h-full flex-col gap-2.5 overflow-hidden p-3">
      <AssemblyMap />
      <div className="grid min-h-0 flex-1 grid-cols-2 gap-2.5">
        <ProjectInfoCard
          expanded={false}
          onExpand={() => setFocusedCard("project_info")}
          onCollapse={collapse}
        />
        <GalleryCard
          expanded={false}
          onExpand={() => setFocusedCard("gallery")}
          onCollapse={collapse}
        />
        <BuildLogCard
          expanded={false}
          onExpand={() => setFocusedCard("build_log")}
          onCollapse={collapse}
        />
        <MaterialsCard
          expanded={false}
          onExpand={() => setFocusedCard("materials")}
          onCollapse={collapse}
        />
      </div>
    </div>
  );
}
