import { useState } from "react";
import { Link2, ChevronDown, Pencil, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAppStore } from "@/store";
import * as api from "@/api";
import { cn } from "@/lib/utils";
import type { Accessory } from "@/shared/types";
import { ACCESSORY_TYPE_COLORS, ACCESSORY_TYPE_LABELS } from "@/shared/types";

interface AccessoryRowProps {
  accessory: Accessory;
  onEdit: (accessory: Accessory) => void;
  compact?: boolean;
}

export function AccessoryRow({ accessory, onEdit }: AccessoryRowProps) {
  const updateAccessoryStore = useAppStore((s) => s.updateAccessory);
  const [statusPopoverOpen, setStatusPopoverOpen] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const typeColor = ACCESSORY_TYPE_COLORS[accessory.type];
  const typeLabel = ACCESSORY_TYPE_LABELS[accessory.type];
  const isOwned = accessory.status === "shelf";

  const handleStatusToggle = async () => {
    setToggling(true);
    try {
      const newStatus = isOwned ? "wishlist" : "shelf";
      const updated = await api.updateAccessory({
        id: accessory.id,
        status: newStatus,
      });
      updateAccessoryStore(updated);
      toast.success(
        isOwned ? "Moved to wishlist" : "Marked as owned",
      );
    } catch (err) {
      toast.error(`Failed to update status: ${err}`);
    } finally {
      setToggling(false);
      setStatusPopoverOpen(false);
    }
  };

  return (
    <div
      className={cn(
        "rounded-md border border-border bg-card transition-colors",
        expanded && "border-accent/20",
      )}
    >
      {/* Header row (clickable) */}
      <div
        className="group/row flex cursor-pointer items-center gap-2"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Type color bar */}
        <div
          className="h-full w-[3px] shrink-0 self-stretch rounded-l-md"
          style={{ backgroundColor: typeColor }}
        />

        {/* Content */}
        <div className="flex min-w-0 flex-1 flex-col gap-0 py-1.5 pr-1">
          <span className="truncate text-[11px] font-medium text-text-primary">
            {accessory.name}
          </span>
          <div className="flex items-center gap-1 text-[9px]">
            <span className="font-medium" style={{ color: typeColor }}>
              {typeLabel}
            </span>
            {accessory.parent_kit_name && (
              <>
                <span className="text-text-tertiary">·</span>
                <span className="flex items-center gap-0.5 text-text-tertiary">
                  <Link2 className="h-2.5 w-2.5" />
                  <span className="truncate">{accessory.parent_kit_name}</span>
                </span>
              </>
            )}
            {accessory.brand && (
              <>
                <span className="text-text-tertiary">·</span>
                <span className="truncate text-text-tertiary">
                  {accessory.brand}
                </span>
              </>
            )}
            {accessory.status === "wishlist" && accessory.price != null && (
              <>
                <span className="text-text-tertiary">·</span>
                <span className="font-mono text-text-tertiary">
                  ${accessory.price.toFixed(2)}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Status pill with popover */}
        <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
          <Popover open={statusPopoverOpen} onOpenChange={setStatusPopoverOpen}>
            <PopoverTrigger asChild>
              <button
                className={
                  "rounded-full px-2 py-[2px] text-[9px] font-medium transition-colors " +
                  (isOwned
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-amber-100 text-amber-700")
                }
              >
                {isOwned ? "Owned" : "Wishlist"}
              </button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-2"
              side="left"
              align="center"
            >
              <p className="mb-2 text-[11px] font-medium text-text-primary">
                {isOwned ? "Move to wishlist?" : "Mark as owned?"}
              </p>
              <div className="flex gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 text-[10px]"
                  onClick={() => setStatusPopoverOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="h-6 bg-accent text-[10px] text-white hover:bg-accent-hover"
                  onClick={handleStatusToggle}
                  disabled={toggling}
                >
                  {toggling ? "..." : "Confirm"}
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Chevron */}
        <ChevronDown
          className={cn(
            "mr-2 h-3 w-3 shrink-0 text-text-tertiary transition-transform",
            expanded && "rotate-180",
          )}
        />
      </div>

      {/* Expanded tray */}
      {expanded && (
        <div className="border-t border-border px-3 py-2.5">
          {/* Quick-info row */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-text-tertiary">
            <span>
              <span className="font-medium text-text-secondary">Type:</span>{" "}
              {typeLabel}
            </span>
            {accessory.brand && (
              <span>
                <span className="font-medium text-text-secondary">Brand:</span>{" "}
                {accessory.brand}
              </span>
            )}
            {accessory.manufacturer && (
              <span>
                <span className="font-medium text-text-secondary">Manufacturer:</span>{" "}
                {accessory.manufacturer}
              </span>
            )}
            {accessory.reference_code && (
              <span>
                <span className="font-medium text-text-secondary">Ref:</span>{" "}
                {accessory.reference_code}
              </span>
            )}
          </div>

          {/* Parent kit */}
          {accessory.parent_kit_name && (
            <div className="mt-1 flex items-center gap-1 text-[10px] text-text-tertiary">
              <Link2 className="h-2.5 w-2.5" />
              <span>
                <span className="font-medium text-text-secondary">Kit:</span>{" "}
                {accessory.parent_kit_name}
              </span>
            </div>
          )}

          {/* Notes */}
          {accessory.notes && (
            <p className="mt-1 line-clamp-2 text-[10px] text-text-tertiary">
              {accessory.notes}
            </p>
          )}

          {/* Wishlist info */}
          {accessory.status === "wishlist" && (accessory.price != null || accessory.buy_url) && (
            <div className="mt-1 flex items-center gap-3 text-[10px] text-text-tertiary">
              {accessory.price != null && (
                <span>
                  <span className="font-medium text-text-secondary">Price:</span>{" "}
                  <span className="font-mono">${accessory.price.toFixed(2)}</span>
                </span>
              )}
              {accessory.buy_url && (
                <a
                  href={accessory.buy_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-0.5 font-medium text-accent hover:text-accent-hover"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="h-2.5 w-2.5" />
                  Buy link
                </a>
              )}
            </div>
          )}

          <Separator className="my-2" />

          {/* Edit button */}
          <button
            onClick={() => onEdit(accessory)}
            className="flex items-center gap-1 text-[10px] font-medium text-accent hover:text-accent-hover"
          >
            <Pencil className="h-2.5 w-2.5" />
            Edit Accessory
          </button>
        </div>
      )}
    </div>
  );
}
