import { LayoutList, LayoutGrid } from "lucide-react";
import { useAppStore } from "@/store";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { PaintGroupBy } from "@/shared/types";

const GROUP_ITEMS: { value: PaintGroupBy; label: string }[] = [
  { value: "color_family", label: "Color Family" },
  { value: "brand", label: "Brand" },
  { value: "project", label: "Project" },
];

export function PaintsToolbar() {
  const paintGroupBy = useAppStore((s) => s.paintGroupBy);
  const setPaintGroupBy = useAppStore((s) => s.setPaintGroupBy);
  const paintViewMode = useAppStore((s) => s.paintViewMode);
  const setPaintViewMode = useAppStore((s) => s.setPaintViewMode);
  const search = useAppStore((s) => s.paintSearch);
  const setSearch = useAppStore((s) => s.setPaintSearch);

  return (
    <div className="flex items-center gap-2">
      {/* Group by */}
      <span className="text-[9px] text-text-tertiary">Group:</span>
      <div className="flex items-center rounded-md bg-muted p-[3px]">
        {GROUP_ITEMS.map((item) => (
          <button
            key={item.value}
            onClick={() => setPaintGroupBy(item.value)}
            className={cn(
              "rounded-[5px] px-2 py-[3px] text-[10px] transition-colors",
              paintGroupBy === item.value
                ? "bg-card font-semibold text-accent shadow-sm"
                : "text-text-tertiary hover:text-text-secondary",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search paints..."
        className="h-6 w-[140px] text-[9px]"
      />

      {/* View toggle */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={() => setPaintViewMode("list")}
          className={cn(
            "rounded p-1 transition-colors",
            paintViewMode === "list"
              ? "bg-muted text-accent"
              : "text-text-tertiary hover:text-text-secondary",
          )}
        >
          <LayoutList className="h-3 w-3" />
        </button>
        <button
          onClick={() => setPaintViewMode("grid")}
          className={cn(
            "rounded p-1 transition-colors",
            paintViewMode === "grid"
              ? "bg-muted text-accent"
              : "text-text-tertiary hover:text-text-secondary",
          )}
        >
          <LayoutGrid className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
