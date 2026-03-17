import { useState } from "react";
import { toast } from "sonner";
import { ImagePlus, Globe, Loader2 } from "lucide-react";
import { open as openFileDialog } from "@tauri-apps/plugin-dialog";
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
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/store";
import * as api from "@/api";
import { cn } from "@/lib/utils";
import {
  COMMON_SCALES,
  KIT_CATEGORIES,
  SCALEMATES_KIT_URL_PATTERN,
  type KitCategory,
  type KitStatus,
  type ScalematesKitData,
  type ScalematesManual,
} from "@/shared/types";
import { ScalematesDiffDialog } from "./ScalematesDiffDialog";

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
  const [scalematesUrl, setScalematesUrl] = useState("");
  const [scalematesId, setScalematesId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Scalemates import state
  const [importResult, setImportResult] = useState<ScalematesKitData | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [showDiffDialog, setShowDiffDialog] = useState(false);
  const [pendingBoxArtUrl, setPendingBoxArtUrl] = useState<string | null>(null);
  const [pendingManual, setPendingManual] = useState<ScalematesManual | null>(null);
  const [downloadManualOnSave, setDownloadManualOnSave] = useState(false);
  const [showRelatedConfirm, setShowRelatedConfirm] = useState(false);

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
    setScalematesUrl("");
    setScalematesId(null);
    setImportResult(null);
    setPendingBoxArtUrl(null);
    setPendingManual(null);
    setDownloadManualOnSave(false);
    setShowRelatedConfirm(false);
  };

  const isScalematesUrl = scalematesUrl.includes(SCALEMATES_KIT_URL_PATTERN);

  const handleImport = async () => {
    if (!isScalematesUrl) return;
    setImportResult(null);
    setPendingBoxArtUrl(null);
    setPendingManual(null);
    setDownloadManualOnSave(false);
    setIsImporting(true);
    try {
      const data = await api.fetchScalematesData(scalematesUrl);
      setImportResult(data);
      setShowDiffDialog(true);
    } catch (err) {
      toast.error(String(err));
    } finally {
      setIsImporting(false);
    }
  };

  const handleDiffApply = (updates: {
    name?: string;
    manufacturer?: string;
    scale?: string;
    kitNumber?: string;
    category?: KitCategory | "";
    boxArtUrl?: string | null;
    scalematesId?: string;
  }) => {
    if (updates.name) setName(updates.name);
    if (updates.manufacturer) setManufacturer(updates.manufacturer);
    if (updates.scale) setScale(updates.scale);
    if (updates.kitNumber) setKitNumber(updates.kitNumber);
    if (updates.category !== undefined) setCategory(updates.category ?? "");
    if (updates.scalematesId) setScalematesId(updates.scalematesId);
    if (updates.boxArtUrl) {
      setPendingBoxArtUrl(updates.boxArtUrl);
    }

    // Handle manual confirmation after diff
    if (importResult?.manual) {
      setPendingManual(importResult.manual);
      if (importResult.manual.is_exact_match) {
        setDownloadManualOnSave(true);
      } else {
        // Show related boxing confirmation
        setShowRelatedConfirm(true);
      }
    }
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
      setPendingBoxArtUrl(null); // Clear Scalemates box art if user picks local
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      // 1. Create kit
      const kit = await api.createKit({
        name: name.trim(),
        manufacturer: manufacturer.trim() || null,
        scale: scale || null,
        kit_number: kitNumber.trim() || null,
        status: status as KitStatus,
        category: (category as KitCategory) || null,
        scalemates_url: scalematesUrl.trim() || null,
        scalemates_id: scalematesId,
        price: price ? parseFloat(price) : null,
        currency: currency.trim() || null,
        retailer_url: retailerUrl.trim() || null,
      });

      let finalKit = kit;

      // 2. Box art + manual — run in parallel since they're independent
      const boxArtPromise = pendingBoxArtUrl
        ? api.downloadScalematesBoxArt(kit.id, pendingBoxArtUrl)
            .then((path) => { finalKit = { ...finalKit, box_art_path: path }; })
            .catch(() => toast.error("Kit saved, but box art download failed. You can add it manually."))
        : boxArtPath
          ? api.saveBoxArt(kit.id, boxArtPath)
              .then((path) => { finalKit = { ...finalKit, box_art_path: path }; })
              .catch(() => {/* non-fatal */})
          : Promise.resolve();

      const manualPromise = (downloadManualOnSave && pendingManual)
        ? api.downloadScalematesManual(
            kit.id,
            pendingManual.pdf_url,
            "Instruction Manual",
            pendingManual.source_kit_name,
            pendingManual.source_kit_year,
          ).catch(() => toast.error("Kit saved, but manual download failed. You can retry from Edit."))
        : Promise.resolve();

      await Promise.allSettled([boxArtPromise, manualPromise]);

      addKit(finalKit);
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

          {/* Scalemates URL + Import */}
          <div className="flex flex-col gap-1">
            <Label className="text-[11px] font-medium">Scalemates URL</Label>
            <div className="flex gap-1.5">
              <Input
                value={scalematesUrl}
                onChange={(e) => setScalematesUrl(e.target.value)}
                placeholder="https://www.scalemates.com/kits/..."
                className="h-8 flex-1 text-xs"
              />
              {isScalematesUrl && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleImport}
                  disabled={isImporting}
                  className="h-8 gap-1 text-[10px]"
                >
                  {isImporting ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Globe className="h-3 w-3" />
                  )}
                  Import
                </Button>
              )}
            </div>
          </div>

          {/* Manual download indicator */}
          {downloadManualOnSave && pendingManual && (
            <div className="flex items-center gap-2 rounded-md border border-border bg-sidebar px-2 py-1.5">
              <span className="text-[10px] text-text-secondary">
                {pendingManual.is_exact_match
                  ? "Manual will be downloaded on save"
                  : `Manual from ${pendingManual.source_kit_name ?? "related kit"} will be downloaded on save`}
              </span>
              <button
                type="button"
                onClick={() => { setDownloadManualOnSave(false); setPendingManual(null); }}
                className="text-[10px] text-text-tertiary hover:text-text-secondary"
              >
                Cancel
              </button>
            </div>
          )}

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
              {/* Show custom scale pill if not in common list */}
              {scale && !COMMON_SCALES.includes(scale) && (
                <span className="rounded-[10px] bg-accent px-2.5 py-[3px] text-[10px] font-semibold text-white">
                  {scale}
                </span>
              )}
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
              {boxArtPath
                ? "Image selected"
                : pendingBoxArtUrl
                  ? "Scalemates image selected"
                  : "Choose image..."}
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

      {/* Scalemates diff dialog */}
      {importResult && (
        <ScalematesDiffDialog
          open={showDiffDialog}
          onOpenChange={setShowDiffDialog}
          importResult={importResult}
          currentValues={{
            name,
            manufacturer,
            scale,
            kitNumber,
            category,
            boxArtPath: boxArtPath || null,
          }}
          onApply={handleDiffApply}
        />
      )}

      {/* Related boxing confirmation */}
      <AlertDialog open={showRelatedConfirm} onOpenChange={setShowRelatedConfirm}>
        <AlertDialogContent className="max-w-[360px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm">Download Related Manual?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              This manual is from {pendingManual?.source_kit_name ?? "a related kit"}
              {pendingManual?.source_kit_year ? ` (${pendingManual.source_kit_year})` : ""}.
              It may have minor differences from your kit.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setDownloadManualOnSave(true);
                setShowRelatedConfirm(false);
              }}
              className="bg-accent text-xs text-white hover:bg-accent-hover"
            >
              Download on Save
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
