import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/store";
import * as api from "@/api";
import { cn } from "@/lib/utils";
import type { Accessory, AccessoryType } from "@/shared/types";
import { ACCESSORY_TYPE_COLORS, ACCESSORY_TYPE_LABELS } from "@/shared/types";

const ACCESSORY_TYPES: AccessoryType[] = ["pe", "resin_3d", "decal", "other"];

interface EditAccessoryDialogProps {
  accessory: Accessory | null;
  onClose: () => void;
}

export function EditAccessoryDialog({
  accessory,
  onClose,
}: EditAccessoryDialogProps) {
  const updateAccessoryStore = useAppStore((s) => s.updateAccessory);
  const removeAccessory = useAppStore((s) => s.removeAccessory);
  const kits = useAppStore((s) => s.kits);

  const [name, setName] = useState("");
  const [type, setType] = useState<AccessoryType>("pe");
  const [status, setStatus] = useState<"shelf" | "wishlist">("shelf");
  const [manufacturer, setManufacturer] = useState("");
  const [brand, setBrand] = useState("");
  const [referenceCode, setReferenceCode] = useState("");
  const [parentKitId, setParentKitId] = useState("");
  const [kitSearch, setKitSearch] = useState("");
  const [notes, setNotes] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [buyUrl, setBuyUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (accessory) {
      setName(accessory.name);
      setType(accessory.type);
      setStatus(accessory.status);
      setManufacturer(accessory.manufacturer ?? "");
      setBrand(accessory.brand ?? "");
      setReferenceCode(accessory.reference_code ?? "");
      setParentKitId(accessory.parent_kit_id ?? "");
      setKitSearch("");
      setNotes(accessory.notes ?? "");
      setPrice(accessory.price?.toString() ?? "");
      setCurrency(accessory.currency ?? "USD");
      setBuyUrl(accessory.buy_url ?? "");
    }
  }, [accessory]);

  const filteredKits = useMemo(() => {
    if (!kitSearch.trim()) return kits;
    const q = kitSearch.toLowerCase();
    return kits.filter(
      (k) =>
        k.name.toLowerCase().includes(q) ||
        k.manufacturer?.toLowerCase().includes(q),
    );
  }, [kits, kitSearch]);

  const handleSave = async () => {
    if (!accessory || !name.trim()) return;
    setSubmitting(true);
    try {
      const updated = await api.updateAccessory({
        id: accessory.id,
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
      updateAccessoryStore(updated);
      toast.success(`"${updated.name}" updated`);
      onClose();
    } catch (err) {
      toast.error(`Failed to update accessory: ${err}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!accessory) return;
    try {
      await api.deleteAccessory(accessory.id);
      removeAccessory(accessory.id);
      toast.success(`"${accessory.name}" deleted`);
      onClose();
    } catch (err) {
      toast.error(`Failed to delete accessory: ${err}`);
    }
  };

  return (
    <Dialog
      open={accessory !== null}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent className="flex max-h-[85vh] max-w-[480px] flex-col border-border bg-card p-4 shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-sm font-bold">
            Edit Accessory
          </DialogTitle>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-3 py-2">
          {/* Name */}
          <div className="flex flex-col gap-1">
            <Label className="text-[11px] font-medium">
              Name <span className="text-error">*</span>
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          {/* Type pills */}
          <div className="flex flex-col gap-1">
            <Label className="text-[11px] font-medium">Type</Label>
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

          {/* Status */}
          <div className="flex flex-col gap-1">
            <Label className="text-[11px] font-medium">Status</Label>
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

          {/* Manufacturer */}
          <div className="flex flex-col gap-1">
            <Label className="text-[11px] font-medium">Manufacturer</Label>
            <Input
              value={manufacturer}
              onChange={(e) => setManufacturer(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          {/* Brand */}
          <div className="flex flex-col gap-1">
            <Label className="text-[11px] font-medium">Brand</Label>
            <Input
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          {/* Reference code */}
          <div className="flex flex-col gap-1">
            <Label className="text-[11px] font-medium">Reference Code</Label>
            <Input
              value={referenceCode}
              onChange={(e) => setReferenceCode(e.target.value)}
              className="h-8 w-[140px] text-xs"
            />
          </div>

          {/* Parent kit picker */}
          <div className="flex flex-col gap-1">
            <Label className="text-[11px] font-medium">Parent Kit</Label>
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
        </div>

        <DialogFooter className="flex items-center justify-between">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-[360px]">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-sm">
                  Delete "{accessory?.name}"?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-xs">
                  This will permanently remove this accessory. This action
                  cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="text-xs">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-xs text-white hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!name.trim() || submitting}
              className="bg-accent text-xs text-white hover:bg-accent-hover"
            >
              {submitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
