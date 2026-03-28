import { useMemo, useState } from "react";
import { Grid3X3, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppStore } from "@/store";
import { comparePartNumbers } from "@/shared/utils";
import { SprueLightbox } from "./SprueLightbox";
import { SprueCropThumb } from "./SprueCropThumb";

const THUMB_W = 180;
const THUMB_H = 100;

export function SpruePanel() {
  const sprueRefs = useAppStore((s) => s.sprueRefs);
  const spruePanelOpen = useAppStore((s) => s.spruePanelOpen);
  const toggleSpruePanel = useAppStore((s) => s.toggleSpruePanel);
  const activeStepId = useAppStore((s) => s.activeStepId);
  const activeStepParts = useAppStore((s) => s.activeStepId ? s.stepSprueParts[s.activeStepId] ?? [] : []);

  const [lightboxLabel, setLightboxLabel] = useState<string | null>(null);

  const activeLabels = useMemo(() => {
    return new Set(activeStepParts.map((p) => p.sprue_label));
  }, [activeStepParts]);

  const relevantRefs = useMemo(() => {
    if (activeLabels.size === 0) return [];
    return sprueRefs
      .filter((r) => activeLabels.has(r.label))
      .sort((a, b) => a.display_order - b.display_order);
  }, [sprueRefs, activeLabels]);

  const stepPartsBySprue = useMemo(() => {
    if (activeStepParts.length === 0) return new Map<string, string[]>();
    const map = new Map<string, string[]>();
    for (const p of activeStepParts) {
      const list = map.get(p.sprue_label) ?? [];
      if (p.part_number) list.push(p.part_number);
      map.set(p.sprue_label, list);
    }
    for (const [label, nums] of map) {
      map.set(label, nums.sort(comparePartNumbers));
    }
    return map;
  }, [activeStepParts]);

  if (sprueRefs.length === 0) return null;

  if (!spruePanelOpen) {
    return (
      <button
        onClick={toggleSpruePanel}
        className="absolute bottom-2 right-2 z-10 flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background/95 shadow-md backdrop-blur-sm transition-colors hover:bg-sidebar"
        title="Sprues (S)"
      >
        <Grid3X3 className="h-4 w-4 text-text-secondary" />
        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-0.5 text-[9px] font-medium text-white">
          {sprueRefs.length}
        </span>
      </button>
    );
  }

  const hasRelevant = relevantRefs.length > 0;

  return (
    <>
      <div className={`absolute bottom-2 right-2 z-10 flex flex-col rounded-lg border border-border bg-background/95 shadow-md backdrop-blur-sm ${
        hasRelevant && relevantRefs.length >= 3 ? "w-[340px]" : "w-[200px]"
      }`}>
        <div className="flex items-center justify-between px-2.5 py-1.5">
          <span className="text-[11px] font-semibold text-text-primary">Sprues</span>
          <button
            onClick={toggleSpruePanel}
            className="flex h-5 w-5 items-center justify-center rounded text-text-tertiary hover:text-text-secondary"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <ScrollArea className="max-h-[400px]">
          <div className="px-1.5 pb-1.5">
            {hasRelevant ? (
              <div className={relevantRefs.length >= 3 ? "grid grid-cols-2 gap-1" : "flex flex-col gap-1"}>
                {relevantRefs.map((ref) => {
                  const parts = stepPartsBySprue.get(ref.label) ?? [];
                  return (
                    <button
                      key={ref.id}
                      onClick={() => setLightboxLabel(ref.label)}
                      className="flex flex-col gap-1 rounded border border-border p-1.5 text-left hover:bg-sidebar"
                      style={{ borderLeftWidth: 3, borderLeftColor: ref.color }}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-semibold text-text-primary">
                          Sprue {ref.label}
                        </span>
                        {parts.length > 0 && (
                          <span className="min-w-0 truncate text-[9px] text-text-tertiary">
                            {parts.map((n) => `${ref.label}${n}`).join(", ")}
                          </span>
                        )}
                      </div>
                      <div className="flex w-full items-center justify-center overflow-hidden rounded bg-black/[0.03]" style={{ minHeight: 60 }}>
                        <SprueCropThumb
                          sprueRef={ref}
                          width={THUMB_W}
                          height={THUMB_H}
                          className="max-h-[100px]"
                          fallback={<Grid3X3 className="h-4 w-4 text-text-quaternary" />}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="px-1 py-2 text-center text-[10px] text-text-tertiary">
                {activeStepId
                  ? "No sprues for this step"
                  : "Select a step to see its sprues"}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {lightboxLabel && (
        <SprueLightbox
          sprueLabel={lightboxLabel}
          onClose={() => setLightboxLabel(null)}
        />
      )}
    </>
  );
}

