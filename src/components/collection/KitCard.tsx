import { Play } from "lucide-react";
import type { Kit } from "@/shared/types";
import { STATUS_COLORS, STATUS_LABELS } from "@/shared/types";
import { cn } from "@/lib/utils";

interface KitCardProps {
  kit: Kit;
  onClick: (kit: Kit) => void;
  onStartProject?: (kit: Kit) => void;
}

export function KitCard({ kit, onClick, onStartProject }: KitCardProps) {
  const statusColor = STATUS_COLORS[kit.status];
  const statusLabel = STATUS_LABELS[kit.status];

  return (
    <button
      onClick={() => onClick(kit)}
      className={cn(
        "group/card flex w-full items-center gap-2.5 rounded-lg border border-border bg-card",
        "px-2.5 py-2.5 text-left transition-colors hover:border-accent/30",
      )}
    >
      {/* Thumbnail */}
      <div className="flex h-[42px] w-[56px] shrink-0 items-center justify-center rounded-md bg-muted">
        {kit.box_art_path ? (
          <img
            src={`asset://localhost/${kit.box_art_path}`}
            alt={kit.name}
            className="h-full w-full rounded-md object-cover"
          />
        ) : (
          <div className="h-full w-full rounded-md bg-gradient-to-br from-accent/10 to-accent/5" />
        )}
      </div>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-[13px] font-semibold text-text-primary">
          {kit.name}
        </span>
        <div className="flex items-center gap-1.5 text-[11px]">
          <span className="font-medium" style={{ color: statusColor }}>
            {statusLabel}
          </span>
          {kit.manufacturer && (
            <>
              <span className="text-text-tertiary">·</span>
              <span className="truncate text-text-tertiary">
                {kit.manufacturer}
              </span>
            </>
          )}
          {kit.scale && (
            <>
              <span className="text-text-tertiary">·</span>
              <span className="text-text-tertiary">{kit.scale}</span>
            </>
          )}
        </div>
      </div>

      {/* Start Project button (shelf kits only) */}
      {kit.status === "shelf" && onStartProject && (
        <div
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            onStartProject(kit);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.stopPropagation();
              onStartProject(kit);
            }
          }}
          className="flex h-7 shrink-0 items-center gap-1 rounded-md px-2 text-[10px] font-medium text-text-tertiary opacity-0 transition-all hover:bg-accent/10 hover:text-accent group-hover/card:opacity-100"
        >
          <Play className="h-3 w-3" />
          Start Project
        </div>
      )}
    </button>
  );
}
