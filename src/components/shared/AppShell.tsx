import { Outlet, useNavigate, useLocation } from "react-router";
import { Package, Wrench, LayoutDashboard, Settings, Plus } from "lucide-react";
import { useAppStore } from "@/store";
import { SegmentedPill } from "./SegmentedPill";
import { CreateProjectDialog } from "./CreateProjectDialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import type { Zone } from "@/shared/types";
import { useEffect, useState } from "react";

const ZONE_ITEMS: { value: Zone; label: string; icon: React.ReactNode }[] = [
  {
    value: "collection",
    label: "Collection",
    icon: <Package className="h-4 w-4" />,
  },
  {
    value: "build",
    label: "Build",
    icon: <Wrench className="h-4 w-4" />,
  },
  {
    value: "overview",
    label: "Overview",
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
];

export function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const activeZone = useAppStore((s) => s.activeZone);
  const setActiveZone = useAppStore((s) => s.setActiveZone);
  const project = useAppStore((s) => s.project);
  const projects = useAppStore((s) => s.projects);
  const setActiveProject = useAppStore((s) => s.setActiveProject);
  const loadKits = useAppStore((s) => s.loadKits);
  const loadAccessories = useAppStore((s) => s.loadAccessories);
  const loadPaints = useAppStore((s) => s.loadPaints);
  const loadProjects = useAppStore((s) => s.loadProjects);
  const loadActiveProject = useAppStore((s) => s.loadActiveProject);
  const activeEntityTab = useAppStore((s) => s.activeEntityTab);

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [createProjectOpen, setCreateProjectOpen] = useState(false);

  // Initialize app data on mount
  useEffect(() => {
    loadKits();
    loadAccessories();
    loadPaints();
    loadProjects();
    loadActiveProject();
  }, [loadKits, loadAccessories, loadPaints, loadProjects, loadActiveProject]);

  // Sync zone state from URL
  useEffect(() => {
    const path = location.pathname.replace("/", "") as Zone;
    if (["collection", "build", "overview"].includes(path)) {
      setActiveZone(path);
    }
  }, [location.pathname, setActiveZone]);

  // Expose dialog opener for collection zone to use
  useEffect(() => {
    window.__openAddKitDialog = () => setAddDialogOpen(true);
    return () => {
      delete window.__openAddKitDialog;
    };
  }, []);

  // Sync addDialogOpen state via a custom event based on active entity tab
  useEffect(() => {
    if (addDialogOpen) {
      if (activeEntityTab === "accessories") {
        window.dispatchEvent(new CustomEvent("open-add-accessory-dialog"));
      } else if (activeEntityTab === "paints") {
        window.dispatchEvent(new CustomEvent("open-add-paint-dialog"));
      } else {
        window.dispatchEvent(new CustomEvent("open-add-kit-dialog"));
      }
      setAddDialogOpen(false);
    }
  }, [addDialogOpen, activeEntityTab]);

  const handleZoneChange = (zone: Zone) => {
    setActiveZone(zone);
    navigate(`/${zone}`);
  };

  const showProjectDropdown = activeZone === "build" || activeZone === "overview";

  return (
    <div className="flex h-full flex-col">
      {/* Zone Bar */}
      <div className="flex items-center gap-3 border-b border-border bg-sidebar px-3 py-1.5">
        {/* Left: Zone switcher */}
        <SegmentedPill
          items={ZONE_ITEMS}
          value={activeZone}
          onChange={handleZoneChange}
        />

        {/* Center: Project dropdown (Build/Overview only) */}
        {showProjectDropdown && (
          <>
            <Separator orientation="vertical" className="h-[18px]" />
            {projects.length > 0 ? (
              <Select
                value={project?.id ?? ""}
                onValueChange={(id) => setActiveProject(id)}
              >
                <SelectTrigger className="h-7 w-auto min-w-[160px] gap-2 border bg-card text-xs">
                  {project && (
                    <span
                      className="h-1.5 w-1.5 rounded-full bg-accent"
                    />
                  )}
                  <SelectValue placeholder="Select project..." />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id} className="text-xs">
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <span className="text-xs text-text-tertiary">
                No projects yet
              </span>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="h-7 gap-1 text-[11px] text-text-tertiary hover:text-accent"
              onClick={() => setCreateProjectOpen(true)}
            >
              <Plus className="h-3 w-3" />
              New Project
            </Button>
          </>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right: Add button (Collection only) + Settings */}
        {activeZone === "collection" && (
          <Button
            size="sm"
            className="h-7 gap-1 bg-accent text-xs text-white hover:bg-accent-hover"
            onClick={() => setAddDialogOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </Button>
        )}
        <button
          onClick={() => navigate("/settings")}
          className="rounded-md p-1.5 text-text-tertiary hover:bg-muted hover:text-text-secondary"
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>

      <CreateProjectDialog
        open={createProjectOpen}
        onOpenChange={setCreateProjectOpen}
      />
    </div>
  );
}
