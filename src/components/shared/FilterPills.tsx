import { cn } from "@/lib/utils";

interface FilterPillsProps<T extends string> {
  filters: { key: T; label: string }[];
  active: T;
  onChange: (key: T) => void;
}

export function FilterPills<T extends string>({ filters, active, onChange }: FilterPillsProps<T>) {
  return (
    <div className="flex gap-1">
      {filters.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={cn(
            "rounded-full px-2 py-0.5 text-[9px] font-medium transition-colors",
            active === key
              ? "bg-accent text-white"
              : "bg-muted text-text-secondary hover:text-text-primary",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
