import { useMemo, useState } from "react";
import { ChevronRight, X } from "lucide-react";
import { useAppStore } from "@/store";
import { KitCard } from "./KitCard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Kit, KitStatus } from "@/shared/types";
import { KIT_CATEGORIES } from "@/shared/types";

interface SectionConfig {
  key: string;
  label: string;
  defaultExpanded: boolean;
}

const STATUS_SECTIONS: SectionConfig[] = [
  { key: "building", label: "Building", defaultExpanded: true },
  { key: "shelf", label: "On Shelf", defaultExpanded: true },
  { key: "wishlist", label: "Wishlist", defaultExpanded: true },
  { key: "completed", label: "Completed", defaultExpanded: false },
];

interface KitsSectionProps {
  label: string;
  defaultExpanded: boolean;
  kits: Kit[];
  onEditKit: (kit: Kit) => void;
  onAddAccessoryForKit: (kitId: string) => void;
  onStartProject?: (kit: Kit) => void;
}

function KitsSection({
  label,
  defaultExpanded,
  kits,
  onEditKit,
  onAddAccessoryForKit,
  onStartProject,
}: KitsSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  if (kits.length === 0) return null;

  return (
    <div className="mt-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-1.5 py-1.5"
      >
        <ChevronRight
          className={cn(
            "h-2.5 w-2.5 text-text-tertiary transition-transform",
            expanded && "rotate-90",
          )}
        />
        <span className="text-xs font-semibold text-text-primary">
          {label}
        </span>
        <span className="text-[10px] text-text-tertiary">{kits.length}</span>
        <div className="ml-1 h-px flex-1 bg-border" />
      </button>
      {expanded && (
        <div className="flex flex-col gap-1 px-4 py-1">
          {kits.map((kit) => (
            <KitCard
              key={kit.id}
              kit={kit}
              onEditKit={onEditKit}
              onAddAccessoryForKit={onAddAccessoryForKit}
              onStartProject={onStartProject}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface KitsTabProps {
  onEditKit: (kit: Kit) => void;
  onAddAccessoryForKit: (kitId: string) => void;
  onStartProject?: (kit: Kit) => void;
}

export function KitsTab({
  onEditKit,
  onAddAccessoryForKit,
  onStartProject,
}: KitsTabProps) {
  const kits = useAppStore((s) => s.kits);
  const statusFilter = useAppStore((s) => s.statusFilter);
  const setStatusFilter = useAppStore((s) => s.setStatusFilter);
  const kitGroupBy = useAppStore((s) => s.kitGroupBy);
  const kitSearch = useAppStore((s) => s.kitSearch);
  const setKitSearch = useAppStore((s) => s.setKitSearch);

  const hasActiveFilters = statusFilter !== "all" || kitSearch !== "";

  const filteredKits = useMemo(() => {
    let result = kits;
    if (statusFilter !== "all") {
      result = result.filter((k) => k.status === statusFilter);
    }
    if (kitSearch.trim()) {
      const q = kitSearch.toLowerCase();
      result = result.filter(
        (k) =>
          k.name.toLowerCase().includes(q) ||
          k.manufacturer?.toLowerCase().includes(q) ||
          k.scale?.toLowerCase().includes(q) ||
          k.kit_number?.toLowerCase().includes(q),
      );
    }
    return result;
  }, [kits, statusFilter, kitSearch]);

  const sections = useMemo((): (SectionConfig & { kits: Kit[] })[] => {
    if (kitGroupBy === "status") {
      const grouped: Record<KitStatus, Kit[]> = {
        building: [],
        shelf: [],
        wishlist: [],
        completed: [],
        paused: [],
      };
      for (const kit of filteredKits) {
        grouped[kit.status].push(kit);
      }
      // Merge paused into building for display
      grouped.building.push(...grouped.paused);
      return STATUS_SECTIONS.map((s) => ({
        ...s,
        kits: grouped[s.key as KitStatus] ?? [],
      }));
    }

    if (kitGroupBy === "category") {
      const map: Record<string, Kit[]> = {};
      for (const kit of filteredKits) {
        const cat = kit.category ?? "__uncategorized__";
        if (!map[cat]) map[cat] = [];
        map[cat].push(kit);
      }
      const result: (SectionConfig & { kits: Kit[] })[] = [];
      for (const cat of KIT_CATEGORIES) {
        if (map[cat.value]?.length) {
          result.push({
            key: cat.value,
            label: cat.label,
            defaultExpanded: true,
            kits: map[cat.value],
          });
        }
      }
      if (map.__uncategorized__?.length) {
        result.push({
          key: "__uncategorized__",
          label: "Uncategorized",
          defaultExpanded: true,
          kits: map.__uncategorized__,
        });
      }
      return result;
    }

    // manufacturer
    const map: Record<string, Kit[]> = {};
    for (const kit of filteredKits) {
      const mfr = kit.manufacturer || "__unknown__";
      if (!map[mfr]) map[mfr] = [];
      map[mfr].push(kit);
    }
    return Object.keys(map)
      .sort((a, b) => {
        if (a === "__unknown__") return 1;
        if (b === "__unknown__") return -1;
        return a.localeCompare(b);
      })
      .map((mfr) => ({
        key: mfr,
        label: mfr === "__unknown__" ? "Unknown" : mfr,
        defaultExpanded: true,
        kits: map[mfr],
      }));
  }, [filteredKits, kitGroupBy]);

  // When filtering by a specific status and grouping by status, show flat list
  if (statusFilter !== "all" && kitGroupBy === "status") {
    return (
      <div className="flex flex-col gap-1 px-4 py-2">
        {filteredKits.map((kit) => (
          <KitCard
            key={kit.id}
            kit={kit}
            onEditKit={onEditKit}
            onAddAccessoryForKit={onAddAccessoryForKit}
            onStartProject={onStartProject}
          />
        ))}
        {filteredKits.length === 0 && hasActiveFilters && (
          <div className="flex flex-col items-center gap-2 py-8">
            <p className="text-xs text-text-tertiary">
              No kits match your filters
            </p>
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1.5 text-[10px]"
              onClick={() => { setStatusFilter("all"); setKitSearch(""); }}
            >
              <X className="h-3 w-3" />
              Clear filters
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="pb-4">
      {sections.map((section) => (
        <KitsSection
          key={section.key}
          label={section.label}
          defaultExpanded={section.defaultExpanded}
          kits={section.kits}
          onEditKit={onEditKit}
          onAddAccessoryForKit={onAddAccessoryForKit}
          onStartProject={onStartProject}
        />
      ))}
      {filteredKits.length === 0 && hasActiveFilters && (
        <div className="flex flex-col items-center gap-2 py-8">
          <p className="text-xs text-text-tertiary">
            No kits match your filters
          </p>
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1.5 text-[10px]"
            onClick={() => { setStatusFilter("all"); setKitSearch(""); }}
          >
            <X className="h-3 w-3" />
            Clear filters
          </Button>
        </div>
      )}
    </div>
  );
}
