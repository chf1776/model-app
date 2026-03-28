import { useMemo, useState, useCallback } from "react";
import { Grid3X3, ChevronRight } from "lucide-react";
import { useAppStore } from "@/store";
import { comparePartNumbers } from "@/shared/utils";
import { OverviewCard } from "./OverviewCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SprueCropThumb } from "@/components/build/SprueCropThumb";
import type { SprueRef } from "@/shared/types";

interface SprueCardProps {
  expanded: boolean;
  onExpand?: () => void;
  onCollapse: () => void;
}

export function SprueCard({ expanded, onExpand, onCollapse }: SprueCardProps) {
  const sprueRefs = useAppStore((s) => s.sprueRefs);
  const projectSprueParts = useAppStore((s) => s.projectSprueParts);
  const steps = useAppStore((s) => s.steps);
  const setActiveStep = useAppStore((s) => s.setActiveStep);
  const setActiveZone = useAppStore((s) => s.setActiveZone);

  const sorted = useMemo(
    () => [...sprueRefs].sort((a, b) => a.display_order - b.display_order),
    [sprueRefs],
  );

  const partCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of projectSprueParts) {
      map.set(p.sprue_label, (map.get(p.sprue_label) ?? 0) + 1);
    }
    return map;
  }, [projectSprueParts]);

  const partsBySprue = useMemo(() => {
    const map = new Map<string, typeof projectSprueParts>();
    for (const p of projectSprueParts) {
      const list = map.get(p.sprue_label) ?? [];
      list.push(p);
      map.set(p.sprue_label, list);
    }
    return map;
  }, [projectSprueParts]);

  const stepMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of steps) map.set(s.id, s.title);
    return map;
  }, [steps]);

  const totalParts = projectSprueParts.length;
  const empty = sorted.length === 0;

  const subtitle = empty
    ? undefined
    : `${sorted.length} sprue${sorted.length !== 1 ? "s" : ""}`;

  const goToStep = useCallback((stepId: string) => {
    setActiveStep(stepId);
    setActiveZone("build");
  }, [setActiveStep, setActiveZone]);

  if (!expanded) {
    return (
      <OverviewCard
        title="Sprues"
        icon={Grid3X3}
        subtitle={subtitle}
        expanded={false}
        onExpand={onExpand}
        onCollapse={onCollapse}
      >
        {empty ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-1 text-center">
            <Grid3X3 className="h-5 w-5 text-text-quaternary" />
            <p className="max-w-[180px] text-[10px] text-text-tertiary">
              No sprues tracked yet. Set up sprue references in Setup mode, or
              enable AI detection in Settings.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {sorted.slice(0, 6).map((ref) => {
              const count = partCounts.get(ref.label) ?? 0;
              return (
                <div key={ref.id} className="flex items-center gap-1.5">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-sm"
                    style={{ backgroundColor: ref.color }}
                  />
                  <span className="min-w-0 flex-1 truncate text-[10px] text-text-secondary">
                    Sprue {ref.label}
                  </span>
                  <span className="text-[10px] text-text-tertiary">
                    {count} part{count !== 1 ? "s" : ""}
                  </span>
                </div>
              );
            })}
            {sorted.length > 6 && (
              <span className="text-[10px] text-text-tertiary">
                +{sorted.length - 6} more
              </span>
            )}
            <div className="mt-1 border-t border-border pt-1 text-[10px] text-text-tertiary">
              {totalParts} part{totalParts !== 1 ? "s" : ""} tracked across{" "}
              {sorted.length} sprue{sorted.length !== 1 ? "s" : ""}
            </div>
          </div>
        )}
      </OverviewCard>
    );
  }

  return (
    <OverviewCard
      title="Sprues"
      icon={Grid3X3}
      subtitle={subtitle}
      expanded
      onExpand={onExpand}
      onCollapse={onCollapse}
    >
      {empty ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
          <Grid3X3 className="h-8 w-8 text-text-quaternary" />
          <p className="max-w-[240px] text-xs text-text-tertiary">
            No sprues tracked yet. Set up sprue references in Setup mode, or
            enable AI detection in Settings.
          </p>
        </div>
      ) : (
        <ScrollArea className="min-h-0 flex-1">
          <div className="flex flex-col gap-1 pr-2">
            {sorted.map((ref) => (
              <ExpandableSprue
                key={ref.id}
                sprueRef={ref}
                parts={partsBySprue.get(ref.label) ?? []}
                stepMap={stepMap}
                onGoToStep={goToStep}
              />
            ))}
            <div className="mt-2 border-t border-border pt-2 text-xs text-text-tertiary">
              {totalParts} part{totalParts !== 1 ? "s" : ""} tracked across{" "}
              {sorted.length} sprue{sorted.length !== 1 ? "s" : ""}
            </div>
          </div>
        </ScrollArea>
      )}
    </OverviewCard>
  );
}

// ── Expandable sprue row ────────────────────────────────────────────────────

interface ExpandableSprueProps {
  sprueRef: SprueRef;
  parts: { id: string; step_id: string; sprue_label: string; part_number: string | null }[];
  stepMap: Map<string, string>;
  onGoToStep: (stepId: string) => void;
}

function ExpandableSprue({ sprueRef, parts, stepMap, onGoToStep }: ExpandableSprueProps) {
  const [open, setOpen] = useState(false);

  const sortedParts = useMemo(() => {
    return [...parts].sort((a, b) => comparePartNumbers(a.part_number, b.part_number));
  }, [parts]);

  return (
    <div className="rounded border border-border">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 px-2 py-1.5 text-left hover:bg-sidebar"
      >
        <span
          className="h-3 w-3 shrink-0 rounded-sm"
          style={{ backgroundColor: sprueRef.color }}
        />
        <span className="min-w-0 flex-1 text-xs font-medium text-text-primary">
          Sprue {sprueRef.label}
        </span>
        <span className="text-[10px] text-text-tertiary">
          {parts.length} part{parts.length !== 1 ? "s" : ""}
        </span>
        <ChevronRight
          className={`h-3 w-3 text-text-tertiary transition-transform ${open ? "rotate-90" : ""}`}
        />
      </button>

      {open && (
        <div className="border-t border-border">
          {sprueRef.crop_x != null && (
            <div className="flex justify-center border-b border-border bg-black/[0.02] p-2">
              <SprueCropThumb
                sprueRef={sprueRef}
                width={200}
                height={80}
                className="max-h-[80px] max-w-[200px]"
              />
            </div>
          )}
          {sortedParts.length === 0 ? (
            <p className="px-2 py-1.5 text-[10px] text-text-tertiary">No parts recorded</p>
          ) : (
            <div className="flex flex-col">
              {sortedParts.map((part) => {
                const label = part.part_number
                  ? `${sprueRef.label}${part.part_number}`
                  : sprueRef.label;
                const stepTitle = stepMap.get(part.step_id) ?? "Unknown step";
                return (
                  <button
                    key={part.id}
                    onClick={() => onGoToStep(part.step_id)}
                    className="flex items-center gap-1.5 px-2 py-1 text-left hover:bg-sidebar"
                  >
                    <span className="text-[10px] text-success">&#10003;</span>
                    <span className="text-[10px] font-medium text-text-primary">{label}</span>
                    <span className="min-w-0 flex-1 truncate text-[10px] text-text-tertiary">
                      {stepTitle}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
