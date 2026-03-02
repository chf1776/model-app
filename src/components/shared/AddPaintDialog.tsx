import { useState, useMemo } from "react";
import { toast } from "sonner";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppStore } from "@/store";
import * as api from "@/api";
import { cn } from "@/lib/utils";
import { getColorFamily } from "@/lib/color-family";
import { CATALOGUE, type CataloguePaint } from "@/data/paint-catalogue";
import type { PaintType, PaintFinish } from "@/shared/types";
import { PAINT_TYPE_LABELS, PAINT_FINISH_LABELS } from "@/shared/types";

const PAINT_TYPES: PaintType[] = ["acrylic", "enamel", "lacquer", "oil"];
const PAINT_FINISHES: PaintFinish[] = [
  "flat",
  "semi_gloss",
  "gloss",
  "metallic",
  "clear",
  "satin",
];

const CATALOGUE_BRANDS = [
  "All Brands",
  "Tamiya",
  "Vallejo",
  "Mr. Hobby",
  "AK Interactive",
  "Ammo by Mig Jimenez",
];

interface AddPaintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddPaintDialog({ open, onOpenChange }: AddPaintDialogProps) {
  const addPaint = useAppStore((s) => s.addPaint);
  const [mode, setMode] = useState<"catalogue" | "manual">("catalogue");

  // Catalogue state
  const [catSearch, setCatSearch] = useState("");
  const [catBrandFilter, setCatBrandFilter] = useState("All Brands");
  const [catStatus, setCatStatus] = useState<"owned" | "wishlist">("owned");

  // Manual state
  const [brand, setBrand] = useState("");
  const [name, setName] = useState("");
  const [paintType, setPaintType] = useState<PaintType>("acrylic");
  const [referenceCode, setReferenceCode] = useState("");
  const [finish, setFinish] = useState<PaintFinish | "">("");
  const [color, setColor] = useState("");
  const [status, setStatus] = useState<"owned" | "wishlist">("owned");
  const [notes, setNotes] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [buyUrl, setBuyUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const catalogueResults = useMemo(() => {
    if (!catSearch.trim() || catSearch.trim().length < 2) return [];
    const q = catSearch.toLowerCase();
    const brandFilter =
      catBrandFilter === "All Brands" ? null : catBrandFilter;
    return CATALOGUE.filter(
      (p) =>
        (!brandFilter || p.brand === brandFilter) &&
        (p.name.toLowerCase().includes(q) ||
          p.code.toLowerCase().includes(q)),
    ).slice(0, 50);
  }, [catSearch, catBrandFilter]);

  const reset = () => {
    setCatSearch("");
    setCatBrandFilter("All Brands");
    setCatStatus("owned");
    setBrand("");
    setName("");
    setPaintType("acrylic");
    setReferenceCode("");
    setFinish("");
    setColor("");
    setStatus("owned");
    setNotes("");
    setPrice("");
    setCurrency("USD");
    setBuyUrl("");
    setMode("catalogue");
  };

  const handleCatalogueAdd = async (cat: CataloguePaint) => {
    setSubmitting(true);
    try {
      const colorFamily = cat.hex ? getColorFamily(cat.hex) : undefined;
      const finishVal =
        cat.finish?.toLowerCase().replace("-", "_") as PaintFinish | undefined;
      const paint = await api.createPaint({
        brand: cat.brand,
        name: cat.name,
        type: "acrylic",
        reference_code: cat.code || null,
        finish: finishVal || null,
        color: cat.hex || null,
        color_family: colorFamily || null,
        status: catStatus,
      });
      addPaint(paint);
      toast.success(`"${paint.name}" added`);
      setCatSearch("");
    } catch (err) {
      toast.error(`Failed to add paint: ${err}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleManualSubmit = async () => {
    if (!brand.trim() || !name.trim()) return;
    setSubmitting(true);
    try {
      const colorFamily = color ? getColorFamily(color) : undefined;
      const paint = await api.createPaint({
        brand: brand.trim(),
        name: name.trim(),
        type: paintType,
        reference_code: referenceCode.trim() || null,
        finish: (finish as PaintFinish) || null,
        color: color.trim() || null,
        color_family: colorFamily || null,
        status,
        price: price ? parseFloat(price) : null,
        currency: currency || null,
        buy_url: buyUrl.trim() || null,
        notes: notes.trim() || null,
      });
      addPaint(paint);
      toast.success(`"${paint.name}" added`);
      reset();
      onOpenChange(false);
    } catch (err) {
      toast.error(`Failed to add paint: ${err}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent className="flex max-h-[85vh] max-w-[520px] flex-col border-border bg-card p-4 shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-sm font-bold">Add Paint</DialogTitle>
        </DialogHeader>

        {/* Mode tabs */}
        <div className="flex gap-1 rounded-md bg-muted p-[3px]">
          <button
            type="button"
            onClick={() => setMode("catalogue")}
            className={cn(
              "flex-1 rounded-[5px] py-[3px] text-[10px] transition-colors",
              mode === "catalogue"
                ? "bg-card font-semibold text-accent shadow-sm"
                : "text-text-tertiary",
            )}
          >
            Catalogue
          </button>
          <button
            type="button"
            onClick={() => setMode("manual")}
            className={cn(
              "flex-1 rounded-[5px] py-[3px] text-[10px] transition-colors",
              mode === "manual"
                ? "bg-card font-semibold text-accent shadow-sm"
                : "text-text-tertiary",
            )}
          >
            Manual
          </button>
        </div>

        {mode === "catalogue" ? (
          <div className="flex flex-col gap-2">
            {/* Status toggle */}
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-medium">Add as</Label>
              <div className="flex gap-1 rounded-md bg-muted p-[3px]">
                <button
                  type="button"
                  onClick={() => setCatStatus("owned")}
                  className={cn(
                    "flex-1 rounded-[5px] py-[3px] text-[10px] transition-colors",
                    catStatus === "owned"
                      ? "bg-card font-semibold text-accent shadow-sm"
                      : "text-text-tertiary",
                  )}
                >
                  Owned
                </button>
                <button
                  type="button"
                  onClick={() => setCatStatus("wishlist")}
                  className={cn(
                    "flex-1 rounded-[5px] py-[3px] text-[10px] transition-colors",
                    catStatus === "wishlist"
                      ? "bg-card font-semibold text-warning shadow-sm"
                      : "text-text-tertiary",
                  )}
                >
                  Wishlist
                </button>
              </div>
            </div>

            {/* Search */}
            <Input
              value={catSearch}
              onChange={(e) => setCatSearch(e.target.value)}
              placeholder="Search catalogue (e.g. flat black, XF-1)..."
              className="h-8 text-xs"
              autoFocus
            />

            {/* Brand filter pills */}
            <div className="flex flex-wrap gap-1">
              {CATALOGUE_BRANDS.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setCatBrandFilter(b)}
                  className={cn(
                    "rounded-full px-2 py-[2px] text-[9px] transition-colors",
                    catBrandFilter === b
                      ? "bg-accent font-semibold text-white"
                      : "bg-muted text-text-tertiary hover:text-text-secondary",
                  )}
                >
                  {b}
                </button>
              ))}
            </div>

            {/* Results */}
            <ScrollArea className="max-h-[300px] rounded-md border border-border">
              {catalogueResults.length === 0 ? (
                <p className="px-3 py-6 text-center text-[10px] text-text-tertiary">
                  {catSearch.trim().length < 2
                    ? "Type at least 2 characters to search..."
                    : "No results found"}
                </p>
              ) : (
                <div className="flex flex-col">
                  {catalogueResults.map((cat, i) => (
                    <button
                      key={`${cat.brand}-${cat.code}-${i}`}
                      type="button"
                      disabled={submitting}
                      onClick={() => handleCatalogueAdd(cat)}
                      className="flex items-center gap-2 border-b border-border px-2.5 py-1.5 text-left last:border-0 hover:bg-muted"
                    >
                      <div
                        className="h-3.5 w-3.5 flex-shrink-0 rounded-sm border border-border"
                        style={{ backgroundColor: cat.hex || "#ccc" }}
                      />
                      <span className="min-w-0 flex-1 truncate text-[10px] font-medium">
                        {cat.name}
                      </span>
                      <span className="flex-shrink-0 font-mono text-[9px] text-text-tertiary">
                        {cat.code}
                      </span>
                      <span className="flex-shrink-0 text-[9px] text-text-tertiary">
                        {cat.brand}
                        {cat.range && ` · ${cat.range}`}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="flex flex-col gap-3 py-2">
            {/* Status */}
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-medium">Add as</Label>
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

            {/* Brand */}
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-medium">
                Brand <span className="text-error">*</span>
              </Label>
              <Input
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. Tamiya"
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
                placeholder="e.g. Flat Black"
                className="h-8 text-xs"
              />
            </div>

            {/* Type pills */}
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-medium">
                Type <span className="text-error">*</span>
              </Label>
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

            {/* Reference code */}
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-medium">Reference Code</Label>
              <Input
                value={referenceCode}
                onChange={(e) => setReferenceCode(e.target.value)}
                placeholder="e.g. XF-1"
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
        )}

        {/* Footer for manual mode */}
        {mode === "manual" && (
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
              onClick={handleManualSubmit}
              disabled={!brand.trim() || !name.trim() || submitting}
              className="bg-accent text-xs text-white hover:bg-accent-hover"
            >
              {submitting ? "Adding..." : "Add Paint"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
