import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { Check } from "lucide-react";
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
import type { AccessoryType } from "@/shared/types";
import { ACCESSORY_TYPE_COLORS, ACCESSORY_TYPE_LABELS } from "@/shared/types";

const ACCESSORY_TYPES: AccessoryType[] = ["pe", "resin_3d", "decal", "other"];

interface AddAccessoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedKitId?: string | null;
}

export function AddAccessoryDialog({
  open,
  onOpenChange,
  preselectedKitId,
}: AddAccessoryDialogProps) {
  const addAccessory = useAppStore((s) => s.addAccessory);
  const kits = useAppStore((s) => s.kits);

  const [name, setName] = useState("");
  const [type, setType] = useState<AccessoryType>("pe");
  const [status, setStatus] = useState<"shelf" | "wishlist">("shelf");
  const [manufacturer, setManufacturer] = useState("");
  const [brand, setBrand] = useState("");
  const [referenceCode, setReferenceCode] = useState("");
  const [parentKitId, setParentKitId] = useState<string>(
    preselectedKitId ?? "",
  );
  const [kitSearch, setKitSearch] = useState("");
  const [notes, setNotes] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [buyUrl, setBuyUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Sync preselectedKitId when dialog opens
  useEffect(() => {
    if (preselectedKitId) setParentKitId(preselectedKitId);
  }, [preselectedKitId]);

  const filteredKits = useMemo(() => {
    if (!kitSearch.trim()) return kits;
    const q = kitSearch.toLowerCase();
    return kits.filter(
      (k) =>
        k.name.toLowerCase().includes(q) ||
        k.manufacturer?.toLowerCase().includes(q),
    );
  }, [kits, kitSearch]);

  const reset = () => {
    setName("");
    setType("pe");
    setStatus("shelf");
    setManufacturer("");
    setBrand("");
    setReferenceCode("");
    setParentKitId(preselectedKitId ?? "");
    setKitSearch("");
    setNotes("");
    setPrice("");
    setCurrency("USD");
    setBuyUrl("");
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const accessory = await api.createAccessory({
        name: name.trim(),
        type,
        manufacturer: manufacturer.trim() || null,
        brand: brand.trim() || null,
        reference_code: referenceCode.trim() || null,
        parent_kit_id: parentKitId || null,
        status,
        price: price ? parseFloat(price) : null,
        currency: currency || null,
        buy_url: buyUrl.trim() || null,
        notes: notes.trim() || null,
      });
      addAccessory(accessory);
      toast.success(`"${accessory.name}" added`);
      reset();
      onOpenChange(false);
    } catch (err) {
      toast.error(`Failed to add accessory: ${err}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-[480px] border-border bg-card p-4 shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-sm font-bold">
            Add Accessory
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3 overflow-y-auto py-2">
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

          {/* Name */}
          <div className="flex flex-col gap-1">
            <Label className="text-[11px] font-medium">
              Name <span className="text-error">*</span>
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Eduard 1/350 Yamato PE set"
              className="h-8 text-xs"
              autoFocus
            />
          </div>

          {/* Type pills */}
          <div className="flex flex-col gap-1">
            <Label className="text-[11px] font-medium">
              Type <span className="text-error">*</span>
            </Label>
            <div className="flex flex-wrap gap-1">
              {ACCESSORY_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={cn(
                    "rounded-[10px] px-2.5 py-[3px] text-[10px] transition-colors",
                    type === t
                      ? "font-semibold text-white"
                      : "bg-muted text-text-tertiary hover:text-text-secondary",
                  )}
                  style={
                    type === t
                      ? { backgroundColor: ACCESSORY_TYPE_COLORS[t] }
                      : undefined
                  }
                >
                  {ACCESSORY_TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          {/* Manufacturer */}
          <div className="flex flex-col gap-1">
            <Label className="text-[11px] font-medium">Manufacturer</Label>
            <Input
              value={manufacturer}
              onChange={(e) => setManufacturer(e.target.value)}
              placeholder="e.g. Eduard"
              className="h-8 text-xs"
            />
          </div>

          {/* Brand */}
          <div className="flex flex-col gap-1">
            <Label className="text-[11px] font-medium">Brand</Label>
            <Input
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="e.g. Big Ed"
              className="h-8 text-xs"
            />
          </div>

          {/* Reference code */}
          <div className="flex flex-col gap-1">
            <Label className="text-[11px] font-medium">Reference Code</Label>
            <Input
              value={referenceCode}
              onChange={(e) => setReferenceCode(e.target.value)}
              placeholder="e.g. #53268"
              className="h-8 w-[140px] text-xs"
            />
          </div>

          {/* Parent kit picker */}
          <div className="flex flex-col gap-1">
            <Label className="text-[11px] font-medium">Parent Kit</Label>
            {preselectedKitId ? (
              <div className="flex items-center gap-2 rounded-md border border-accent/30 bg-accent/5 px-2 py-1.5">
                <span className="truncate text-[10px] font-medium">
                  {kits.find((k) => k.id === preselectedKitId)?.name ??
                    "Selected kit"}
                </span>
                <Check className="h-3 w-3 text-accent" />
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                <Input
                  value={kitSearch}
                  onChange={(e) => setKitSearch(e.target.value)}
                  placeholder="Search kits..."
                  className="h-7 text-[10px]"
                />
                <div className="max-h-[100px] overflow-y-auto rounded-md border border-border">
                  <button
                    onClick={() => setParentKitId("")}
                    className={cn(
                      "flex w-full items-center px-2 py-1.5 text-left text-[10px] border-b border-border",
                      !parentKitId
                        ? "bg-accent/5 font-medium"
                        : "hover:bg-muted text-text-tertiary",
                    )}
                  >
                    None (standalone)
                  </button>
                  {filteredKits.map((kit) => (
                    <button
                      key={kit.id}
                      onClick={() => setParentKitId(kit.id)}
                      className={cn(
                        "flex w-full items-center gap-2 border-b border-border px-2 py-1.5 text-left last:border-0",
                        parentKitId === kit.id
                          ? "border-accent/30 bg-accent/5"
                          : "hover:bg-muted",
                      )}
                    >
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-[10px] font-medium">
                          {kit.name}
                        </span>
                        <span className="text-[9px] text-text-tertiary">
                          {[kit.manufacturer, kit.scale]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      </div>
                      {parentKitId === kit.id && (
                        <Check className="h-3 w-3 text-accent" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1">
            <Label className="text-[11px] font-medium">Notes</Label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="rounded-md border border-border bg-card px-2.5 py-1.5 text-xs focus:border-accent focus:outline-none"
            />
          </div>

          {/* Wishlist-specific fields */}
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
                <Label className="text-[11px] font-medium">Buy URL</Label>
                <Input
                  value={buyUrl}
                  onChange={(e) => setBuyUrl(e.target.value)}
                  placeholder="https://..."
                  className="h-8 text-xs"
                />
              </div>
            </>
          )}
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
            {submitting ? "Adding..." : "Add Accessory"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
