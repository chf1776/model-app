import { cn } from "@/lib/utils";
import { useAppStore } from "@/store";
import { Input } from "@/components/ui/input";
import type { AccessoryType, AccessoryStatus } from "@/shared/types";
import { ACCESSORY_TYPE_COLORS } from "@/shared/types";

type StatusFilterOption = "all" | AccessoryStatus;

const STATUS_FILTERS: { value: StatusFilterOption; label: string }[] = [
  { value: "all", label: "All" },
  { value: "shelf", label: "Owned" },
  { value: "wishlist", label: "Wishlist" },
];

type TypeFilterOption = "all" | AccessoryType;

const TYPE_FILTERS: { value: TypeFilterOption; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pe", label: "PE" },
  { value: "resin_3d", label: "Resin" },
  { value: "decal", label: "Decal" },
  { value: "other", label: "Other" },
];

type GroupByOption = "type" | "parent_kit";

const GROUP_ITEMS: { value: GroupByOption; label: string }[] = [
  { value: "type", label: "Type" },
  { value: "parent_kit", label: "Parent Kit" },
];

export function AccessoryToolbar() {
  const accessoryStatusFilter = useAppStore((s) => s.accessoryStatusFilter);
  const setAccessoryStatusFilter = useAppStore((s) => s.setAccessoryStatusFilter);
  const accessoryTypeFilter = useAppStore((s) => s.accessoryTypeFilter);
  const setAccessoryTypeFilter = useAppStore((s) => s.setAccessoryTypeFilter);
  const accessoryGroupBy = useAppStore((s) => s.accessoryGroupBy);
  const setAccessoryGroupBy = useAppStore((s) => s.setAccessoryGroupBy);
  const accessorySearch = useAppStore((s) => s.accessorySearch);
  const setAccessorySearch = useAppStore((s) => s.setAccessorySearch);

  return (
    <div className="flex items-center gap-2">
      {/* Status filter chips */}
      <div className="flex items-center gap-1">
        {STATUS_FILTERS.map((f) => {
          const isActive = accessoryStatusFilter === f.value;
          return (
            <button
              key={f.value}
              onClick={() => setAccessoryStatusFilter(f.value)}
              className={cn(
                "rounded-[10px] px-2 py-[3px] text-[10px] transition-colors",
                isActive
                  ? "bg-accent-muted font-semibold text-accent"
                  : "bg-transparent font-normal text-text-tertiary hover:text-text-secondary",
              )}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Type filter pills */}
      <div className="flex items-center gap-1">
        {TYPE_FILTERS.map((f) => {
          const isActive = accessoryTypeFilter === f.value;
          const activeColor =
            f.value !== "all" ? ACCESSORY_TYPE_COLORS[f.value] : undefined;
          return (
            <button
              key={f.value}
              onClick={() => setAccessoryTypeFilter(f.value)}
              className={cn(
                "rounded-[10px] px-2 py-[3px] text-[10px] transition-colors",
                isActive
                  ? "font-semibold"
                  : "bg-transparent font-normal text-text-tertiary hover:text-text-secondary",
              )}
              style={
                isActive
                  ? {
                      backgroundColor: activeColor
                        ? `${activeColor}18`
                        : "var(--color-accent-muted)",
                      color: activeColor ?? "var(--color-accent)",
                    }
                  : undefined
              }
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Group by toggle */}
      <div className="flex items-center rounded-md bg-muted p-[3px]">
        {GROUP_ITEMS.map((item) => (
          <button
            key={item.value}
            onClick={() => setAccessoryGroupBy(item.value)}
            className={cn(
              "rounded-[5px] px-2 py-[3px] text-[10px] transition-colors",
              accessoryGroupBy === item.value
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
        value={accessorySearch}
        onChange={(e) => setAccessorySearch(e.target.value)}
        placeholder="Search accessories..."
        className="h-6 w-[140px] text-[10px]"
      />
    </div>
  );
}
