import { useState, useEffect } from "react";
import { toast } from "sonner";
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
import { getColorFamily } from "@/lib/color-family";
import type { Paint, PaintType, PaintFinish, ColorFamily } from "@/shared/types";
import {
  PAINT_TYPE_LABELS,
  PAINT_FINISH_LABELS,
  COLOR_FAMILY_LABELS,
  COLOR_FAMILY_ORDER,
} from "@/shared/types";

const PAINT_TYPES: PaintType[] = ["acrylic", "enamel", "lacquer", "oil"];
const PAINT_FINISHES: PaintFinish[] = [
  "flat",
  "semi_gloss",
  "gloss",
  "metallic",
  "clear",
  "satin",
];

interface EditPaintDialogProps {
  paint: Paint | null;
  onClose: () => void;
}

export function EditPaintDialog({ paint, onClose }: EditPaintDialogProps) {
  const updatePaintStore = useAppStore((s) => s.updatePaint);
  const removePaint = useAppStore((s) => s.removePaint);

  const [brand, setBrand] = useState("");
  const [name, setName] = useState("");
  const [paintType, setPaintType] = useState<PaintType>("acrylic");
  const [referenceCode, setReferenceCode] = useState("");
  const [finish, setFinish] = useState<PaintFinish | "">("");
  const [color, setColor] = useState("");
  const [colorFamily, setColorFamily] = useState<ColorFamily | "">("");
  const [status, setStatus] = useState<"owned" | "wishlist">("owned");
  const [notes, setNotes] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [buyUrl, setBuyUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (paint) {
      setBrand(paint.brand);
      setName(paint.name);
      setPaintType(paint.type);
      setReferenceCode(paint.reference_code ?? "");
      setFinish(paint.finish ?? "");
      setColor(paint.color ?? "");
      setColorFamily(paint.color_family ?? "");
      setStatus(paint.status);
      setNotes(paint.notes ?? "");
      setPrice(paint.price?.toString() ?? "");
      setCurrency(paint.currency ?? "USD");
      setBuyUrl(paint.buy_url ?? "");
    }
  }, [paint]);

  // Auto-assign color family when color changes
  useEffect(() => {
    if (color && /^#[0-9a-fA-F]{6}$/.test(color)) {
      setColorFamily(getColorFamily(color));
    }
  }, [color]);

  const handleSave = async () => {
    if (!paint || !brand.trim() || !name.trim()) return;
    setSubmitting(true);
    try {
      const updated = await api.updatePaint({
        id: paint.id,
        brand: brand.trim(),
        name: name.trim(),
        type: paintType,
        reference_code: referenceCode.trim() || null,
        finish: (finish as PaintFinish) || null,
        color: color.trim() || null,
        color_family: (colorFamily as ColorFamily) || null,
        status,
        price: price ? parseFloat(price) : null,
        currency: currency || null,
        buy_url: buyUrl.trim() || null,
        notes: notes.trim() || null,
      });
      updatePaintStore(updated);
      toast.success(`"${updated.name}" updated`);
      onClose();
    } catch (err) {
      toast.error(`Failed to update paint: ${err}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!paint) return;
    try {
      await api.deletePaint(paint.id);
      removePaint(paint.id);
      toast.success(`"${paint.name}" deleted`);
      onClose();
    } catch (err) {
      toast.error(`Failed to delete paint: ${err}`);
    }
  };

  return (
    <Dialog
      open={paint !== null}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent className="max-h-[85vh] max-w-[480px] border-border bg-card p-4 shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-sm font-bold">Edit Paint</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3 overflow-y-auto py-2">
          {/* Brand */}
          <div className="flex flex-col gap-1">
            <Label className="text-[11px] font-medium">
              Brand <span className="text-error">*</span>
            </Label>
            <Input
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

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
              {PAINT_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setPaintType(t)}
                  className={cn(
                    "rounded-[10px] px-2.5 py-[3px] text-[10px] transition-colors",
                    paintType === t
                      ? "bg-accent font-semibold text-white"
                      : "bg-muted text-text-tertiary hover:text-text-secondary",
                  )}
                >
                  {PAINT_TYPE_LABELS[t]}
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
                onClick={() => setStatus("owned")}
                className={cn(
                  "flex-1 rounded-[5px] py-[3px] text-[10px] transition-colors",
                  status === "owned"
                    ? "bg-card font-semibold text-accent shadow-sm"
                    : "text-text-tertiary",
                )}
              >
                Owned
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

          {/* Reference code */}
          <div className="flex flex-col gap-1">
            <Label className="text-[11px] font-medium">Reference Code</Label>
            <Input
              value={referenceCode}
              onChange={(e) => setReferenceCode(e.target.value)}
              className="h-8 w-[140px] text-xs"
            />
          </div>

          {/* Finish pills */}
          <div className="flex flex-col gap-1">
            <Label className="text-[11px] font-medium">Finish</Label>
            <div className="flex flex-wrap gap-1">
              {PAINT_FINISHES.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFinish(finish === f ? "" : f)}
                  className={cn(
                    "rounded-[10px] px-2.5 py-[3px] text-[10px] transition-colors",
                    finish === f
                      ? "bg-accent font-semibold text-white"
                      : "bg-muted text-text-tertiary hover:text-text-secondary",
                  )}
                >
                  {PAINT_FINISH_LABELS[f]}
                </button>
              ))}
            </div>
          </div>

          {/* Color hex input + preview */}
          <div className="flex flex-col gap-1">
            <Label className="text-[11px] font-medium">Color (hex)</Label>
            <div className="flex items-center gap-2">
              <Input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="#000000"
                className="h-8 w-[120px] font-mono text-xs"
              />
              {color && /^#[0-9a-fA-F]{6}$/.test(color) && (
                <div
                  className="h-8 w-8 rounded-md border border-border"
                  style={{ backgroundColor: color }}
                />
              )}
            </div>
          </div>

          {/* Color family override */}
          <div className="flex flex-col gap-1">
            <Label className="text-[11px] font-medium">
              Color Family
              {color && /^#[0-9a-fA-F]{6}$/.test(color) && (
                <span className="ml-1 text-[9px] font-normal text-text-tertiary">
                  (auto-assigned, override below)
                </span>
              )}
            </Label>
            <div className="flex flex-wrap gap-1">
              {COLOR_FAMILY_ORDER.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setColorFamily(f)}
                  className={cn(
                    "rounded-[10px] px-2 py-[2px] text-[9px] transition-colors",
                    colorFamily === f
                      ? "bg-accent font-semibold text-white"
                      : "bg-muted text-text-tertiary hover:text-text-secondary",
                  )}
                >
                  {COLOR_FAMILY_LABELS[f]}
                </button>
              ))}
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
                  Delete "{paint?.name}"?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-xs">
                  This will permanently remove this paint. This action cannot be
                  undone.
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
              disabled={!brand.trim() || !name.trim() || submitting}
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
