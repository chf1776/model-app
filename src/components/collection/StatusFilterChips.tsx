import { cn } from "@/lib/utils";
import { useAppStore } from "@/store";
import type { KitStatus } from "@/shared/types";

type FilterOption = KitStatus | "all";

const FILTERS: { value: FilterOption; label: string }[] = [
  { value: "all", label: "All" },
  { value: "building", label: "Building" },
  { value: "shelf", label: "Shelf" },
  { value: "wishlist", label: "Wishlist" },
  { value: "completed", label: "Done" },
];

export function StatusFilterChips() {
  const statusFilter = useAppStore((s) => s.statusFilter);
  const setStatusFilter = useAppStore((s) => s.setStatusFilter);
  const kits = useAppStore((s) => s.kits);

  const getCounts = (status: FilterOption) => {
    if (status === "all") return kits.length;
    return kits.filter((k) => k.status === status).length;
  };

  return (
    <div className="flex items-center gap-1">
      {FILTERS.map((f) => {
        const count = getCounts(f.value);
        const isActive = statusFilter === f.value;
        return (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={cn(
              "rounded-[10px] px-2 py-[3px] text-[10px] transition-colors",
              isActive
                ? "bg-accent-muted font-semibold text-accent"
                : "bg-transparent font-normal text-text-tertiary hover:text-text-secondary",
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
  );
}
