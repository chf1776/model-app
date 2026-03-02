import { cn } from "@/lib/utils";
import { useAppStore } from "@/store";
import { Input } from "@/components/ui/input";
import type { KitStatus } from "@/shared/types";

type FilterOption = KitStatus | "all";

const FILTERS: { value: FilterOption; label: string }[] = [
  { value: "all", label: "All" },
  { value: "building", label: "Building" },
  { value: "shelf", label: "Shelf" },
  { value: "wishlist", label: "Wishlist" },
  { value: "completed", label: "Done" },
];

type KitGroupByOption = "status" | "category" | "manufacturer";

const GROUP_ITEMS: { value: KitGroupByOption; label: string }[] = [
  { value: "status", label: "Status" },
  { value: "category", label: "Category" },
  { value: "manufacturer", label: "Manufacturer" },
];

export function KitToolbar() {
  const statusFilter = useAppStore((s) => s.statusFilter);
  const setStatusFilter = useAppStore((s) => s.setStatusFilter);
  const kits = useAppStore((s) => s.kits);
  const kitGroupBy = useAppStore((s) => s.kitGroupBy);
  const setKitGroupBy = useAppStore((s) => s.setKitGroupBy);
  const kitSearch = useAppStore((s) => s.kitSearch);
  const setKitSearch = useAppStore((s) => s.setKitSearch);

  const getCounts = (status: FilterOption) => {
    if (status === "all") return kits.length;
    return kits.filter((k) => k.status === status).length;
  };

  return (
    <div className="flex items-center gap-2">
      {/* Status filter */}
      <span className="text-[9px] text-text-tertiary">Status:</span>
      <div className="flex items-center rounded-md bg-muted p-[3px]">
        {FILTERS.map((f) => {
          const count = getCounts(f.value);
          const isActive = statusFilter === f.value;
          return (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={cn(
                "rounded-[5px] px-2 py-[3px] text-[10px] transition-colors",
                isActive
                  ? "bg-card font-semibold text-accent shadow-sm"
                  : "text-text-tertiary hover:text-text-secondary",
              )}
            >
              {f.label}
              {count > 0 && (
                <span className="ml-1 opacity-70">{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Group by toggle */}
      <span className="text-[9px] text-text-tertiary">Group:</span>
      <div className="flex items-center rounded-md bg-muted p-[3px]">
        {GROUP_ITEMS.map((item) => (
          <button
            key={item.value}
            onClick={() => setKitGroupBy(item.value)}
            className={cn(
              "rounded-[5px] px-2 py-[3px] text-[10px] transition-colors",
              kitGroupBy === item.value
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
        value={kitSearch}
        onChange={(e) => setKitSearch(e.target.value)}
        placeholder="Search kits..."
        className="h-6 w-[140px] text-[9px]"
      />
    </div>
  );
}
