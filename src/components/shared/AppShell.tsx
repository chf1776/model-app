import { Outlet, useNavigate, useLocation } from "react-router";
import {
  Package,
  Wrench,
  LayoutDashboard,
  Settings,
  Plus,
  MoreHorizontal,
  Pencil,
  Archive,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import type { Zone } from "@/shared/types";
import { useEffect, useState } from "react";
import * as api from "@/api";

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
  const deleteProject = useAppStore((s) => s.deleteProject);
  const loadKits = useAppStore((s) => s.loadKits);
  const loadAccessories = useAppStore((s) => s.loadAccessories);
  const loadPaints = useAppStore((s) => s.loadPaints);
  const loadPaintProjectMap = useAppStore((s) => s.loadPaintProjectMap);
  const loadProjects = useAppStore((s) => s.loadProjects);
  const loadActiveProject = useAppStore((s) => s.loadActiveProject);
  const activeEntityTab = useAppStore((s) => s.activeEntityTab);

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Initialize app data on mount
  useEffect(() => {
    Promise.all([
      loadKits(),
      loadAccessories(),
      loadPaints(),
      loadPaintProjectMap(),
      loadProjects(),
      loadActiveProject(),
    ]);
  }, [loadKits, loadAccessories, loadPaints, loadPaintProjectMap, loadProjects, loadActiveProject]);

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

  const handleRenameOpen = () => {
    if (project) {
      setRenameValue(project.name);
      setRenameOpen(true);
    }
  };

  const handleRenameSubmit = async () => {
    if (!project || !renameValue.trim()) return;
    try {
      await api.renameProject(project.id, renameValue.trim());
      await Promise.all([loadProjects(), loadActiveProject()]);
      toast.success("Project renamed");
      setRenameOpen(false);
    } catch (err) {
      toast.error(`Failed to rename: ${err}`);
    }
  };

  const handleDeleteProject = async () => {
    if (!project) return;
    const name = project.name;
    try {
      await deleteProject(project.id);
      toast.success(`Deleted "${name}"`);
      setDeleteConfirmOpen(false);
    } catch (err) {
      toast.error(`Failed to delete: ${err}`);
    }
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

            {/* Project overflow menu */}
            {project && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="rounded-md p-1 text-text-tertiary hover:bg-muted hover:text-text-secondary">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-44">
                  <DropdownMenuItem
                    onClick={handleRenameOpen}
                    className="gap-2 text-xs"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Rename
                  </DropdownMenuItem>
                  <Popover>
                    <PopoverTrigger asChild>
                      <DropdownMenuItem
                        onSelect={(e) => e.preventDefault()}
                        className="gap-2 text-xs text-text-tertiary"
                      >
                        <Archive className="h-3.5 w-3.5" />
                        Archive
                      </DropdownMenuItem>
                    </PopoverTrigger>
                    <PopoverContent
                      side="right"
                      className="w-auto px-3 py-2 text-xs text-text-tertiary"
                    >
                      Coming soon
                    </PopoverContent>
                  </Popover>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setDeleteConfirmOpen(true)}
                    className="gap-2 text-xs text-red-500 focus:text-red-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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

      {/* Rename dialog */}
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">Rename Project</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Label htmlFor="project-name" className="text-xs text-text-secondary">
              Name
            </Label>
            <Input
              id="project-name"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRenameSubmit();
              }}
              className="mt-1 text-sm"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => setRenameOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-accent text-xs text-white hover:bg-accent-hover"
              onClick={handleRenameSubmit}
              disabled={!renameValue.trim()}
            >
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{project?.name}" and all its
              instruction sources and pages. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProject}
              className="bg-red-500 text-xs hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
