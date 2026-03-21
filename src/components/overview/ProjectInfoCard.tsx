import { useState, useEffect, useMemo } from "react";
import { Info, ExternalLink, Calendar, Layers, Camera, Package, Palette, ChevronDown, ChevronUp, ListChecks } from "lucide-react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { openUrl } from "@tauri-apps/plugin-opener";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store";
import { relativeTime, formatDuration } from "@/shared/format";
import { KIT_CATEGORIES, PROJECT_STATUS_COLORS, type KitCategory, type ProjectStatus, type UpdateProjectInput } from "@/shared/types";
import { addBuildLogEntry } from "@/api";
import { OverviewCard } from "./OverviewCard";

interface ProjectInfoCardProps {
  expanded: boolean;
  onExpand?: () => void;
  onCollapse: () => void;
}

export function ProjectInfoCard({ expanded, onExpand, onCollapse }: ProjectInfoCardProps) {
  const project = useAppStore((s) => s.project);
  const tracks = useAppStore((s) => s.tracks);
  const updateProject = useAppStore((s) => s.updateProject);
  const deleteProject = useAppStore((s) => s.deleteProject);
  const loadKits = useAppStore((s) => s.loadKits);
  const setFocusedCard = useAppStore((s) => s.setFocusedCard);
  const setActiveZone = useAppStore((s) => s.setActiveZone);
  const lastActivityTs = useAppStore((s) =>
    s.overviewBuildLog.length > 0 ? s.overviewBuildLog[0].created_at : null,
  );
  const buildLogCount = useAppStore((s) => s.overviewBuildLog.length);
  const progressPhotoCount = useAppStore((s) => s.overviewProgressPhotos.length);
  const milestonePhotoCount = useAppStore((s) => s.overviewMilestonePhotos.length);
  const accessoryCount = useAppStore((s) => s.overviewAccessories.length);
  const paintCount = useAppStore((s) => s.overviewPaints.length);
  const navigate = useNavigate();

  // Local editable state
  const [name, setName] = useState(project?.name ?? "");
  const [productCode, setProductCode] = useState(project?.product_code ?? "");
  const [notes, setNotes] = useState(project?.notes ?? "");

  // Delete confirmation
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");

  // Complete confirmation
  const [completeOpen, setCompleteOpen] = useState(false);

  // Edit details toggle
  const [showDetails, setShowDetails] = useState(false);

  // Reset local state when project changes
  useEffect(() => {
    if (project) {
      setName(project.name);
      setProductCode(project.product_code ?? "");
      setNotes(project.notes ?? "");
    }
  }, [project?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const { totalSteps, completedSteps, progressPct, milestonesCompleted } = useMemo(() => {
    const total = tracks.reduce((sum, t) => sum + t.step_count, 0);
    const completed = tracks.reduce((sum, t) => sum + t.completed_count, 0);
    return {
      totalSteps: total,
      completedSteps: completed,
      progressPct: total > 0 ? (completed / total) * 100 : 0,
      milestonesCompleted: tracks.filter((t) => t.step_count > 0 && t.completed_count === t.step_count).length,
    };
  }, [tracks]);

  if (!project) return null;

  const startedAt = project.start_date ?? project.created_at;
  const totalPhotos = progressPhotoCount + milestonePhotoCount;
  const nowTs = Date.now() / 1000;
  const buildDuration = project.completion_date
    ? project.completion_date - startedAt
    : nowTs - startedAt;

  const saveField = async (field: keyof Omit<UpdateProjectInput, "id">, value: string | null) => {
    try {
      await updateProject({ id: project.id, [field]: value || null });
    } catch (err) {
      toast.error(`Failed to save: ${err}`);
    }
  };

  const handleCategoryClick = async (value: KitCategory) => {
    const newVal = project.category === value ? null : value;
    try {
      await updateProject({ id: project.id, category: newVal });
    } catch (err) {
      toast.error(`Failed to save: ${err}`);
    }
  };

  const changeStatus = async (status: ProjectStatus, successMsg: string) => {
    try {
      await updateProject({ id: project.id, status });
      loadKits(); // fire-and-forget — independent of the toast
      toast.success(successMsg);
    } catch (err) {
      toast.error(`Failed to update: ${err}`);
    }
  };

  const handleMarkComplete = async () => {
    await changeStatus("completed", "Build marked complete!");
    addBuildLogEntry({ projectId: project.id, entryType: "build_complete" }).catch(() => {});
    setCompleteOpen(false);
  };

  const handlePause = () => changeStatus("paused", "Build paused");
  const handleResume = () => changeStatus("active", "Build resumed!");

  const handleDelete = async () => {
    const projectName = project.name;
    try {
      await deleteProject(project.id);
      setFocusedCard(null);
      setActiveZone("collection");
      navigate("/collection");
      toast.success(`Deleted "${projectName}"`);
    } catch (err) {
      toast.error(`Failed to delete: ${err}`);
    }
  };

  // Compact view (unchanged)
  if (!expanded) {
    return (
      <OverviewCard title="Project Info" icon={Info} expanded={expanded} onExpand={onExpand} onCollapse={onCollapse}>
        <div className="flex gap-2">
          {project.kit_box_art_path && (
            <img
              src={convertFileSrc(project.kit_box_art_path)}
              alt="Box art"
              className="h-14 w-14 shrink-0 rounded object-cover"
            />
          )}
          <div className="min-w-0 flex-1 space-y-1">
            <p className="truncate text-[11px] font-medium text-text-primary">
              {project.kit_name ?? project.name}
            </p>
            <div className="flex flex-wrap gap-1">
              {project.kit_scale && (
                <span className="rounded bg-accent/10 px-1.5 py-0.5 text-[9px] font-medium text-accent">
                  {project.kit_scale}
                </span>
              )}
              {project.category && (
                <span className="rounded bg-border px-1.5 py-0.5 text-[9px] font-medium text-text-secondary">
                  {KIT_CATEGORIES.find((c) => c.value === project.category)?.label ?? project.category}
                </span>
              )}
              <span
                className="rounded px-1.5 py-0.5 text-[9px] font-medium capitalize"
                style={{ backgroundColor: PROJECT_STATUS_COLORS[project.status], color: "#fff" }}
              >
                {project.status}
              </span>
            </div>
            <div className="flex gap-2 text-[8px] text-text-tertiary">
              <span>Started {relativeTime(startedAt)}</span>
              {lastActivityTs && (
                <span>Last activity {relativeTime(lastActivityTs)}</span>
              )}
            </div>
          </div>
        </div>
        {totalSteps > 0 && (
          <div className="mt-2 space-y-0.5">
            <div className="flex items-center justify-between text-[9px] text-text-tertiary">
              <span>
                {completedSteps}/{totalSteps} steps
              </span>
              <span>{Math.round(progressPct)}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full bg-accent transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}
        {tracks.length > 1 && (
          <div className="mt-1.5 space-y-0.5">
            {tracks.map((track) => {
              const pct =
                track.step_count > 0
                  ? (track.completed_count / track.step_count) * 100
                  : 0;
              return (
                <Tooltip key={track.id}>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5">
                      <span
                        className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: track.color }}
                      />
                      <span className="w-[50px] truncate text-[8px] text-text-tertiary">
                        {track.name}
                      </span>
                      <div className="h-1 flex-1 overflow-hidden rounded-full bg-border">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: track.color,
                          }}
                        />
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    {track.name}: {track.completed_count}/{track.step_count} ({Math.round(pct)}%)
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        )}
      </OverviewCard>
    );
  }

  // Expanded view
  return (
    <OverviewCard title="Project Info" icon={Info} expanded={expanded} onExpand={onExpand} onCollapse={onCollapse}>
      <ScrollArea className="h-full">
        <div className="space-y-3 pr-2">
          {/* Hero header */}
          <div className="flex gap-3">
            {project.kit_box_art_path && (
              <img
                src={convertFileSrc(project.kit_box_art_path)}
                alt="Box art"
                className="h-20 w-20 shrink-0 rounded-lg object-cover shadow-sm"
              />
            )}
            <div className="min-w-0 flex-1 space-y-1.5">
              <p className="text-[13px] font-semibold leading-tight text-text-primary">
                {project.kit_name ?? project.name}
              </p>
              {project.kit_name && project.kit_name !== project.name && (
                <p className="text-[10px] text-text-secondary">{project.name}</p>
              )}
              <div className="flex flex-wrap gap-1">
                {project.kit_scale && (
                  <span className="rounded bg-accent/10 px-1.5 py-0.5 text-[9px] font-medium text-accent">
                    {project.kit_scale}
                  </span>
                )}
                {project.category && (
                  <span className="rounded bg-border px-1.5 py-0.5 text-[9px] font-medium text-text-secondary">
                    {KIT_CATEGORIES.find((c) => c.value === project.category)?.label ?? project.category}
                  </span>
                )}
                {project.product_code && (
                  <span className="rounded bg-border px-1.5 py-0.5 text-[9px] font-medium text-text-secondary">
                    #{project.product_code}
                  </span>
                )}
                <span
                  className="rounded px-1.5 py-0.5 text-[9px] font-medium capitalize"
                  style={{ backgroundColor: PROJECT_STATUS_COLORS[project.status], color: "#fff" }}
                >
                  {project.status}
                </span>
              </div>
              {project.kit_scalemates_url && (
                <button
                  type="button"
                  onClick={() => openUrl(project.kit_scalemates_url!).catch((err) => toast.error(`Failed to open: ${err}`))}
                  className="inline-flex items-center gap-1 text-[9px] text-accent hover:underline"
                >
                  <ExternalLink className="h-2.5 w-2.5" />
                  Scalemates
                </button>
              )}
            </div>
          </div>

          {/* Overall progress */}
          {totalSteps > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-medium text-text-primary">{completedSteps}/{totalSteps} steps completed</span>
                <span className="font-semibold text-accent">{Math.round(progressPct)}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-border">
                <div
                  className="h-full rounded-full bg-accent transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}

          {/* Stats grid */}
          <div className="grid grid-cols-5 gap-1.5">
            <div className="flex flex-col items-center rounded-md bg-sidebar px-1.5 py-1.5">
              <ListChecks className="mb-0.5 h-3 w-3 text-text-tertiary" />
              <span className="text-[12px] font-semibold text-text-primary">{totalSteps}</span>
              <span className="text-[8px] text-text-tertiary">Steps</span>
            </div>
            <div className="flex flex-col items-center rounded-md bg-sidebar px-1.5 py-1.5">
              <Layers className="mb-0.5 h-3 w-3 text-text-tertiary" />
              <span className="text-[12px] font-semibold text-text-primary">{tracks.length}</span>
              <span className="text-[8px] text-text-tertiary">Tracks</span>
            </div>
            <div className="flex flex-col items-center rounded-md bg-sidebar px-1.5 py-1.5">
              <Camera className="mb-0.5 h-3 w-3 text-text-tertiary" />
              <span className="text-[12px] font-semibold text-text-primary">{totalPhotos}</span>
              <span className="text-[8px] text-text-tertiary">Photos</span>
            </div>
            <div className="flex flex-col items-center rounded-md bg-sidebar px-1.5 py-1.5">
              <Package className="mb-0.5 h-3 w-3 text-text-tertiary" />
              <span className="text-[12px] font-semibold text-text-primary">{accessoryCount}</span>
              <span className="text-[8px] text-text-tertiary">Accessories</span>
            </div>
            <div className="flex flex-col items-center rounded-md bg-sidebar px-1.5 py-1.5">
              <Palette className="mb-0.5 h-3 w-3 text-text-tertiary" />
              <span className="text-[12px] font-semibold text-text-primary">{paintCount}</span>
              <span className="text-[8px] text-text-tertiary">Paints</span>
            </div>
          </div>

          {/* Per-track progress */}
          {tracks.length > 0 && (
            <div className="space-y-1">
              <p className="text-[9px] font-semibold uppercase tracking-wider text-text-tertiary">
                Track Progress
                {milestonesCompleted > 0 && (
                  <span className="ml-1.5 normal-case tracking-normal text-status-completed">
                    {milestonesCompleted}/{tracks.length} complete
                  </span>
                )}
              </p>
              <div className="space-y-1">
                {tracks.map((track) => {
                  const pct = track.step_count > 0 ? (track.completed_count / track.step_count) * 100 : 0;
                  const isComplete = track.step_count > 0 && track.completed_count === track.step_count;
                  return (
                    <div key={track.id} className="flex items-center gap-2">
                      <span
                        className="inline-block h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: track.color }}
                      />
                      <span className={cn(
                        "w-[70px] truncate text-[10px]",
                        isComplete ? "text-text-tertiary line-through" : "text-text-primary",
                      )}>
                        {track.name}
                      </span>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, backgroundColor: track.color }}
                        />
                      </div>
                      <span className="w-[32px] text-right text-[9px] tabular-nums text-text-tertiary">
                        {track.completed_count}/{track.step_count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="space-y-1">
            <p className="text-[9px] font-semibold uppercase tracking-wider text-text-tertiary">Timeline</p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3 w-3 text-text-tertiary" />
                <span className="text-[10px] text-text-secondary">
                  Started {new Date(startedAt * 1000).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3 w-3 text-text-tertiary" />
                <span className="text-[10px] text-text-secondary">
                  {project.completion_date
                    ? `Finished ${new Date(project.completion_date * 1000).toLocaleDateString()}`
                    : `Building for ${formatDuration(buildDuration)}`}
                </span>
              </div>
              {lastActivityTs && (
                <div className="col-span-2 flex items-center gap-1.5">
                  <Calendar className="h-3 w-3 text-text-tertiary" />
                  <span className="text-[10px] text-text-secondary">
                    Last activity {relativeTime(lastActivityTs)}
                  </span>
                </div>
              )}
              {buildLogCount > 0 && (
                <div className="col-span-2 flex items-center gap-1.5">
                  <Calendar className="h-3 w-3 text-text-tertiary" />
                  <span className="text-[10px] text-text-secondary">
                    {buildLogCount} build log entries
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Notes (read-only display if present) */}
          {project.notes && !showDetails && (
            <div className="space-y-0.5">
              <p className="text-[9px] font-semibold uppercase tracking-wider text-text-tertiary">Notes</p>
              <p className="whitespace-pre-wrap text-[10px] leading-relaxed text-text-secondary">
                {project.notes}
              </p>
            </div>
          )}

          <Separator />

          {/* Status Actions */}
          <div className="space-y-2">
            {project.status === "active" && (
              <div className="flex gap-2">
                <Button size="sm" className="h-7 text-[10px]" onClick={() => setCompleteOpen(true)}>
                  Mark Complete
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={handlePause}>
                  Pause Build
                </Button>
              </div>
            )}
            {project.status === "paused" && (
              <Button size="sm" className="h-7 text-[10px]" onClick={handleResume}>
                Resume Build
              </Button>
            )}
            {project.status === "completed" && project.completion_date && (
              <p className="text-[10px] text-text-secondary">
                Completed on {new Date(project.completion_date * 1000).toLocaleDateString()}
              </p>
            )}
          </div>

          <Separator />

          {/* Collapsible edit section */}
          <div>
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-1 text-[10px] font-medium text-text-secondary hover:text-text-primary"
            >
              {showDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              Edit Details
            </button>
            {showDetails && (
              <div className="mt-2 space-y-2">
                <div className="flex flex-col gap-0.5">
                  <label className="text-[9px] font-medium text-text-tertiary">Project Name</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onBlur={() => { if (name !== project.name) saveField("name", name); }}
                    className="h-7 text-[11px]"
                  />
                </div>

                <div className="flex flex-col gap-0.5">
                  <label className="text-[9px] font-medium text-text-tertiary">Category</label>
                  <div className="flex flex-wrap gap-1">
                    {KIT_CATEGORIES.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => handleCategoryClick(c.value)}
                        className={cn(
                          "rounded-[10px] px-2.5 py-[3px] text-[10px] transition-colors",
                          project.category === c.value
                            ? "bg-accent font-semibold text-white"
                            : "bg-muted text-text-tertiary hover:text-text-secondary",
                        )}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-0.5">
                  <label className="text-[9px] font-medium text-text-tertiary">Product Code</label>
                  <Input
                    value={productCode}
                    onChange={(e) => setProductCode(e.target.value)}
                    onBlur={() => { if (productCode !== (project.product_code ?? "")) saveField("product_code", productCode); }}
                    placeholder="e.g. 05040"
                    className="h-7 text-[11px]"
                  />
                </div>

                <div className="flex flex-col gap-0.5">
                  <label className="text-[9px] font-medium text-text-tertiary">Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    onBlur={() => { if (notes !== (project.notes ?? "")) saveField("notes", notes); }}
                    rows={3}
                    placeholder="Build goals, notes..."
                    className="w-full resize-none rounded-md border border-border bg-transparent px-2 py-1.5 text-[11px] text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none"
                  />
                </div>

                <Separator />

                <button
                  type="button"
                  onClick={() => { setDeleteInput(""); setDeleteOpen(true); }}
                  className="text-[9px] text-destructive hover:underline"
                >
                  Delete Project
                </button>
              </div>
            )}
          </div>
        </div>
      </ScrollArea>

      {/* Mark Complete Confirmation */}
      <AlertDialog open={completeOpen} onOpenChange={setCompleteOpen}>
        <AlertDialogContent className="max-w-[360px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm">Mark as Complete?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Mark &ldquo;{project.name}&rdquo; as complete? The associated kit status will also be updated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-7 text-[10px]">Cancel</AlertDialogCancel>
            <AlertDialogAction className="h-7 text-[10px]" onClick={handleMarkComplete}>
              Mark Complete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="max-w-[360px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm">Delete Project?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              This will permanently delete &ldquo;{project.name}&rdquo; and all tracks, steps,
              photos, and build log. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={deleteInput}
            onChange={(e) => setDeleteInput(e.target.value)}
            placeholder="Type project name to confirm"
            className="h-7 text-[11px]"
          />
          <AlertDialogFooter>
            <AlertDialogCancel className="h-7 text-[10px]">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="h-7 bg-destructive text-[10px] text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteInput !== project.name}
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </OverviewCard>
  );
}
