import type { LucideIcon } from "lucide-react";

interface OverviewCardProps {
  title: string;
  icon: LucideIcon;
  subtitle?: string;
  children: React.ReactNode;
}

export function OverviewCard({
  title,
  icon: Icon,
  subtitle,
  children,
}: OverviewCardProps) {
  return (
    <div className="flex min-h-0 flex-col rounded-lg border border-border bg-card p-2.5">
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
      </div>
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}
