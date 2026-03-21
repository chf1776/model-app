import { useState, useCallback, useEffect } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { open as openFileDialog } from "@tauri-apps/plugin-dialog";
import { openPath, openUrl } from "@tauri-apps/plugin-opener";
import { Play, ChevronDown, Pencil, Plus, FileText, ImageIcon, Paperclip, Link } from "lucide-react";
import { toast } from "sonner";
import { ImageLightbox } from "@/components/shared/ImageLightbox";
import type { Kit, Accessory, KitFile } from "@/shared/types";
import {
  STATUS_COLORS,
  STATUS_LABELS,
  ACCESSORY_TYPE_COLORS,
  ACCESSORY_TYPE_LABELS,
  KIT_CATEGORIES,
  getSettingBool,
} from "@/shared/types";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useAppStore } from "@/store";
import { cn } from "@/lib/utils";
import * as api from "@/api";

interface KitCardProps {
  kit: Kit;
  onEditKit: (kit: Kit) => void;
  onAddAccessoryForKit: (kitId: string) => void;
  onStartProject?: (kit: Kit) => void;
}

export function KitCard({
  kit,
  onEditKit,
  onAddAccessoryForKit,
  onStartProject,
}: KitCardProps) {
  const updateAccessoryStore = useAppStore((s) => s.updateAccessory);
  const settings = useAppStore((s) => s.settings);
  const statusColor = STATUS_COLORS[kit.status];
  const statusLabel = STATUS_LABELS[kit.status];

  const [expanded, setExpanded] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [kitAccessories, setKitAccessories] = useState<Accessory[]>([]);
  const [kitFiles, setKitFiles] = useState<KitFile[]>([]);
  const [loadedTray, setLoadedTray] = useState(false);

  const handleExpand = useCallback(async () => {
    const willExpand = !expanded;
    setExpanded(willExpand);
    if (willExpand && !loadedTray) {
      try {
        const [accessories, files] = await Promise.all([
          api.listAccessoriesForKit(kit.id),
          api.listKitFiles(kit.id),
        ]);
        setKitAccessories(accessories);
        setKitFiles(files);
        setLoadedTray(true);
      } catch (err) {
        console.error("Failed to load tray data:", err);
      }
    }
  }, [expanded, loadedTray, kit.id]);

  // Reload accessories after adding one
  const reloadAccessories = useCallback(async () => {
    try {
      const accessories = await api.listAccessoriesForKit(kit.id);
      setKitAccessories(accessories);
      setLoadedTray(true);
    } catch {
      // ignore
    }
  }, [kit.id]);

  const handleAttachFile = useCallback(async () => {
    const selected = await openFileDialog({
      multiple: false,
      filters: [
        { name: "Documents & Images", extensions: ["pdf", "png", "jpg", "jpeg", "webp"] },
      ],
    });
    if (!selected) return;
    try {
      const file = await api.attachKitFile(kit.id, selected, null);
      setKitFiles((prev) => [...prev, file]);
      toast.success("File attached");
    } catch (err) {
      toast.error(`Failed to attach file: ${err}`);
    }
  }, [kit.id]);

  // Listen for accessory-added events to reload this kit's accessories
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.kitId === kit.id) {
        reloadAccessories();
      }
    };
    window.addEventListener("accessory-added-for-kit", handler);
    return () => window.removeEventListener("accessory-added-for-kit", handler);
  }, [kit.id, reloadAccessories]);

  const handleAccessoryStatusToggle = async (
    accessory: Accessory,
    popoverClose: () => void,
  ) => {
    const isOwned = accessory.status === "shelf";
    try {
      const clearPrice = !isOwned && getSettingBool(settings, "acquire_clear_price");
      const updated = await api.updateAccessory({
        id: accessory.id,
        status: isOwned ? "wishlist" : "shelf",
        ...(clearPrice ? { price: null, currency: null, buy_url: null } : {}),
      });
      updateAccessoryStore(updated);
      setKitAccessories((prev) =>
        prev.map((a) => (a.id === updated.id ? updated : a)),
      );
      toast.success(isOwned ? "Moved to wishlist" : "Marked as owned");
    } catch (err) {
      toast.error(`Failed to update: ${err}`);
    }
    popoverClose();
  };

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card transition-colors",
        expanded && "border-accent/20",
      )}
    >
      {/* Header row (clickable) */}
      <div
        className="group/card flex cursor-pointer items-center gap-2.5 px-2.5 py-2.5"
        onClick={handleExpand}
      >
        {/* Thumbnail */}
        <div
          className="flex h-[42px] w-[56px] shrink-0 items-center justify-center rounded-md bg-muted"
          onClick={
            kit.box_art_path
              ? (e) => {
                  e.stopPropagation();
                  setLightboxOpen(true);
                }
              : undefined
          }
        >
          {kit.box_art_path ? (
            <img
              src={convertFileSrc(kit.box_art_path)}
              alt={kit.name}
              loading="lazy"
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
            {kit.status === "wishlist" && kit.price != null && (
              <>
                <span className="text-text-tertiary">·</span>
                <span className="font-mono text-text-tertiary">
                  ${kit.price.toFixed(2)}
                </span>
              </>
            )}
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
            {kit.scalemates_url && (
              <>
                <span className="text-text-tertiary">·</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openUrl(kit.scalemates_url!).catch(() => {});
                      }}
                      className="flex items-center text-text-tertiary hover:text-accent cursor-pointer"
                    >
                      <Link className="h-3 w-3" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Open on Scalemates</TooltipContent>
                </Tooltip>
              </>
            )}
          </div>
        </div>

        {/* Right-side indicators */}
        <div className="flex items-center gap-1.5">
          {loadedTray && kitFiles.length > 0 && (
            <span className="rounded-full bg-muted px-1.5 py-[1px] text-[9px] font-medium text-text-tertiary">
              {kitFiles.length} file{kitFiles.length !== 1 ? "s" : ""}
            </span>
          )}
          {loadedTray && kitAccessories.length > 0 && (
            <span className="rounded-full bg-muted px-1.5 py-[1px] text-[9px] font-medium text-text-tertiary">
              {kitAccessories.length} part{kitAccessories.length !== 1 ? "s" : ""}
            </span>
          )}
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
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 text-text-tertiary transition-transform",
              expanded && "rotate-180",
            )}
          />
        </div>
      </div>

      {/* Expanded tray */}
      {expanded && (
        <div className="border-t border-border px-3 py-2.5">
          {/* Kit quick-info */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-text-tertiary">
            {kit.scale && (
              <span>
                <span className="font-medium text-text-secondary">Scale:</span>{" "}
                {kit.scale}
              </span>
            )}
            {kit.category && (
              <span>
                <span className="font-medium text-text-secondary">
                  Category:
                </span>{" "}
                {KIT_CATEGORIES.find((c) => c.value === kit.category)?.label ?? kit.category}
              </span>
            )}
            {kit.kit_number && (
              <span>
                <span className="font-medium text-text-secondary">Kit #:</span>{" "}
                {kit.kit_number}
              </span>
            )}
          </div>
          {kit.notes && (
            <p className="mt-1 line-clamp-2 text-[10px] text-text-tertiary">
              {kit.notes}
            </p>
          )}

          {/* Edit Kit button */}
          <button
            onClick={() => onEditKit(kit)}
            className="mt-1.5 flex items-center gap-1 text-[10px] font-medium text-accent hover:text-accent-hover"
          >
            <Pencil className="h-2.5 w-2.5" />
            Edit Kit
          </button>

          <Separator className="my-2" />

          {/* Linked accessories */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-text-primary">
              Accessories
            </span>
            <button
              onClick={() => onAddAccessoryForKit(kit.id)}
              className="flex items-center gap-0.5 text-[10px] font-medium text-accent hover:text-accent-hover"
            >
              <Plus className="h-2.5 w-2.5" />
              Add
            </button>
          </div>

          {kitAccessories.length === 0 ? (
            <p className="mt-1.5 text-[10px] text-text-tertiary">
              No accessories linked
            </p>
          ) : (
            <div className="mt-1.5 flex flex-col gap-1">
              {kitAccessories.map((acc) => {
                const typeColor = ACCESSORY_TYPE_COLORS[acc.type];
                const typeLabel = ACCESSORY_TYPE_LABELS[acc.type];
                const isOwned = acc.status === "shelf";
                return (
                  <div
                    key={acc.id}
                    className="flex items-center gap-2 rounded-md border border-border bg-background px-2 py-1"
                  >
                    <div
                      className="h-full w-[2px] shrink-0 self-stretch rounded-full"
                      style={{ backgroundColor: typeColor }}
                    />
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-[10px] font-medium text-text-primary">
                        {acc.name}
                      </span>
                      <span
                        className="text-[8px] font-medium"
                        style={{ color: typeColor }}
                      >
                        {typeLabel}
                      </span>
                    </div>
                    <StatusPopover
                      isOwned={isOwned}
                      onConfirm={(close) =>
                        handleAccessoryStatusToggle(acc, close)
                      }
                    />
                  </div>
                );
              })}
            </div>
          )}

          <Separator className="my-2" />

          {/* Linked files */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-text-primary">
              Files
              {kitFiles.length > 0 && (
                <span className="ml-1 font-normal text-text-tertiary">
                  {kitFiles.length}
                </span>
              )}
            </span>
            <button
              onClick={handleAttachFile}
              className="flex items-center gap-0.5 text-[10px] font-medium text-accent hover:text-accent-hover"
            >
              <Paperclip className="h-2.5 w-2.5" />
              Attach
            </button>
          </div>

          {kitFiles.length === 0 ? (
            <p className="mt-1.5 text-[10px] text-text-tertiary">
              No files attached
            </p>
          ) : (
            <div className="mt-1.5 flex flex-col gap-1">
              {kitFiles.map((file) => {
                const fileName = file.file_path.split("/").pop() ?? file.file_path;
                const isImage = file.file_type === "image";
                return (
                  <button
                    key={file.id}
                    onClick={() => openPath(file.file_path)}
                    className="flex items-center gap-2 rounded-md border border-border bg-background px-2 py-1 text-left transition-colors hover:border-accent/30"
                  >
                    {isImage ? (
                      <ImageIcon className="h-3 w-3 shrink-0 text-text-tertiary" />
                    ) : (
                      <FileText className="h-3 w-3 shrink-0 text-text-tertiary" />
                    )}
                    <span className="truncate text-[10px] font-medium text-text-primary">
                      {file.label || fileName}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Box art lightbox */}
      {kit.box_art_path && (
        <ImageLightbox
          images={[{ src: convertFileSrc(kit.box_art_path), alt: kit.name }]}
          index={0}
          open={lightboxOpen}
          onOpenChange={setLightboxOpen}
          onIndexChange={() => {}}
          title={`${kit.name} box art`}
        />
      )}
    </div>
  );
}

function StatusPopover({
  isOwned,
  onConfirm,
}: {
  isOwned: boolean;
  onConfirm: (close: () => void) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={
            "rounded-full px-1.5 py-[1px] text-[8px] font-medium " +
            (isOwned
              ? "bg-emerald-100 text-emerald-700"
              : "bg-amber-100 text-amber-700")
          }
        >
          {isOwned ? "Owned" : "Wishlist"}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" side="left" align="center">
        <p className="mb-2 text-[11px] font-medium text-text-primary">
          {isOwned ? "Move to wishlist?" : "Mark as owned?"}
        </p>
        <div className="flex gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="h-6 text-[10px]"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            className="h-6 bg-accent text-[10px] text-white hover:bg-accent-hover"
            onClick={() => onConfirm(() => setOpen(false))}
          >
            Confirm
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
