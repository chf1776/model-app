import { useState } from "react";
import { Link2 } from "lucide-react";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store";
import * as api from "@/api";
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
      className="group/row flex items-center gap-2 rounded-md border border-border bg-card transition-colors hover:border-accent/30 cursor-pointer"
      onClick={() => onEdit(accessory)}
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
        </div>
      </div>

      {/* Status pill with popover */}
      <div className="shrink-0 pr-2" onClick={(e) => e.stopPropagation()}>
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
    </div>
  );
}
