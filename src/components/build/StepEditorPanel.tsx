import { useState, useEffect, useMemo } from "react";
import { X, ChevronRight, Plus, ImageIcon, ListTree, Link2, Search } from "lucide-react";
import { toast } from "sonner";
import { convertFileSrc } from "@tauri-apps/api/core";
import { open as openFileDialog } from "@tauri-apps/plugin-dialog";
import { useAppStore } from "@/store";
import * as api from "@/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { AdhesiveType, SourceType, StepRelationType } from "@/shared/types";
import {
  ADHESIVE_TYPE_LABELS,
  SOURCE_TYPE_LABELS,
  PREDEFINED_TAGS,
} from "@/shared/types";
import { CropPreview } from "./CropPreview";

export function StepEditorPanel() {
  const steps = useAppStore((s) => s.steps);
  const activeStepId = useAppStore((s) => s.activeStepId);
  const tracks = useAppStore((s) => s.tracks);
  const activeProjectId = useAppStore((s) => s.activeProjectId);
  const setActiveStep = useAppStore((s) => s.setActiveStep);
  const setActiveTrack = useAppStore((s) => s.setActiveTrack);
  const updateStepStore = useAppStore((s) => s.updateStepStore);
  const addStep = useAppStore((s) => s.addStep);
  const loadTracks = useAppStore((s) => s.loadTracks);
  const loadSteps = useAppStore((s) => s.loadSteps);
  const stepTags = useAppStore((s) => s.stepTags);
  const loadStepTags = useAppStore((s) => s.loadStepTags);
  const setStepTagsAction = useAppStore((s) => s.setStepTags);
  const stepRelations = useAppStore((s) => s.stepRelations);
  const loadStepRelations = useAppStore((s) => s.loadStepRelations);
  const setStepRelationsAction = useAppStore((s) => s.setStepRelations);
  const stepReferenceImages = useAppStore((s) => s.stepReferenceImages);
  const loadStepReferenceImages = useAppStore((s) => s.loadStepReferenceImages);
  const addReferenceImageStore = useAppStore((s) => s.addReferenceImageStore);
  const updateReferenceImageStore = useAppStore((s) => s.updateReferenceImageStore);
  const removeReferenceImageStore = useAppStore((s) => s.removeReferenceImageStore);

  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [tagPopoverOpen, setTagPopoverOpen] = useState(false);
  const [relationPopoverOpen, setRelationPopoverOpen] = useState<StepRelationType | null>(null);
  const [replacesPopoverOpen, setReplacesPopoverOpen] = useState(false);
  const [relationSearch, setRelationSearch] = useState("");
  const [editingCaptionId, setEditingCaptionId] = useState<string | null>(null);
  const [expandedImageId, setExpandedImageId] = useState<string | null>(null);

  const step = steps.find((s) => s.id === activeStepId);

  // Load data and reset UI when step changes
  useEffect(() => {
    if (step) {
      if (!stepTags[step.id]) loadStepTags(step.id);
      if (!stepRelations[step.id]) loadStepRelations(step.id);
      if (!stepReferenceImages[step.id]) loadStepReferenceImages(step.id);
    }
    setExpandedImageId(null);
    setEditingCaptionId(null);
    setRelationPopoverOpen(null);
    setReplacesPopoverOpen(false);
    setRelationSearch("");
  }, [step?.id]);

  if (!step) return null;

  const referenceImages = stepReferenceImages[step.id] ?? [];
  const expandedImage = expandedImageId
    ? referenceImages.find((i) => i.id === expandedImageId) ?? null
    : null;
  const currentTags = stepTags[step.id] ?? [];
  const currentTagNames = new Set(currentTags.map((t) => t.name));

  const currentRelations = stepRelations[step.id] ?? [];
  const blockedByIds = currentRelations
    .filter((r) => r.from_step_id === step.id && r.relation_type === "blocked_by")
    .map((r) => r.to_step_id);
  const blocksAccessIds = currentRelations
    .filter((r) => r.from_step_id === step.id && r.relation_type === "blocks_access_to")
    .map((r) => r.to_step_id);

  // Steps available for relation pickers (all project steps except this one)
  const otherSteps = useMemo(() => steps.filter((s) => s.id !== step.id), [steps, step.id]);

  // Group steps by track for picker display
  const stepsByTrackForPicker = useMemo(() => {
    const grouped = new Map<string, typeof steps>();
    for (const s of otherSteps) {
      const list = grouped.get(s.track_id) ?? [];
      list.push(s);
      grouped.set(s.track_id, list);
    }
    return grouped;
  }, [otherSteps]);

  const currentTrack = tracks.find((t) => t.id === step.track_id);
  const parentStep = step.parent_step_id
    ? steps.find((s) => s.id === step.parent_step_id) ?? null
    : null;
  const isRootStep = !step.parent_step_id;

  const handleUpdate = async (fields: Record<string, unknown>) => {
    try {
      const updated = await api.updateStep({ id: step.id, ...fields });
      updateStepStore(updated);
    } catch (e) {
      toast.error(`Failed to update step: ${e}`);
    }
  };

  const handleToggleTag = async (tagName: string) => {
    const next = currentTagNames.has(tagName)
      ? currentTags.filter((t) => t.name !== tagName).map((t) => t.name)
      : [...currentTags.map((t) => t.name), tagName];
    await setStepTagsAction(step.id, next);
  };

  const handleToggleRelation = async (targetStepId: string, relationType: StepRelationType) => {
    const currentIds = relationType === "blocked_by" ? blockedByIds : blocksAccessIds;
    const otherType: StepRelationType = relationType === "blocked_by" ? "blocks_access_to" : "blocked_by";
    const otherIds = relationType === "blocked_by" ? blocksAccessIds : blockedByIds;

    let newIds: string[];
    if (currentIds.includes(targetStepId)) {
      newIds = currentIds.filter((id) => id !== targetStepId);
    } else {
      newIds = [...currentIds, targetStepId];
    }

    const relations = [
      ...newIds.map((id) => ({ target_step_id: id, relation_type: relationType })),
      ...otherIds.map((id) => ({ target_step_id: id, relation_type: otherType })),
    ];
    await setStepRelationsAction(step.id, relations);
  };

  const handleSetReplaces = async (targetStepId: string | null) => {
    await handleUpdate({ replaces_step_id: targetStepId });
    setReplacesPopoverOpen(false);
  };

  const handleAddReference = async () => {
    const selected = await openFileDialog({
      multiple: false,
      filters: [{ name: "Images", extensions: ["png", "jpg", "jpeg", "webp"] }],
    });
    if (!selected) return;
    try {
      const img = await api.addReferenceImage(step.id, selected, null);
      addReferenceImageStore(img);
    } catch (e) {
      toast.error(`Failed to add reference image: ${e}`);
    }
  };

  const handleDeleteReference = async (id: string) => {
    try {
      await api.deleteReferenceImage(id);
      removeReferenceImageStore(step.id, id);
      if (expandedImageId === id) setExpandedImageId(null);
    } catch (e) {
      toast.error(`Failed to delete reference image: ${e}`);
    }
  };

  const handleSaveCaption = async (id: string, caption: string) => {
    try {
      const updated = await api.updateReferenceImageCaption(id, caption || null);
      updateReferenceImageStore(updated);
    } catch (e) {
      toast.error(`Failed to update caption: ${e}`);
    }
    setEditingCaptionId(null);
  };

  const handleAddSubStep = async () => {
    if (!isRootStep) return;
    const childCount = steps.filter((s) => s.parent_step_id === step.id).length;
    const parentNum = step.display_order + 1;
    const title = `Step ${parentNum}.${childCount + 1}`;
    try {
      const newStep = await api.createStep({
        track_id: step.track_id,
        title,
        parent_step_id: step.id,
      });
      addStep(newStep);
      setActiveStep(newStep.id);
      if (activeProjectId) loadTracks(activeProjectId);
    } catch (e) {
      toast.error(`Failed to create sub-step: ${e}`);
    }
  };

  const handleTrackChange = async (newTrackId: string) => {
    if (newTrackId === step.track_id) return;
    const oldTrackId = step.track_id;
    try {
      const updated = await api.updateStep({ id: step.id, track_id: newTrackId });
      updateStepStore(updated);
      // Reorder old track to close gaps
      const remainingIds = steps
        .filter((s) => s.track_id === oldTrackId && s.id !== step.id)
        .sort((a, b) => a.display_order - b.display_order)
        .map((s) => s.id);
      await api.reorderSteps(oldTrackId, remainingIds);
      if (activeProjectId) {
        await loadTracks(activeProjectId);
        loadSteps(activeProjectId);
      }
      setActiveTrack(newTrackId);
    } catch (e) {
      toast.error(`Failed to move step: ${e}`);
    }
  };

  return (
    <div className="flex w-[260px] shrink-0 flex-col border-l border-border bg-sidebar">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <span className="text-xs font-bold text-text-primary">Step Editor</span>
        <button
          onClick={() => setActiveStep(null)}
          className="flex h-5 w-5 items-center justify-center rounded text-text-tertiary hover:bg-black/5 hover:text-text-secondary"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-3 p-3">
          {/* Parent breadcrumb for sub-steps */}
          {parentStep && (
            <button
              onClick={() => setActiveStep(parentStep.id)}
              className="flex items-center gap-1 text-[10px] text-accent hover:underline"
            >
              <ChevronRight className="h-2.5 w-2.5 rotate-180" />
              Parent: {parentStep.title}
            </button>
          )}

          {/* Add sub-step button for root steps */}
          {isRootStep && (
            <button
              onClick={handleAddSubStep}
              className="flex w-full items-center justify-center gap-1 rounded border border-dashed border-border py-1.5 text-[10px] text-text-tertiary hover:border-text-secondary hover:text-text-secondary"
            >
              <ListTree className="h-3 w-3" />
              Add sub-step
            </button>
          )}

          {/* Crop preview */}
          <CropPreview step={step} />

          {/* Title */}
          <div className="space-y-1">
            <Label className="text-[10px] text-text-tertiary">Title</Label>
            <Input
              value={step.title}
              onChange={(e) => updateStepStore({ ...step, title: e.target.value })}
              onBlur={(e) => handleUpdate({ title: e.target.value })}
              className="h-7 text-xs"
            />
          </div>

          {/* Track + Adhesive row */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[10px] text-text-tertiary">Track</Label>
              <Select
                value={step.track_id}
                onValueChange={handleTrackChange}
              >
                <SelectTrigger size="sm" className="h-7 w-full text-[11px]">
                  <SelectValue>
                    {currentTrack && (
                      <div className="flex items-center gap-1.5">
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: currentTrack.color }}
                        />
                        <span className="truncate">{currentTrack.name}</span>
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {tracks.map((t) => (
                    <SelectItem key={t.id} value={t.id} className="text-xs">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: t.color }}
                        />
                        {t.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] text-text-tertiary">Adhesive</Label>
              <Select
                value={step.adhesive_type ?? "none"}
                onValueChange={(v) =>
                  handleUpdate({ adhesive_type: v as AdhesiveType })
                }
              >
                <SelectTrigger size="sm" className="h-7 w-full text-[11px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(ADHESIVE_TYPE_LABELS) as [AdhesiveType, string][]).map(
                    ([value, label]) => (
                      <SelectItem key={value} value={value} className="text-xs">
                        {label}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Pre-paint toggle */}
          <div className="flex items-center justify-between">
            <Label className="text-[10px] text-text-tertiary">Pre-paint</Label>
            <Switch
              size="sm"
              checked={step.pre_paint}
              onCheckedChange={(checked) => handleUpdate({ pre_paint: checked })}
            />
          </div>

          {/* Tags */}
          <div className="space-y-1">
            <Label className="text-[10px] text-text-tertiary">Tags</Label>
            <div className="flex flex-wrap items-center gap-1">
              {currentTags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => handleToggleTag(tag.name)}
                  className="inline-flex items-center gap-0.5 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent hover:bg-accent/20"
                >
                  {tag.name}
                  <X className="h-2.5 w-2.5" />
                </button>
              ))}
              <Popover open={tagPopoverOpen} onOpenChange={setTagPopoverOpen}>
                <PopoverTrigger asChild>
                  <button className="inline-flex items-center gap-0.5 rounded-full border border-dashed border-border px-1.5 py-0.5 text-[10px] text-text-tertiary hover:border-text-secondary hover:text-text-secondary">
                    <Plus className="h-2.5 w-2.5" />
                    tag
                  </button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-44 p-1.5">
                  <div className="space-y-0.5">
                    {PREDEFINED_TAGS.map((tagName) => {
                      const isActive = currentTagNames.has(tagName);
                      return (
                        <button
                          key={tagName}
                          onClick={() => handleToggleTag(tagName)}
                          className={`flex w-full items-center rounded px-2 py-1 text-[11px] ${
                            isActive
                              ? "bg-accent/10 font-medium text-accent"
                              : "text-text-secondary hover:bg-black/[0.03]"
                          }`}
                        >
                          {tagName}
                        </button>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Relations */}
          <div className="space-y-1.5">
            <Label className="text-[10px] text-text-tertiary">Relations</Label>

            {/* Blocked by */}
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-1">
                {blockedByIds.map((id) => {
                  const s = steps.find((st) => st.id === id);
                  const t = s ? tracks.find((tr) => tr.id === s.track_id) : null;
                  return (
                    <button
                      key={id}
                      onClick={() => handleToggleRelation(id, "blocked_by")}
                      className="inline-flex items-center gap-0.5 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-700 hover:bg-red-500/20"
                    >
                      {t && <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: t.color }} />}
                      {s?.title ?? id.slice(0, 6)}
                      <X className="h-2.5 w-2.5" />
                    </button>
                  );
                })}
                <Popover open={relationPopoverOpen === "blocked_by"} onOpenChange={(open) => { setRelationPopoverOpen(open ? "blocked_by" : null); setRelationSearch(""); }}>
                  <PopoverTrigger asChild>
                    <button className="inline-flex items-center gap-0.5 rounded-full border border-dashed border-border px-1.5 py-0.5 text-[10px] text-text-tertiary hover:border-text-secondary hover:text-text-secondary">
                      <Link2 className="h-2.5 w-2.5" />
                      blocked by
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-52 p-1.5">
                    <div className="mb-1 flex items-center gap-1 rounded border border-border px-1.5 py-1">
                      <Search className="h-3 w-3 text-text-tertiary" />
                      <input
                        value={relationSearch}
                        onChange={(e) => setRelationSearch(e.target.value)}
                        placeholder="Search steps..."
                        className="flex-1 bg-transparent text-[11px] outline-none"
                      />
                    </div>
                    <ScrollArea className="max-h-[200px]">
                      {tracks.map((t) => {
                        const trackSteps = (stepsByTrackForPicker.get(t.id) ?? []).filter(
                          (s) => !relationSearch || s.title.toLowerCase().includes(relationSearch.toLowerCase()),
                        );
                        if (trackSteps.length === 0) return null;
                        return (
                          <div key={t.id} className="mb-1">
                            <div className="flex items-center gap-1 px-1 py-0.5 text-[9px] font-semibold text-text-tertiary">
                              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: t.color }} />
                              {t.name}
                            </div>
                            {trackSteps.map((s) => (
                              <button
                                key={s.id}
                                onClick={() => handleToggleRelation(s.id, "blocked_by")}
                                className={`flex w-full items-center rounded px-2 py-1 text-[11px] ${
                                  blockedByIds.includes(s.id)
                                    ? "bg-red-500/10 font-medium text-red-700"
                                    : "text-text-secondary hover:bg-black/[0.03]"
                                }`}
                              >
                                {s.title}
                              </button>
                            ))}
                          </div>
                        );
                      })}
                    </ScrollArea>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Blocks access to */}
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-1">
                {blocksAccessIds.map((id) => {
                  const s = steps.find((st) => st.id === id);
                  const t = s ? tracks.find((tr) => tr.id === s.track_id) : null;
                  return (
                    <button
                      key={id}
                      onClick={() => handleToggleRelation(id, "blocks_access_to")}
                      className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-700 hover:bg-amber-500/20"
                    >
                      {t && <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: t.color }} />}
                      {s?.title ?? id.slice(0, 6)}
                      <X className="h-2.5 w-2.5" />
                    </button>
                  );
                })}
                <Popover open={relationPopoverOpen === "blocks_access_to"} onOpenChange={(open) => { setRelationPopoverOpen(open ? "blocks_access_to" : null); setRelationSearch(""); }}>
                  <PopoverTrigger asChild>
                    <button className="inline-flex items-center gap-0.5 rounded-full border border-dashed border-border px-1.5 py-0.5 text-[10px] text-text-tertiary hover:border-text-secondary hover:text-text-secondary">
                      <Link2 className="h-2.5 w-2.5" />
                      blocks access
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-52 p-1.5">
                    <div className="mb-1 flex items-center gap-1 rounded border border-border px-1.5 py-1">
                      <Search className="h-3 w-3 text-text-tertiary" />
                      <input
                        value={relationSearch}
                        onChange={(e) => setRelationSearch(e.target.value)}
                        placeholder="Search steps..."
                        className="flex-1 bg-transparent text-[11px] outline-none"
                      />
                    </div>
                    <ScrollArea className="max-h-[200px]">
                      {tracks.map((t) => {
                        const trackSteps = (stepsByTrackForPicker.get(t.id) ?? []).filter(
                          (s) => !relationSearch || s.title.toLowerCase().includes(relationSearch.toLowerCase()),
                        );
                        if (trackSteps.length === 0) return null;
                        return (
                          <div key={t.id} className="mb-1">
                            <div className="flex items-center gap-1 px-1 py-0.5 text-[9px] font-semibold text-text-tertiary">
                              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: t.color }} />
                              {t.name}
                            </div>
                            {trackSteps.map((s) => (
                              <button
                                key={s.id}
                                onClick={() => handleToggleRelation(s.id, "blocks_access_to")}
                                className={`flex w-full items-center rounded px-2 py-1 text-[11px] ${
                                  blocksAccessIds.includes(s.id)
                                    ? "bg-amber-500/10 font-medium text-amber-700"
                                    : "text-text-secondary hover:bg-black/[0.03]"
                                }`}
                              >
                                {s.title}
                              </button>
                            ))}
                          </div>
                        );
                      })}
                    </ScrollArea>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Replaces */}
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-1">
                {step.replaces_step_id && (() => {
                  const s = steps.find((st) => st.id === step.replaces_step_id);
                  const t = s ? tracks.find((tr) => tr.id === s.track_id) : null;
                  return (
                    <button
                      onClick={() => handleSetReplaces(null)}
                      className="inline-flex items-center gap-0.5 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent hover:bg-accent/20"
                    >
                      {t && <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: t.color }} />}
                      {s?.title ?? step.replaces_step_id.slice(0, 6)}
                      <X className="h-2.5 w-2.5" />
                    </button>
                  );
                })()}
                {!step.replaces_step_id && (
                  <Popover open={replacesPopoverOpen} onOpenChange={(open) => { setReplacesPopoverOpen(open); setRelationSearch(""); }}>
                    <PopoverTrigger asChild>
                      <button className="inline-flex items-center gap-0.5 rounded-full border border-dashed border-border px-1.5 py-0.5 text-[10px] text-text-tertiary hover:border-text-secondary hover:text-text-secondary">
                        <Link2 className="h-2.5 w-2.5" />
                        replaces
                      </button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-52 p-1.5">
                      <div className="mb-1 flex items-center gap-1 rounded border border-border px-1.5 py-1">
                        <Search className="h-3 w-3 text-text-tertiary" />
                        <input
                          value={relationSearch}
                          onChange={(e) => setRelationSearch(e.target.value)}
                          placeholder="Search steps..."
                          className="flex-1 bg-transparent text-[11px] outline-none"
                        />
                      </div>
                      <ScrollArea className="max-h-[200px]">
                        {tracks.map((t) => {
                          const trackSteps = (stepsByTrackForPicker.get(t.id) ?? []).filter(
                            (s) => !relationSearch || s.title.toLowerCase().includes(relationSearch.toLowerCase()),
                          );
                          if (trackSteps.length === 0) return null;
                          return (
                            <div key={t.id} className="mb-1">
                              <div className="flex items-center gap-1 px-1 py-0.5 text-[9px] font-semibold text-text-tertiary">
                                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: t.color }} />
                                {t.name}
                              </div>
                              {trackSteps.map((s) => (
                                <button
                                  key={s.id}
                                  onClick={() => handleSetReplaces(s.id)}
                                  className="flex w-full items-center rounded px-2 py-1 text-[11px] text-text-secondary hover:bg-black/[0.03]"
                                >
                                  {s.title}
                                </button>
                              ))}
                            </div>
                          );
                        })}
                      </ScrollArea>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </div>
          </div>

          {/* References */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] text-text-tertiary">References</Label>
              <button
                onClick={handleAddReference}
                className="inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[10px] text-accent hover:bg-accent/10"
              >
                <Plus className="h-2.5 w-2.5" />
                Add
              </button>
            </div>
            {referenceImages.length > 0 && (
              <div className="grid grid-cols-2 gap-1.5">
                {referenceImages.map((img) => (
                  <div key={img.id} className="group relative">
                    <button
                      onClick={() =>
                        setExpandedImageId(expandedImageId === img.id ? null : img.id)
                      }
                      className="block w-full overflow-hidden rounded border border-border hover:border-accent/40"
                    >
                      <img
                        src={convertFileSrc(img.file_path)}
                        alt={img.caption ?? "Reference"}
                        className="h-[50px] w-full object-cover"
                      />
                    </button>
                    <button
                      onClick={() => handleDeleteReference(img.id)}
                      className="absolute -right-1 -top-1 hidden h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white group-hover:flex"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                    {editingCaptionId === img.id ? (
                      <input
                        autoFocus
                        defaultValue={img.caption ?? ""}
                        onBlur={(e) => handleSaveCaption(img.id, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveCaption(img.id, e.currentTarget.value);
                          if (e.key === "Escape") setEditingCaptionId(null);
                        }}
                        className="mt-0.5 w-full rounded border border-border bg-white px-1 py-0.5 text-[9px] text-text-secondary outline-none focus:border-accent"
                      />
                    ) : (
                      <button
                        onClick={() => setEditingCaptionId(img.id)}
                        className="mt-0.5 block w-full truncate text-left text-[9px] text-text-tertiary hover:text-text-secondary"
                      >
                        {img.caption || "Add caption..."}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
            {referenceImages.length === 0 && (
              <button
                onClick={handleAddReference}
                className="flex w-full items-center justify-center gap-1.5 rounded border border-dashed border-border py-3 text-[10px] text-text-tertiary hover:border-text-secondary hover:text-text-secondary"
              >
                <ImageIcon className="h-3.5 w-3.5" />
                Add reference image
              </button>
            )}
            {/* Expanded view */}
            {expandedImage && (
              <div className="relative overflow-hidden rounded border border-border">
                <img
                  src={convertFileSrc(expandedImage.file_path)}
                  alt="Expanded reference"
                  className="w-full"
                />
                <button
                  onClick={() => setExpandedImageId(null)}
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>

          {/* Source type */}
          <div className="space-y-1">
            <Label className="text-[10px] text-text-tertiary">Source Type</Label>
            <Select
              value={step.source_type}
              onValueChange={(v) =>
                handleUpdate({ source_type: v as SourceType })
              }
            >
              <SelectTrigger size="sm" className="h-7 w-full text-[11px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(SOURCE_TYPE_LABELS) as [SourceType, string][]).map(
                  ([value, label]) => (
                    <SelectItem key={value} value={value} className="text-xs">
                      {label}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <Label className="text-[10px] text-text-tertiary">Notes</Label>
            <Textarea
              value={step.notes ?? ""}
              onChange={(e) =>
                updateStepStore({ ...step, notes: e.target.value || null })
              }
              onBlur={(e) =>
                handleUpdate({ notes: e.target.value || null })
              }
              placeholder="Build notes..."
              className="min-h-[60px] resize-none text-xs"
            />
          </div>

          {/* Advanced section */}
          <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
            <CollapsibleTrigger className="flex w-full items-center gap-1 text-[10px] font-medium text-text-tertiary hover:text-text-secondary">
              <ChevronRight
                className={`h-3 w-3 transition-transform ${advancedOpen ? "rotate-90" : ""}`}
              />
              Advanced
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-2 space-y-2">
                <div className="space-y-1">
                  <Label className="text-[10px] text-text-tertiary">Quantity</Label>
                  <Input
                    type="number"
                    min={1}
                    value={step.quantity ?? ""}
                    onChange={(e) => {
                      const val = e.target.value ? parseInt(e.target.value, 10) : null;
                      updateStepStore({ ...step, quantity: val });
                    }}
                    onBlur={(e) => {
                      const val = e.target.value ? parseInt(e.target.value, 10) : null;
                      handleUpdate({ quantity: val });
                    }}
                    placeholder="1"
                    className="h-7 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-text-tertiary">
                    Drying Time (min)
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    value={step.drying_time_min ?? ""}
                    onChange={(e) => {
                      const val = e.target.value ? parseInt(e.target.value, 10) : null;
                      updateStepStore({ ...step, drying_time_min: val });
                    }}
                    onBlur={(e) => {
                      const val = e.target.value ? parseInt(e.target.value, 10) : null;
                      handleUpdate({ drying_time_min: val });
                    }}
                    placeholder="0"
                    className="h-7 text-xs"
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </ScrollArea>
    </div>
  );
}
