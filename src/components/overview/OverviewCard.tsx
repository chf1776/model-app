import type { LucideIcon } from "lucide-react";
import { Maximize2, X } from "lucide-react";

interface OverviewCardProps {
  title: string;
  icon: LucideIcon;
  subtitle?: string;
  expanded?: boolean;
  onExpand?: () => void;
  onCollapse?: () => void;
  children: React.ReactNode;
}

export function OverviewCard({
  title,
  icon: Icon,
  subtitle,
  expanded,
  onExpand,
  onCollapse,
  children,
}: OverviewCardProps) {
  return (
    <div
      className={`flex min-h-0 flex-col rounded-lg border border-border bg-card p-2.5${expanded ? " flex-1" : ""}`}
    >
      <div className="mb-1.5 flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 shrink-0 text-text-tertiary" />
        <span className="text-[11px] font-semibold text-text-primary">
          {title}
        </span>
        {subtitle && (
          <span className="ml-auto text-[9px] text-text-tertiary">
            {subtitle}
          </span>
        )}
        {expanded && onCollapse ? (
          <button
            onClick={onCollapse}
            className={`flex items-center justify-center text-text-tertiary hover:text-text-primary${subtitle ? "" : " ml-auto"}`}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : onExpand ? (
          <button
            onClick={onExpand}
            className={`flex items-center justify-center text-text-tertiary hover:text-text-primary${subtitle ? "" : " ml-auto"}`}
          >
            <Maximize2 className="h-2.5 w-2.5" />
          </button>
        ) : null}
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
