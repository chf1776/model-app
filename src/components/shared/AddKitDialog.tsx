import { useState } from "react";
import { toast } from "sonner";
import { ImagePlus } from "lucide-react";
import { open as openFileDialog } from "@tauri-apps/plugin-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/store";
import * as api from "@/api";
import { cn } from "@/lib/utils";
import {
  COMMON_SCALES,
  KIT_CATEGORIES,
  type KitCategory,
  type KitStatus,
} from "@/shared/types";

interface AddKitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddKitDialog({ open, onOpenChange }: AddKitDialogProps) {
  const addKit = useAppStore((s) => s.addKit);
  const settings = useAppStore((s) => s.settings);

  const [name, setName] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [scale, setScale] = useState("");
  const [kitNumber, setKitNumber] = useState("");
  const [category, setCategory] = useState<KitCategory | "">("");
  const [status, setStatus] = useState<"shelf" | "wishlist">("shelf");
  const [boxArtPath, setBoxArtPath] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState(settings.default_currency || "USD");
  const [retailerUrl, setRetailerUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setName("");
    setManufacturer("");
    setScale("");
    setKitNumber("");
    setCategory("");
    setStatus("shelf");
    setBoxArtPath("");
    setPrice("");
    setCurrency(settings.default_currency || "USD");
    setRetailerUrl("");
  };

  const handlePickImage = async () => {
    const file = await openFileDialog({
      multiple: false,
      filters: [
        { name: "Images", extensions: ["png", "jpg", "jpeg", "webp"] },
      ],
    });
    if (file) {
      setBoxArtPath(file);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const kit = await api.createKit({
        name: name.trim(),
        manufacturer: manufacturer.trim() || null,
        scale: scale || null,
        kit_number: kitNumber.trim() || null,
        status: status as KitStatus,
        category: (category as KitCategory) || null,
        price: price ? parseFloat(price) : null,
        currency: currency.trim() || null,
        retailer_url: retailerUrl.trim() || null,
      });

      // Save box art if provided
      if (boxArtPath) {
        try {
          await api.saveBoxArt(kit.id, boxArtPath);
          // Re-fetch the kit to get updated box_art_path
          const kits = await api.listKits();
          const updated = kits.find((k) => k.id === kit.id);
          if (updated) {
            addKit(updated);
          } else {
            addKit(kit);
          }
        } catch {
          addKit(kit);
        }
      } else {
        addKit(kit);
      }

      toast.success(`"${kit.name}" added to collection`);
      reset();
      onOpenChange(false);
    } catch (err) {
      toast.error(`Failed to add kit: ${err}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] max-w-[480px] flex-col border-border bg-card p-4 shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-sm font-bold">Add Kit</DialogTitle>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-3 py-2">
          {/* Status */}
          <div className="flex flex-col gap-1">
            <Label className="text-[11px] font-medium">Add as</Label>
            <div className="flex gap-1 rounded-md bg-muted p-[3px]">
              <button
                type="button"
                onClick={() => setStatus("shelf")}
                className={cn(
                  "flex-1 rounded-[5px] py-[3px] text-[10px] transition-colors",
                  status === "shelf"
                    ? "bg-card font-semibold text-accent shadow-sm"
                    : "text-text-tertiary",
                )}
              >
                On Shelf
              </button>
              <button
                type="button"
                onClick={() => setStatus("wishlist")}
                className={cn(
                  "flex-1 rounded-[5px] py-[3px] text-[10px] transition-colors",
                  status === "wishlist"
                    ? "bg-card font-semibold text-warning shadow-sm"
                    : "text-text-tertiary",
                )}
              >
                Wishlist
              </button>
            </div>
          </div>

          {/* Name (required) */}
          <div className="flex flex-col gap-1">
            <Label className="text-[11px] font-medium">
              Name <span className="text-error">*</span>
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. IJN Yamato"
              className="h-8 text-xs"
              autoFocus
            />
          </div>

          {/* Manufacturer */}
          <div className="flex flex-col gap-1">
            <Label className="text-[11px] font-medium">Manufacturer</Label>
            <Input
              value={manufacturer}
              onChange={(e) => setManufacturer(e.target.value)}
              placeholder="e.g. Tamiya"
              className="h-8 text-xs"
            />
          </div>

          {/* Scale pills */}
          <div className="flex flex-col gap-1">
            <Label className="text-[11px] font-medium">Scale</Label>
            <div className="flex flex-wrap gap-1">
              {COMMON_SCALES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setScale(scale === s ? "" : s)}
                  className={cn(
                    "rounded-[10px] px-2.5 py-[3px] text-[10px] transition-colors",
                    scale === s
                      ? "bg-accent font-semibold text-white"
                      : "bg-muted text-text-tertiary hover:text-text-secondary",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Kit number */}
          <div className="flex flex-col gap-1">
            <Label className="text-[11px] font-medium">Kit Number</Label>
            <Input
              value={kitNumber}
              onChange={(e) => setKitNumber(e.target.value)}
              placeholder="e.g. #78030"
              className="h-8 w-[140px] text-xs"
            />
          </div>

          {/* Category pills */}
          <div className="flex flex-col gap-1">
            <Label className="text-[11px] font-medium">Category</Label>
            <div className="flex flex-wrap gap-1">
              {KIT_CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() =>
                    setCategory(category === c.value ? "" : c.value)
                  }
                  className={cn(
                    "rounded-[10px] px-2.5 py-[3px] text-[10px] transition-colors",
                    category === c.value
                      ? "bg-accent font-semibold text-white"
                      : "bg-muted text-text-tertiary hover:text-text-secondary",
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Box art picker */}
          <div className="flex flex-col gap-1">
            <Label className="text-[11px] font-medium">Box Art</Label>
            <button
              type="button"
              onClick={handlePickImage}
              className="flex h-16 items-center justify-center rounded-md border border-dashed border-border text-xs text-text-tertiary hover:border-accent hover:text-accent"
            >
              <ImagePlus className="mr-1.5 h-4 w-4" />
              {boxArtPath ? "Image selected" : "Choose image..."}
            </button>
          </div>

          {/* Wishlist fields */}
          {status === "wishlist" && (
            <>
              <div className="flex gap-2">
                <div className="flex flex-col gap-1">
                  <Label className="text-[11px] font-medium">Price</Label>
                  <Input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00"
                    className="h-8 w-[100px] text-xs"
                    step="0.01"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-[11px] font-medium">Currency</Label>
                  <Input
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="h-8 w-[70px] text-xs"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-[11px] font-medium">Retailer URL</Label>
                <Input
                  value={retailerUrl}
                  onChange={(e) => setRetailerUrl(e.target.value)}
                  placeholder="https://..."
                  className="h-8 text-xs"
                />
              </div>
            </>
          )}
        </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              reset();
              onOpenChange(false);
            }}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!name.trim() || submitting}
            className="bg-accent text-xs text-white hover:bg-accent-hover"
          >
            {submitting ? "Adding..." : "Add Kit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
