import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface SegmentedPillItem<T extends string> {
  value: T;
  label: string;
  icon?: ReactNode;
  count?: number;
}

interface SegmentedPillProps<T extends string> {
  items: SegmentedPillItem<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: "sm" | "md";
}

export function SegmentedPill<T extends string>({
  items,
  value,
  onChange,
  size = "md",
}: SegmentedPillProps<T>) {
  return (
    <div className="flex items-center rounded-md bg-muted p-[3px]">
      {items.map((item) => (
        <button
          key={item.value}
          onClick={() => onChange(item.value)}
          className={cn(
            "flex items-center gap-1.5 rounded-[5px] transition-all",
            size === "md"
              ? "px-3 py-[5px] text-xs"
              : "px-2 py-[3px] text-[10px]",
            value === item.value
              ? "bg-card font-semibold text-accent shadow-sm"
              : "bg-transparent font-normal text-text-tertiary hover:text-text-secondary",
          )}
        >
          {item.icon}
          <span>{item.label}</span>
          {item.count !== undefined && (
            <span className="opacity-60">{item.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}
