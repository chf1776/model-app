import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useAppStore } from "@/store";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PaintGroupSection } from "./PaintGroupSection";
import { PaintDetailPanel } from "./PaintDetailPanel";
import { PaintsToolbar } from "./PaintsToolbar";
import type { Paint } from "@/shared/types";
import { COLOR_FAMILY_ORDER, COLOR_FAMILY_LABELS } from "@/shared/types";

interface PaintsTabProps {
  onEdit: (paint: Paint) => void;
  onAdd: () => void;
}

export function PaintsTab({ onEdit, onAdd }: PaintsTabProps) {
  const paints = useAppStore((s) => s.paints);
  const paintGroupBy = useAppStore((s) => s.paintGroupBy);
  const paintViewMode = useAppStore((s) => s.paintViewMode);
  const selectedPaintId = useAppStore((s) => s.selectedPaintId);
  const [search, setSearch] = useState("");

  const selectedPaint = useMemo(
    () => paints.find((p) => p.id === selectedPaintId) ?? null,
    [paints, selectedPaintId],
  );

  const filteredPaints = useMemo(() => {
    if (!search.trim()) return paints;
    const q = search.toLowerCase();
    return paints.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.reference_code?.toLowerCase().includes(q),
    );
  }, [paints, search]);

  const groups = useMemo(() => {
    if (paintGroupBy === "color_family") {
      const map: Record<string, Paint[]> = {};
      for (const p of filteredPaints) {
        const family = p.color_family ?? "greys";
        if (!map[family]) map[family] = [];
        map[family].push(p);
      }
      return COLOR_FAMILY_ORDER.filter((f) => map[f]?.length).map((f) => ({
        key: f,
        label: COLOR_FAMILY_LABELS[f],
        paints: map[f],
      }));
    }

    // Group by brand
    const map: Record<string, Paint[]> = {};
    for (const p of filteredPaints) {
      if (!map[p.brand]) map[p.brand] = [];
      map[p.brand].push(p);
    }
    return Object.keys(map)
      .sort()
      .map((brand) => ({
        key: brand,
        label: brand,
        paints: map[brand],
      }));
  }, [filteredPaints, paintGroupBy]);

  // Determine which groups to expand by default (two largest)
  const defaultExpandedKeys = useMemo(() => {
    const sorted = [...groups].sort((a, b) => b.paints.length - a.paints.length);
    return new Set(sorted.slice(0, 2).map((g) => g.key));
  }, [groups]);

  if (paints.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16">
        <p className="text-sm text-text-tertiary">No paints yet</p>
        <Button
          size="sm"
          className="gap-1.5 bg-accent text-xs text-white hover:bg-accent-hover"
          onClick={onAdd}
        >
          <Plus className="h-3 w-3" />
          Add your first paint
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Toolbar */}
        <div className="border-b border-border px-3 py-1.5">
          <PaintsToolbar search={search} onSearchChange={setSearch} />
        </div>

        {/* Grouped sections */}
        <ScrollArea className="flex-1">
          <div className="pb-4">
            {groups.map((g) => (
              <PaintGroupSection
                key={g.key}
                label={g.label}
                paints={g.paints}
                defaultExpanded={defaultExpandedKeys.has(g.key)}
                viewMode={paintViewMode}
              />
            ))}
            {filteredPaints.length === 0 && search && (
              <p className="py-8 text-center text-xs text-text-tertiary">
                No paints matching "{search}"
              </p>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Detail panel */}
      {selectedPaint && (
        <PaintDetailPanel paint={selectedPaint} onEdit={onEdit} />
      )}
    </div>
  );
}
