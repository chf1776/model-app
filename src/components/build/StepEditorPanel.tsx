import { useState } from "react";
import { X, ChevronRight } from "lucide-react";
import { toast } from "sonner";
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
import type { AdhesiveType, SourceType } from "@/shared/types";
import {
  ADHESIVE_TYPE_LABELS,
  SOURCE_TYPE_LABELS,
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
  const loadTracks = useAppStore((s) => s.loadTracks);
  const loadSteps = useAppStore((s) => s.loadSteps);

  const [advancedOpen, setAdvancedOpen] = useState(false);

  const step = steps.find((s) => s.id === activeStepId);
  if (!step) return null;

  const currentTrack = tracks.find((t) => t.id === step.track_id);

  const handleUpdate = async (fields: Record<string, unknown>) => {
    try {
      const updated = await api.updateStep({ id: step.id, ...fields });
      updateStepStore(updated);
    } catch (e) {
      toast.error(`Failed to update step: ${e}`);
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
