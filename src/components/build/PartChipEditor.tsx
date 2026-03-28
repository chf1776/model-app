import { useState, useMemo, useCallback, useRef } from "react";
import { X, RotateCw, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/store";
import * as api from "@/api";
import { toast } from "sonner";
import type { StepSpruePart, SprueRef } from "@/shared/types";

interface PartChipEditorProps {
  stepId: string;
  readOnly?: boolean;
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

export function PartChipEditor({ stepId, readOnly = false }: PartChipEditorProps) {
  const sprueRefs = useAppStore((s) => s.sprueRefs);
  const stepSprueParts = useAppStore((s) => s.stepSprueParts);
  const addStepSpruePartStore = useAppStore((s) => s.addStepSpruePartStore);
  const removeStepSpruePartStore = useAppStore((s) => s.removeStepSpruePartStore);
  const activeProjectId = useAppStore((s) => s.activeProjectId);
  const addSprueRefStore = useAppStore((s) => s.addSprueRefStore);
  const redetectStepSprues = useAppStore((s) => s.redetectStepSprues);
  const step = useAppStore((s) => s.steps.find((st) => st.id === stepId));
  const hasApiKey = !!useAppStore((s) => s.settings.ai_api_key);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

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
      parts.sort((a, b) => {
        if (!a.part_number && !b.part_number) return 0;
        if (!a.part_number) return -1;
        if (!b.part_number) return 1;
        const numA = parseInt(a.part_number, 10);
        const numB = parseInt(b.part_number, 10);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return a.part_number.localeCompare(b.part_number);
      });
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
      {/* Grouped chips */}
      {grouped.map(([label, parts]) => {
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
      })}

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
