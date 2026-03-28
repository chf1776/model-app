import { useState, useMemo, useCallback, useRef } from "react";
import { X, RotateCw, Sparkles, Check, Grid3X3 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/store";
import * as api from "@/api";
import { toast } from "sonner";
import { comparePartNumbers } from "@/shared/utils";
import type { StepSpruePart, SprueRef } from "@/shared/types";
import { SprueCropThumb } from "./SprueCropThumb";
import { SprueLightbox } from "./SprueLightbox";

interface PartChipEditorProps {
  stepId: string;
  readOnly?: boolean;
  buildMode?: boolean;
}

/**
 * Parse input like "A15" into { sprueLabel: "A", partNumber: "15" }.
 * Multi-char labels: if a sprue ref exists for the multi-char prefix, use it.
 * Otherwise use just the first letter.
 */
function parsePartInput(
  raw: string,
  sprueRefs: SprueRef[],
): { sprueLabel: string; partNumber: string | null } | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Try matching known multi-char labels (longest first)
  const sortedLabels = sprueRefs
    .map((r) => r.label)
    .sort((a, b) => b.length - a.length);

  for (const label of sortedLabels) {
    if (trimmed.toUpperCase().startsWith(label.toUpperCase())) {
      const rest = trimmed.slice(label.length).trim();
      return {
        sprueLabel: label,
        partNumber: rest || null,
      };
    }
  }

  // No known label matched — use first letter, rest is part number
  const firstLetter = trimmed[0].toUpperCase();
  if (!/[A-Z]/.test(firstLetter)) return null;

  const rest = trimmed.slice(1).trim();
  return {
    sprueLabel: firstLetter,
    partNumber: rest || null,
  };
}

export function PartChipEditor({ stepId, readOnly = false, buildMode = false }: PartChipEditorProps) {
  const sprueRefs = useAppStore((s) => s.sprueRefs);
  const stepSprueParts = useAppStore((s) => s.stepSprueParts);
  const addStepSpruePartStore = useAppStore((s) => s.addStepSpruePartStore);
  const removeStepSpruePartStore = useAppStore((s) => s.removeStepSpruePartStore);
  const setSpruePartTicked = useAppStore((s) => s.setSpruePartTicked);
  const activeProjectId = useAppStore((s) => s.activeProjectId);
  const addSprueRefStore = useAppStore((s) => s.addSprueRefStore);
  const redetectStepSprues = useAppStore((s) => s.redetectStepSprues);
  const step = useAppStore((s) => s.steps.find((st) => st.id === stepId));
  const hasApiKey = !!useAppStore((s) => s.settings.ai_api_key);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [lightboxLabel, setLightboxLabel] = useState<string | null>(null);

  const currentParts = stepSprueParts[stepId] ?? [];

  const grouped = useMemo(() => {
    const map = new Map<string, StepSpruePart[]>();
    for (const part of currentParts) {
      const existing = map.get(part.sprue_label) ?? [];
      existing.push(part);
      map.set(part.sprue_label, existing);
    }
    const entries = [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
    for (const [, parts] of entries) {
      parts.sort((a, b) => comparePartNumbers(a.part_number, b.part_number));
    }
    return entries;
  }, [currentParts]);

  const colorMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const ref of sprueRefs) {
      m.set(ref.label, ref.color);
    }
    return m;
  }, [sprueRefs]);

  const refMap = useMemo(() => {
    const m = new Map<string, SprueRef>();
    for (const ref of sprueRefs) {
      m.set(ref.label, ref);
    }
    return m;
  }, [sprueRefs]);

  const handleAdd = useCallback(
    async (value: string) => {
      const parsed = parsePartInput(value, sprueRefs);
      if (!parsed) return;

      const isDuplicate = currentParts.some(
        (p) =>
          p.sprue_label === parsed.sprueLabel &&
          (p.part_number ?? null) === parsed.partNumber,
      );
      if (isDuplicate) {
        toast.info("Part already added");
        return;
      }

      try {
        // Auto-create placeholder sprue_refs row if unknown label
        if (!sprueRefs.some((r) => r.label === parsed.sprueLabel) && activeProjectId) {
          const newRef = await api.createSprueRef({
            project_id: activeProjectId,
            label: parsed.sprueLabel,
          });
          addSprueRefStore(newRef);
        }

        const part = await api.addStepSpruePart(
          stepId,
          parsed.sprueLabel,
          parsed.partNumber,
        );
        addStepSpruePartStore(part);
      } catch (e) {
        toast.error(`Failed to add part: ${e}`);
      }
    },
    [stepId, sprueRefs, currentParts, activeProjectId, addSprueRefStore, addStepSpruePartStore],
  );

  const handleRemove = useCallback(
    async (part: StepSpruePart) => {
      try {
        await api.removeStepSpruePart(part.id);
        removeStepSpruePartStore(stepId, part.id);
      } catch (e) {
        toast.error(`Failed to remove part: ${e}`);
      }
    },
    [stepId, removeStepSpruePartStore],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && inputValue.trim()) {
        e.preventDefault();
        handleAdd(inputValue);
        setInputValue("");
      }
    },
    [inputValue, handleAdd],
  );

  if (sprueRefs.length === 0 && currentParts.length === 0) return null;

  return (
    <div className="space-y-2">
      {/* Grouped parts — card layout in build mode, chip layout in setup */}
      {buildMode ? (
        grouped.map(([label, parts]) => {
          const color = colorMap.get(label) ?? "#888";
          const ref = refMap.get(label);
          const ticked = parts.filter((p) => p.is_ticked).length;
          const allTicked = parts.length > 0 && ticked === parts.length;
          return (
            <div
              key={label}
              className={`flex flex-col rounded border p-1.5 ${allTicked ? "border-success" : "border-border"}`}
              style={{ borderLeftWidth: 3, borderLeftColor: allTicked ? undefined : color }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-semibold text-text-primary">
                    Sprue {label}
                  </span>
                </div>
                <span className={`text-[9px] ${allTicked ? "text-success" : "text-text-tertiary"}`}>
                  {ticked}/{parts.length}
                </span>
              </div>
              <div className="mt-1 flex gap-2">
                {/* Thumbnail */}
                {ref && (
                  <button
                    onClick={() => setLightboxLabel(label)}
                    className="flex shrink-0 items-center justify-center overflow-hidden rounded bg-black/[0.03] hover:bg-black/[0.06]"
                    style={{ width: 72, minHeight: 50 }}
                  >
                    <SprueCropThumb
                      sprueRef={ref}
                      width={90}
                      height={70}
                      className="max-h-[70px]"
                      fallback={<Grid3X3 className="h-3.5 w-3.5 text-text-quaternary" />}
                    />
                  </button>
                )}
                {/* Tickable pills */}
                <div className="flex min-w-0 flex-1 flex-wrap content-start gap-1">
                  {parts.map((part) => {
                    const chipLabel = `${label}${part.part_number ?? ""}`;
                    return (
                      <button
                        key={part.id}
                        onClick={() => setSpruePartTicked(stepId, part.id, !part.is_ticked)}
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium transition-colors ${
                          part.is_ticked
                            ? "bg-success/15 text-success"
                            : "hover:opacity-80"
                        }`}
                        style={part.is_ticked ? undefined : {
                          backgroundColor: `${color}15`,
                          color,
                          border: `1px solid ${color}30`,
                        }}
                      >
                        {part.is_ticked && (
                          <Check className="h-3 w-3" strokeWidth={3} />
                        )}
                        <span className={part.is_ticked ? "line-through" : ""}>
                          {chipLabel}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })
      ) : (
        grouped.map(([label, parts]) => {
          const color = colorMap.get(label) ?? "#888";
          return (
            <div key={label} className="space-y-1">
              <div className="flex items-center gap-1.5">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-sm"
                  style={{ backgroundColor: color }}
                />
                <span className="text-[10px] font-medium text-text-secondary">
                  Sprue {label}
                </span>
              </div>
              <div className="flex flex-wrap gap-1 pl-4">
                {parts.map((part) => (
                  <PartChip
                    key={part.id}
                    part={part}
                    color={color}
                    readOnly={readOnly}
                    onRemove={() => handleRemove(part)}
                  />
                ))}
              </div>
            </div>
          );
        })
      )}

      {/* Re-detect / Detect button */}
      {!readOnly && hasApiKey && step?.crop_x != null && (
        <button
          onClick={() => redetectStepSprues(stepId)}
          className="flex items-center gap-1 text-[10px] text-text-tertiary hover:text-accent transition-colors"
          title={step.sprues_detected ? "Re-detect parts with AI" : "Detect parts with AI"}
        >
          {step.sprues_detected ? (
            <RotateCw className="h-3 w-3" />
          ) : (
            <Sparkles className="h-3 w-3" />
          )}
          {step.sprues_detected ? "Re-detect" : "Detect parts"}
        </button>
      )}

      {/* Add input */}
      {!readOnly && (
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type part e.g. A15, B7..."
          className="h-7 text-[11px]"
        />
      )}

      {/* Lightbox */}
      {lightboxLabel && (
        <SprueLightbox
          sprueLabel={lightboxLabel}
          onClose={() => setLightboxLabel(null)}
        />
      )}
    </div>
  );
}

// ── Part Chip ───────────────────────────────────────────────────────────────

function PartChip({
  part,
  color,
  readOnly,
  onRemove,
}: {
  part: StepSpruePart;
  color: string;
  readOnly: boolean;
  onRemove: () => void;
}) {
  const chipLabel = part.part_number
    ? `${part.sprue_label}${part.part_number}`
    : part.sprue_label;

  return (
    <span
      className="group/chip inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium"
      style={{
        backgroundColor: `${color}18`,
        color,
        border: `1px solid ${color}30`,
      }}
    >
      {part.ai_detected && (
        <span className="mr-0.5 text-[9px]" title="AI-detected">
          &#10024;
        </span>
      )}
      {chipLabel}
      {!readOnly && (
        <button
          onClick={onRemove}
          className="ml-0.5 rounded-full opacity-0 transition-opacity hover:opacity-100 group-hover/chip:opacity-60"
          title="Remove"
        >
          <X className="h-2.5 w-2.5" />
        </button>
      )}
    </span>
  );
}
