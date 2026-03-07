import { useEffect, useMemo, useState } from "react";
import { Check, Camera, ChevronLeft, ChevronRight, Plus, Timer } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { convertFileSrc } from "@tauri-apps/api/core";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { open } from "@tauri-apps/plugin-dialog";
import { toast } from "sonner";
import { useAppStore } from "@/store";
import * as api from "@/api";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ImageLightbox } from "@/components/shared/ImageLightbox";
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
import { ADHESIVE_TYPE_LABELS, IMAGE_FILE_FILTER, getEffectiveDryingMinutes, parsePositiveMinutes } from "@/shared/types";
import type { Step } from "@/shared/types";
import { StepCompletionMarker } from "./StepCompletionMarker";
import { parseStepRelations, flattenTrackSteps } from "./tree-utils";

export function BuildingStepPanel() {
  const steps = useAppStore((s) => s.steps);
  const tracks = useAppStore((s) => s.tracks);
  const activeStepId = useAppStore((s) => s.activeStepId);
  const activeTrackId = useAppStore((s) => s.activeTrackId);
  const setActiveStep = useAppStore((s) => s.setActiveStep);
  const updateStepStore = useAppStore((s) => s.updateStepStore);
  const completeActiveStep = useAppStore((s) => s.completeActiveStep);
  const loadTracks = useAppStore((s) => s.loadTracks);
  const activeProjectId = useAppStore((s) => s.activeProjectId);
  const stepTags = useAppStore((s) => s.stepTags);
  const loadStepTags = useAppStore((s) => s.loadStepTags);
  const stepRelations = useAppStore((s) => s.stepRelations);
  const loadStepRelations = useAppStore((s) => s.loadStepRelations);
  const stepReferenceImages = useAppStore((s) => s.stepReferenceImages);
  const loadStepReferenceImages = useAppStore((s) => s.loadStepReferenceImages);
  const addReferenceImageStore = useAppStore((s) => s.addReferenceImageStore);

  const step = activeStepId ? steps.find((s) => s.id === activeStepId) ?? null : null;
  const track = step ? tracks.find((t) => t.id === step.track_id) : null;

  // Load tags, relations, reference images when step changes
  useEffect(() => {
    if (!step) return;
    if (!stepTags[step.id]) loadStepTags(step.id);
    if (!stepRelations[step.id]) loadStepRelations(step.id);
    if (!stepReferenceImages[step.id]) loadStepReferenceImages(step.id);
  }, [step?.id]);

  // Children of the active step only
  const children = useMemo(
    () => (step ? steps.filter((s) => s.parent_step_id === step.id) : []),
    [steps, step?.id],
  );

  // Prev/next navigation
  const flatSteps = useMemo(
    () => flattenTrackSteps(steps, activeTrackId),
    [steps, activeTrackId],
  );
  const currentIndex = flatSteps.findIndex((s) => s.id === activeStepId);
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex >= 0 && currentIndex < flatSteps.length - 1;
  const goPrev = () => { if (canGoPrev) setActiveStep(flatSteps[currentIndex - 1].id); };
  const goNext = () => { if (canGoNext) setActiveStep(flatSteps[currentIndex + 1].id); };

  // Drag-drop for progress photos
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    if (!step) return;
    const unlisten = getCurrentWebview().onDragDropEvent((event) => {
      if (event.payload.type === "enter" || event.payload.type === "over") {
        setDragOver(true);
      } else if (event.payload.type === "drop") {
        setDragOver(false);
        const paths = event.payload.paths;
        const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "webp"];
        const imagePath = paths.find((p) => {
          const ext = p.split(".").pop()?.toLowerCase() ?? "";
          return IMAGE_EXTENSIONS.includes(ext);
        });
        if (imagePath) {
          api.addProgressPhoto(step.id, imagePath)
            .then(() => toast.success("Progress photo saved"))
            .catch((e) => toast.error(`Failed to save photo: ${e}`));
        }
      } else if (event.payload.type === "leave") {
        setDragOver(false);
      }
    });
    return () => { unlisten.then((fn) => fn()); };
  }, [step?.id]);

  if (!step) return null;

  const currentTags = stepTags[step.id] ?? [];
  const currentRelations = stepRelations[step.id] ?? [];
  const referenceImages = stepReferenceImages[step.id] ?? [];

  const { blockedByIds, blocksAccessIds, incomingBlockedBy, incomingBlocksAccess } =
    parseStepRelations(currentRelations, step.id);

  const replacesStep = step.replaces_step_id
    ? steps.find((s) => s.id === step.replaces_step_id) ?? null
    : null;

  const hasRelations =
    blockedByIds.length > 0 ||
    blocksAccessIds.length > 0 ||
    incomingBlockedBy.length > 0 ||
    incomingBlocksAccess.length > 0;

  const [uncompleteOpen, setUncompleteOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Reset lightbox when step changes
  useEffect(() => {
    setLightboxIndex(null);
  }, [step?.id]);

  const lightboxImages = useMemo(
    () =>
      referenceImages.map((img) => ({
        src: convertFileSrc(img.file_path),
        alt: img.caption ?? "Reference",
        caption: img.caption ?? undefined,
      })),
    [referenceImages],
  );

  const handleComplete = () => {
    if (step.is_completed) {
      setUncompleteOpen(true);
    } else {
      completeActiveStep();
    }
  };

  const handleAddProgressPhoto = async () => {
    const path = await open({
      multiple: false,
      filters: [IMAGE_FILE_FILTER],
    });
    if (path) {
      try {
        await api.addProgressPhoto(step.id, path);
        toast.success("Progress photo saved");
      } catch (e) {
        toast.error(`Failed to save photo: ${e}`);
      }
    }
  };

  const handleAddReference = async () => {
    const path = await open({
      multiple: false,
      filters: [IMAGE_FILE_FILTER],
    });
    if (path) {
      try {
        const img = await api.addReferenceImage(step.id, path, null);
        addReferenceImageStore(img);
        toast.success("Reference image added");
      } catch (e) {
        toast.error(`Failed to add reference: ${e}`);
      }
    }
  };

  const handleToggleSubStep = async (child: Step) => {
    try {
      const updated = await api.updateStep({
        id: child.id,
        is_completed: !child.is_completed,
      });
      updateStepStore(updated);
      if (activeProjectId) loadTracks(activeProjectId);
    } catch (e) {
      toast.error(`Failed to update step: ${e}`);
    }
  };

  const handleQuantityChange = async (delta: number) => {
    const next = Math.max(0, Math.min(step.quantity!, step.quantity_current + delta));
    updateStepStore({ ...step, quantity_current: next });
    try {
      const updated = await api.updateStep({ id: step.id, quantity_current: next });
      updateStepStore(updated);
    } catch (e) {
      toast.error(`Failed to update step: ${e}`);
    }
  };

  return (
    <div className="flex w-[280px] shrink-0 flex-col border-l border-border bg-sidebar">
      <ScrollArea className="flex-1 overflow-hidden">
        <div className="p-3">
          {/* Section 1: Step Header + Completion */}
          <div className="space-y-2.5">
            <div className="flex items-start gap-2">
              <span
                className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: track?.color }}
              />
              <div className="min-w-0 flex-1">
                <h3 className="text-[13px] font-semibold leading-tight text-text-primary">
                  {step.title}
                </h3>
                <p className="text-[10px] text-text-tertiary">{track?.name}</p>
              </div>
            </div>

            {/* Nav + Complete row */}
            <div className="flex items-center gap-1.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={goPrev}
                    disabled={!canGoPrev}
                    className="flex items-center justify-center rounded-md border border-border px-1.5 py-2 text-text-secondary hover:bg-muted/50 hover:text-accent disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Previous step</TooltipContent>
              </Tooltip>
              <button
                onClick={handleComplete}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition-colors ${
                  step.is_completed
                    ? "bg-success text-white hover:bg-success/90"
                    : "bg-accent text-white hover:bg-accent-hover"
                }`}
              >
                <Check className="h-3.5 w-3.5" />
                {step.is_completed ? "Completed" : "Complete"}
              </button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={goNext}
                    disabled={!canGoNext}
                    className="flex items-center justify-center rounded-md border border-border px-1.5 py-2 text-text-secondary hover:bg-muted/50 hover:text-accent disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Next step</TooltipContent>
              </Tooltip>
            </div>

            {/* Start Timer button */}
            <StartTimerButton step={step} />

            {/* Progress photo drop zone */}
            <button
              onClick={handleAddProgressPhoto}
              className={`flex w-full items-center justify-center gap-2 rounded-md border border-dashed px-3 py-2.5 text-[11px] transition-colors ${
                dragOver
                  ? "border-accent bg-accent/5 text-accent"
                  : "border-border text-text-tertiary hover:border-accent hover:text-accent"
              }`}
            >
              <Camera className="h-3.5 w-3.5" />
              {dragOver ? "Drop image here" : "Click or drag a progress photo"}
            </button>
          </div>

          {/* Section 2: Quantity Tracker */}
          {step.quantity != null && step.quantity > 1 && (
            <>
              <Divider />
              <div className="space-y-1.5">
                <SectionLabel>Quantity</SectionLabel>
                <div className="flex items-center gap-2">
                  <div className="flex flex-1 gap-1">
                    {Array.from({ length: step.quantity }, (_, i) => (
                      <span
                        key={i}
                        className={`h-2.5 w-2.5 rounded-full ${
                          i < step.quantity_current
                            ? "bg-accent"
                            : "border border-border bg-transparent"
                        }`}
                      />
                    ))}
                  </div>
                  <span
                    className={`font-mono text-xs font-semibold ${
                      step.quantity_current >= step.quantity
                        ? "text-success"
                        : "text-text-primary"
                    }`}
                  >
                    {step.quantity_current}/{step.quantity}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleQuantityChange(-1)}
                      disabled={step.quantity_current <= 0}
                      className="flex h-5 w-5 items-center justify-center rounded-full border border-border text-[11px] text-text-secondary hover:bg-white disabled:opacity-30"
                    >
                      −
                    </button>
                    <button
                      onClick={() => handleQuantityChange(1)}
                      disabled={step.quantity_current >= step.quantity}
                      className="flex h-5 w-5 items-center justify-center rounded-full border border-border text-[11px] text-text-secondary hover:bg-white disabled:opacity-30"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Section 3: Sub-steps */}
          {children.length > 0 && (
            <>
              <Divider />
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <SectionLabel>Sub-steps</SectionLabel>
                  <span className="text-[10px] text-text-tertiary">
                    {children.filter((c) => c.is_completed).length}/{children.length}
                  </span>
                </div>
                <div className="space-y-0.5">
                  {children.map((child) => (
                    <button
                      key={child.id}
                      onClick={() => setActiveStep(child.id)}
                      className="flex w-full items-center gap-2 rounded px-1 py-1 text-left hover:bg-muted/50"
                    >
                      <StepCompletionMarker
                        completed={child.is_completed}
                        onClick={() => handleToggleSubStep(child)}
                      />
                      <span
                        className={`text-[11px] ${
                          child.is_completed
                            ? "text-text-tertiary line-through"
                            : child.id === activeStepId
                              ? "font-medium text-accent"
                              : "text-text-primary"
                        }`}
                      >
                        {child.title}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Section 4: Relations */}
          {hasRelations && (
            <>
              <Divider />
              <div className="space-y-1.5">
                <SectionLabel>Relations</SectionLabel>
                {blockedByIds.length > 0 && (
                  <RelationGroup
                    label="Blocked by"
                    ids={blockedByIds}
                    steps={steps}
                    tracks={tracks}
                    chipClass="bg-red-500/10 text-red-700"
                    onNavigate={setActiveStep}
                  />
                )}
                {incomingBlockedBy.length > 0 && (
                  <RelationGroup
                    label="Blocks"
                    ids={incomingBlockedBy}
                    steps={steps}
                    tracks={tracks}
                    chipClass="bg-red-500/10 text-red-700"
                    onNavigate={setActiveStep}
                  />
                )}
                {blocksAccessIds.length > 0 && (
                  <RelationGroup
                    label="Blocks access to"
                    ids={blocksAccessIds}
                    steps={steps}
                    tracks={tracks}
                    chipClass="bg-amber-500/10 text-amber-700"
                    onNavigate={setActiveStep}
                  />
                )}
                {incomingBlocksAccess.length > 0 && (
                  <RelationGroup
                    label="Access blocked by"
                    ids={incomingBlocksAccess}
                    steps={steps}
                    tracks={tracks}
                    chipClass="bg-amber-500/10 text-amber-700"
                    onNavigate={setActiveStep}
                  />
                )}
              </div>
            </>
          )}

          {/* Section 5: Before/After */}
          {replacesStep && (
            <>
              <Divider />
              <div className="space-y-1.5">
                <SectionLabel>Replaces</SectionLabel>
                <button
                  onClick={() => setActiveStep(replacesStep.id)}
                  className="text-[11px] text-accent hover:underline"
                >
                  {replacesStep.title}
                </button>
              </div>
            </>
          )}

          {/* Section 6: Details */}
          {(step.adhesive_type || step.drying_time_min || step.pre_paint || currentTags.length > 0 || step.source_name) && (
            <>
              <Divider />
              <div className="space-y-1.5">
                <SectionLabel>Details</SectionLabel>
                <div className="space-y-1">
                  {step.adhesive_type && step.adhesive_type !== "none" && (
                    <DetailRow label="Adhesive" value={ADHESIVE_TYPE_LABELS[step.adhesive_type]} />
                  )}
                  {step.drying_time_min != null && step.drying_time_min > 0 && (
                    <DetailRow label="Drying time" value={`${step.drying_time_min} min`} />
                  )}
                  {step.source_name && (
                    <DetailRow label="Source" value={step.source_name} />
                  )}
                  {step.pre_paint && (
                    <span className="inline-block rounded-full bg-[#C4913A]/15 px-2 py-0.5 text-[10px] font-medium text-[#C4913A]">
                      Pre-paint
                    </span>
                  )}
                  {currentTags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {currentTags.map((tag) => (
                        <span
                          key={tag.id}
                          className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent"
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Section 7: Notes */}
          {step.notes && (
            <>
              <Divider />
              <div className="space-y-1">
                <SectionLabel>Notes</SectionLabel>
                <p className="whitespace-pre-wrap text-[11px] leading-relaxed text-text-primary">
                  {step.notes}
                </p>
              </div>
            </>
          )}

          {/* Section 8: Reference Images (always visible) */}
          <Divider />
          <div className="group/refs space-y-1.5">
            <div className="flex items-center gap-1.5">
              <SectionLabel>References</SectionLabel>
              {referenceImages.length > 0 && (
                <span className="rounded-full bg-muted px-1.5 text-[9px] text-text-tertiary">
                  {referenceImages.length}
                </span>
              )}
              <button
                onClick={handleAddReference}
                className="rounded p-0.5 text-text-tertiary opacity-0 transition-opacity hover:bg-muted hover:text-accent group-hover/refs:opacity-100"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
            {referenceImages.length > 0 ? (
              <div className="columns-2 gap-1.5">
                {referenceImages.map((img) => (
                  <div
                    key={img.id}
                    className="mb-1.5 cursor-pointer break-inside-avoid rounded border border-border transition-colors hover:border-accent/50"
                    onClick={() => setLightboxIndex(referenceImages.indexOf(img))}
                  >
                    <img
                      src={convertFileSrc(img.file_path)}
                      alt={img.caption ?? "Reference"}
                      className="w-full rounded"
                    />
                    {img.caption && (
                      <p className="mt-0.5 px-1 pb-0.5 text-[9px] text-text-tertiary">{img.caption}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[9px] text-text-tertiary">
                No references yet
              </p>
            )}
          </div>
        </div>
      </ScrollArea>

      <AlertDialog open={uncompleteOpen} onOpenChange={setUncompleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Un-complete this step?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark <span className="font-medium">{step.title}</span> as incomplete.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => completeActiveStep()}>
              Un-complete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reference image lightbox */}
      <ImageLightbox
        images={lightboxImages}
        index={lightboxIndex ?? 0}
        open={lightboxIndex !== null}
        onOpenChange={(open) => !open && setLightboxIndex(null)}
        onIndexChange={setLightboxIndex}
      />
    </div>
  );
}

// ── Start Timer Button ───────────────────────────────────────────────────────

function StartTimerButton({ step }: { step: Step }) {
  const activeTimers = useAppStore((s) => s.activeTimers);
  const addTimer = useAppStore((s) => s.addTimer);
  const [showInput, setShowInput] = useState(false);
  const [customMin, setCustomMin] = useState("");

  const hasTimer = activeTimers.some((t) => t.step_id === step.id);
  const presetMin = getEffectiveDryingMinutes(step);

  const startTimer = async (minutes: number) => {
    try {
      await addTimer(step.id, step.title, minutes);
      toast.success(`Timer started: ${minutes} min`);
      setShowInput(false);
      setCustomMin("");
    } catch (e) {
      toast.error(`Failed to start timer: ${e}`);
    }
  };

  const handleClick = () => {
    if (presetMin) {
      startTimer(presetMin);
    } else {
      setShowInput(true);
    }
  };

  const handleSubmit = () => {
    const min = parsePositiveMinutes(customMin);
    if (!min) { toast.error("Enter a valid duration"); return; }
    startTimer(min);
  };

  if (hasTimer) {
    return (
      <div className="flex w-full items-center justify-center gap-1.5 rounded-md border border-accent/30 px-3 py-2 text-xs font-medium text-accent/50">
        <Timer className="h-3.5 w-3.5" />
        Timer Running
      </div>
    );
  }

  if (showInput) {
    return (
      <div className="flex w-full gap-1.5">
        <input
          type="number"
          min={1}
          placeholder="Minutes"
          value={customMin}
          onChange={(e) => setCustomMin(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          autoFocus
          className="min-w-0 flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-xs text-text-primary outline-none focus:border-accent"
        />
        <button
          onClick={handleSubmit}
          className="rounded-md bg-accent px-2.5 py-1.5 text-xs font-medium text-white hover:bg-accent-hover"
        >
          Start
        </button>
        <button
          onClick={() => { setShowInput(false); setCustomMin(""); }}
          className="rounded-md border border-border px-2 py-1.5 text-xs text-text-tertiary hover:bg-muted"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleClick}
      className="flex w-full items-center justify-center gap-1.5 rounded-md border border-accent/30 px-3 py-2 text-xs font-medium text-accent transition-colors hover:bg-accent/5"
    >
      <Timer className="h-3.5 w-3.5" />
      {presetMin ? `Start Timer (${presetMin} min)` : "Start Timer"}
    </button>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h4 className="text-[10px] font-semibold text-text-tertiary">{children}</h4>;
}

function Divider() {
  return <div className="my-3 h-px bg-border" />;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between text-[10px]">
      <span className="text-text-tertiary">{label}</span>
      <span className="text-text-primary">{value}</span>
    </div>
  );
}

function RelationGroup({
  label,
  ids,
  steps,
  tracks,
  chipClass,
  onNavigate,
}: {
  label: string;
  ids: string[];
  steps: Step[];
  tracks: { id: string; color: string }[];
  chipClass: string;
  onNavigate: (id: string) => void;
}) {
  return (
    <div className="space-y-0.5">
      <span className="text-[9px] text-text-tertiary">{label}</span>
      <div className="flex flex-wrap gap-1">
        {ids.map((id) => {
          const s = steps.find((st) => st.id === id);
          const t = s ? tracks.find((tr) => tr.id === s.track_id) : null;
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium hover:opacity-80 ${chipClass}`}
            >
              {t && (
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: t.color }}
                />
              )}
              {s?.title ?? id.slice(0, 6)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
