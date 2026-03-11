import { useState, useMemo, useCallback } from "react";
import { Package, ClipboardCopy } from "lucide-react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { toast } from "sonner";
import { useAppStore } from "@/store";
import {
  ACCESSORY_TYPE_LABELS,
  ACCESSORY_TYPE_COLORS,
  PAINT_TYPE_LABELS,
  PAINT_FINISH_LABELS,
} from "@/shared/types";
import type { Accessory, Paint, PaletteEntry } from "@/shared/types";
import { OverviewCard } from "./OverviewCard";
import { PaletteSection } from "./PaletteSection";
import { FilterPills } from "@/components/shared/FilterPills";
import { getSwatchStyle } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const MAX_ACCESSORIES = 4;
const MAX_PAINTS = 6;
const MAX_PALETTE = 8;

type MaterialsFilter = "all" | "owned" | "needed";

const FILTER_LABELS: { key: MaterialsFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "owned", label: "Owned" },
  { key: "needed", label: "Needed" },
];

function filterAccessories(accessories: Accessory[], filter: MaterialsFilter): Accessory[] {
  if (filter === "all") return accessories;
  if (filter === "owned") return accessories.filter((a) => a.status === "shelf");
  return accessories.filter((a) => a.status === "wishlist");
}

function filterPaints(paints: Paint[], filter: MaterialsFilter): Paint[] {
  if (filter === "all") return paints;
  if (filter === "owned") return paints.filter((p) => p.status === "owned");
  return paints.filter((p) => p.status === "wishlist");
}

function buildShoppingList(accessories: Accessory[], paints: Paint[]): string {
  const needed = accessories.filter((a) => a.status === "wishlist");
  const neededPaints = paints.filter((p) => p.status === "wishlist");

  const lines: string[] = ["Shopping List", "─────────────"];

  if (needed.length > 0) {
    lines.push("Accessories:");
    for (const a of needed) {
      const typeLabel = ACCESSORY_TYPE_LABELS[a.type] ?? a.type;
      const details = [a.manufacturer, a.reference_code].filter(Boolean).join(", ");
      lines.push(`- [${typeLabel}] ${a.name}${details ? ` (${details})` : ""}`);
    }
  }

  if (needed.length > 0 && neededPaints.length > 0) {
    lines.push("");
  }

  if (neededPaints.length > 0) {
    lines.push("Paints:");
    for (const p of neededPaints) {
      const typeLabel = PAINT_TYPE_LABELS[p.type];
      const details = [typeLabel, p.finish ? PAINT_FINISH_LABELS[p.finish] : null]
        .filter(Boolean)
        .join(", ");
      lines.push(`- ${p.brand} ${p.name}${details ? ` (${details})` : ""}`);
    }
  }

  return lines.join("\n");
}

interface MaterialsCardProps {
  expanded: boolean;
  onExpand?: () => void;
  onCollapse: () => void;
}

export function MaterialsCard({ expanded, onExpand, onCollapse }: MaterialsCardProps) {
  const accessories = useAppStore((s) => s.overviewAccessories);
  const paints = useAppStore((s) => s.overviewPaints);
  const paletteEntries = useAppStore((s) => s.overviewPaletteEntries);
  const activeProjectId = useAppStore((s) => s.activeProjectId);
  const [filter, setFilter] = useState<MaterialsFilter>("all");

  const accCount = accessories.length;
  const paintCount = paints.length;
  const formulaCount = useMemo(() => paletteEntries.filter((e) => e.is_formula).length, [paletteEntries]);
  const paletteCount = paletteEntries.length;
  const empty = accCount === 0 && paintCount === 0 && paletteCount === 0;

  const neededCount = useMemo(
    () =>
      accessories.filter((a) => a.status === "wishlist").length +
      paints.filter((p) => p.status === "wishlist").length,
    [accessories, paints],
  );

  const filteredAcc = useMemo(() => filterAccessories(accessories, filter), [accessories, filter]);
  const filteredPaints = useMemo(() => filterPaints(paints, filter), [paints, filter]);

  const handleCopy = useCallback(async () => {
    const text = buildShoppingList(accessories, paints);
    await navigator.clipboard.writeText(text);
    toast.success("Shopping list copied to clipboard");
  }, [accessories, paints]);

  const subtitleParts: string[] = [];
  if (accCount > 0) subtitleParts.push(`${accCount} accessor${accCount === 1 ? "y" : "ies"}`);
  if (paintCount > 0) subtitleParts.push(`${paintCount} paint${paintCount === 1 ? "" : "s"}`);
  if (formulaCount > 0) subtitleParts.push(`${formulaCount} formula${formulaCount === 1 ? "" : "s"}`);
  const subtitle = subtitleParts.length > 0 ? subtitleParts.join(" · ") : undefined;

  // ── Compact view ───────────────────────────────────────────────────────────
  if (!expanded) {
    return (
      <OverviewCard title="Materials" icon={Package} expanded={false} onExpand={onExpand} onCollapse={onCollapse}>
        {empty ? (
          <div className="flex h-full items-center justify-center py-3">
            <div className="flex flex-col items-center text-text-tertiary">
              <Package className="mb-1 h-4 w-4 opacity-40" />
              <span className="text-[9px]">No materials linked</span>
              <span className="mt-0.5 text-[8px] opacity-60">
                Link accessories and paints in Collection
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-1.5">
            {accCount > 0 && (
              <div>
                <p className="text-[9px] font-medium text-text-secondary">
                  {accCount} accessor{accCount === 1 ? "y" : "ies"}
                </p>
                <div className="mt-0.5 flex flex-wrap gap-1">
                  {accessories.slice(0, MAX_ACCESSORIES).map((a) => (
                    <span
                      key={a.id}
                      className="rounded px-1 py-0.5 text-[8px] font-medium text-white"
                      style={{
                        backgroundColor:
                          ACCESSORY_TYPE_COLORS[a.type] ?? "#78716C",
                      }}
                    >
                      {ACCESSORY_TYPE_LABELS[a.type] ?? a.type}
                    </span>
                  ))}
                  {accCount > MAX_ACCESSORIES && (
                    <span className="text-[8px] text-text-tertiary">
                      +{accCount - MAX_ACCESSORIES} more
                    </span>
                  )}
                </div>
              </div>
            )}
            {paintCount > 0 && (
              <div>
                <p className="text-[9px] font-medium text-text-secondary">
                  {paintCount} paint{paintCount === 1 ? "" : "s"}
                </p>
                <div className="mt-0.5 flex flex-wrap gap-1">
                  {paints.slice(0, MAX_PAINTS).map((p) => (
                    <span key={p.id} className="flex items-center gap-0.5">
                      {p.color && (
                        <span
                          className="inline-block h-2 w-2 rounded-full border border-border"
                          style={{ backgroundColor: p.color }}
                        />
                      )}
                      <span className="text-[8px] text-text-secondary">
                        {p.name}
                      </span>
                    </span>
                  ))}
                  {paintCount > MAX_PAINTS && (
                    <span className="text-[8px] text-text-tertiary">
                      +{paintCount - MAX_PAINTS} more
                    </span>
                  )}
                </div>
              </div>
            )}
            {paletteCount > 0 && (
              <div>
                <p className="text-[9px] font-medium text-text-secondary">
                  Palette
                </p>
                <div className="mt-0.5 flex flex-wrap items-end gap-1.5">
                  {paletteEntries.slice(0, MAX_PALETTE).map((e) => (
                    <CompactSwatch key={e.id} entry={e} />
                  ))}
                  {paletteCount > MAX_PALETTE && (
                    <span className="text-[8px] text-text-tertiary">
                      +{paletteCount - MAX_PALETTE}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </OverviewCard>
    );
  }

  // ── Expanded view ──────────────────────────────────────────────────────────
  return (
    <OverviewCard
      title="Materials"
      icon={Package}
      subtitle={subtitle}
      expanded
      onExpand={onExpand}
      onCollapse={onCollapse}
    >
      <div className="flex min-h-0 flex-1 flex-col gap-2">
        {/* Header: Copy Shopping List button */}
        {!empty && (
          <div className="flex items-center justify-between">
            <FilterPills filters={FILTER_LABELS} active={filter} onChange={setFilter} />
            <button
              onClick={handleCopy}
              disabled={neededCount === 0}
              className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-medium text-text-secondary hover:bg-muted hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
              title={neededCount === 0 ? "No items needed" : "Copy shopping list to clipboard"}
            >
              <ClipboardCopy className="h-3 w-3" />
              Copy List
            </button>
          </div>
        )}

        {/* BOM list */}
        {!empty && (
          <ScrollArea className="min-h-0 flex-1">
            {filteredAcc.length === 0 && filteredPaints.length === 0 ? (
              <div className="flex items-center justify-center py-6">
                <span className="text-[9px] text-text-tertiary">
                  No {filter === "owned" ? "owned" : "needed"} materials
                </span>
              </div>
            ) : (
              <div className="space-y-3 pr-2">
                {/* Accessories section */}
                {filteredAcc.length > 0 && (
                  <div>
                    <p className="mb-1 text-[9px] font-semibold uppercase tracking-wider text-text-tertiary">
                      Accessories ({filteredAcc.length})
                    </p>
                    <div className="space-y-1">
                      {filteredAcc.map((a) => (
                        <AccessoryRow key={a.id} accessory={a} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Paints section */}
                {filteredPaints.length > 0 && (
                  <div>
                    <p className="mb-1 text-[9px] font-semibold uppercase tracking-wider text-text-tertiary">
                      Paints ({filteredPaints.length})
                    </p>
                    <div className="space-y-1">
                      {filteredPaints.map((p) => (
                        <PaintRow key={p.id} paint={p} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        )}

        {/* Palette section — always visible so users can add entries */}
        {activeProjectId && (
          <>
            {!empty && <Separator />}
            <PaletteSection
              entries={paletteEntries}
              projectId={activeProjectId}
            />
          </>
        )}
      </div>
    </OverviewCard>
  );
}

function MaterialRow({ icon, name, details, isOwned }: {
  icon: React.ReactNode;
  name: string;
  details: string[];
  isOwned: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5 rounded px-1 py-0.5">
      {icon}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[10px] font-medium leading-tight text-text-primary">
          {name}
        </p>
        {details.length > 0 && (
          <p className="truncate text-[9px] leading-tight text-text-tertiary">
            {details.join(" · ")}
          </p>
        )}
      </div>
      <span
        className={cn(
          "shrink-0 rounded-full px-1.5 py-0.5 text-[8px] font-medium",
          isOwned
            ? "bg-emerald-100 text-emerald-700"
            : "bg-amber-100 text-amber-700",
        )}
      >
        {isOwned ? "Owned" : "Wishlist"}
      </span>
    </div>
  );
}

function AccessoryRow({ accessory: a }: { accessory: Accessory }) {
  const typeLabel = ACCESSORY_TYPE_LABELS[a.type] ?? a.type;
  const typeColor = ACCESSORY_TYPE_COLORS[a.type] ?? "#78716C";

  const icon = a.image_path ? (
    <img
      src={convertFileSrc(a.image_path)}
      alt={a.name}
      className="h-6 w-6 shrink-0 rounded object-cover"
    />
  ) : (
    <span
      className="flex h-5 shrink-0 items-center rounded px-1 text-[7px] font-semibold text-white"
      style={{ backgroundColor: typeColor }}
    >
      {typeLabel}
    </span>
  );

  return (
    <MaterialRow
      icon={icon}
      name={a.name}
      details={[a.manufacturer, a.reference_code].filter((x): x is string => !!x)}
      isOwned={a.status === "shelf"}
    />
  );
}

function CompactSwatch({ entry }: { entry: PaletteEntry }) {
  return (
    <div className="text-center">
      <div
        className="h-5 w-5 rounded border border-black/10"
        style={getSwatchStyle(entry)}
        title={entry.name}
      />
      <p className="mt-0.5 max-w-[24px] truncate text-[6px] leading-tight text-text-tertiary">
        {entry.name}
      </p>
    </div>
  );
}

function PaintRow({ paint: p }: { paint: Paint }) {
  const icon = (
    <span
      className="h-4 w-4 shrink-0 rounded-full border border-border"
      style={p.color ? { backgroundColor: p.color } : undefined}
    />
  );

  const details = [p.brand, PAINT_TYPE_LABELS[p.type], p.finish ? PAINT_FINISH_LABELS[p.finish] : null]
    .filter((x): x is string => !!x);

  return (
    <MaterialRow
      icon={icon}
      name={p.name}
      details={details}
      isOwned={p.status === "owned"}
    />
  );
}
