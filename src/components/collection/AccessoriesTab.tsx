import { useMemo, useState } from "react";
import { Plus, ChevronRight, X } from "lucide-react";
import { useAppStore } from "@/store";
import { AccessoryRow } from "./AccessoryRow";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Accessory, AccessoryType } from "@/shared/types";
import { ACCESSORY_TYPE_LABELS } from "@/shared/types";

const TYPE_ORDER: AccessoryType[] = ["pe", "resin_3d", "decal", "other"];

interface AccessorySectionProps {
  label: string;
  accessories: Accessory[];
  defaultExpanded: boolean;
  onEdit: (accessory: Accessory) => void;
}

function AccessorySection({
  label,
  accessories,
  defaultExpanded,
  onEdit,
}: AccessorySectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  if (accessories.length === 0) return null;

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
        <span className="text-[10px] text-text-tertiary">
          {accessories.length}
        </span>
        <div className="ml-1 h-px flex-1 bg-border" />
      </button>
      {expanded && (
        <div className="flex flex-col gap-1 px-4 py-1">
          {accessories.map((a) => (
            <AccessoryRow key={a.id} accessory={a} onEdit={onEdit} />
          ))}
        </div>
      )}
    </div>
  );
}

interface AccessoriesTabProps {
  onEdit: (accessory: Accessory) => void;
  onAdd: () => void;
}

export function AccessoriesTab({ onEdit, onAdd }: AccessoriesTabProps) {
  const accessories = useAppStore((s) => s.accessories);
  const accessoryStatusFilter = useAppStore((s) => s.accessoryStatusFilter);
  const setAccessoryStatusFilter = useAppStore((s) => s.setAccessoryStatusFilter);
  const accessoryTypeFilter = useAppStore((s) => s.accessoryTypeFilter);
  const setAccessoryTypeFilter = useAppStore((s) => s.setAccessoryTypeFilter);
  const accessoryGroupBy = useAppStore((s) => s.accessoryGroupBy);
  const setAccessoryGroupBy = useAppStore((s) => s.setAccessoryGroupBy);
  const accessorySearch = useAppStore((s) => s.accessorySearch);
  const setAccessorySearch = useAppStore((s) => s.setAccessorySearch);

  const hasActiveFilters = accessoryStatusFilter !== "all" || accessoryTypeFilter !== "all" || accessorySearch !== "";

  const filteredAccessories = useMemo(() => {
    let result = accessories;
    if (accessoryStatusFilter !== "all") {
      result = result.filter((a) => a.status === accessoryStatusFilter);
    }
    if (accessoryTypeFilter !== "all") {
      result = result.filter((a) => a.type === accessoryTypeFilter);
    }
    if (accessorySearch.trim()) {
      const q = accessorySearch.toLowerCase();
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.brand?.toLowerCase().includes(q) ||
          a.reference_code?.toLowerCase().includes(q),
      );
    }
    return result;
  }, [accessories, accessoryStatusFilter, accessoryTypeFilter, accessorySearch]);

  const sections = useMemo(() => {
    if (accessoryGroupBy === "type") {
      const map: Record<string, Accessory[]> = {};
      for (const a of filteredAccessories) {
        if (!map[a.type]) map[a.type] = [];
        map[a.type].push(a);
      }
      return TYPE_ORDER.filter((t) => map[t]?.length).map((t) => ({
        key: t,
        label: ACCESSORY_TYPE_LABELS[t],
        accessories: map[t],
      }));
    }

    // parent_kit
    const map: Record<string, Accessory[]> = {};
    for (const a of filteredAccessories) {
      const key = a.parent_kit_id ?? "__unlinked__";
      if (!map[key]) map[key] = [];
      map[key].push(a);
    }
    return Object.keys(map)
      .sort((a, b) => {
        if (a === "__unlinked__") return 1;
        if (b === "__unlinked__") return -1;
        const nameA = map[a][0].parent_kit_name ?? "";
        const nameB = map[b][0].parent_kit_name ?? "";
        return nameA.localeCompare(nameB);
      })
      .map((key) => ({
        key,
        label:
          key === "__unlinked__"
            ? "Unlinked"
            : map[key][0].parent_kit_name ?? "Unknown Kit",
        accessories: map[key],
      }));
  }, [filteredAccessories, accessoryGroupBy]);

  if (accessories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16">
        <p className="text-sm text-text-tertiary">No accessories yet</p>
        <Button
          size="sm"
          className="gap-1.5 bg-accent text-xs text-white hover:bg-accent-hover"
          onClick={onAdd}
        >
          <Plus className="h-3 w-3" />
          Add your first accessory
        </Button>
      </div>
    );
  }

  return (
    <div className="pb-4">
      {sections.map((section) => (
        <AccessorySection
          key={section.key}
          label={section.label}
          accessories={section.accessories}
          defaultExpanded={true}
          onEdit={onEdit}
        />
      ))}
      {filteredAccessories.length === 0 && hasActiveFilters && (
        <div className="flex flex-col items-center gap-2 py-8">
          <p className="text-xs text-text-tertiary">
            No accessories match your filters
          </p>
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1.5 text-[10px]"
            onClick={() => {
              setAccessoryStatusFilter("all");
              setAccessoryTypeFilter("all");
              setAccessoryGroupBy("type");
              setAccessorySearch("");
            }}
          >
            <X className="h-3 w-3" />
            Clear filters
          </Button>
        </div>
      )}
    </div>
  );
}
