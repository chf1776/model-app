import { useState, useEffect } from "react";
import { toast } from "sonner";
import { open as openFileDialog } from "@tauri-apps/plugin-dialog";
import { openPath } from "@tauri-apps/plugin-opener";
import { FileText, ImageIcon, Trash2, Paperclip, Globe, RefreshCw, Loader2, Download } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppStore } from "@/store";
import * as api from "@/api";
import { cn } from "@/lib/utils";
import {
  COMMON_SCALES,
  KIT_CATEGORIES,
  SCALEMATES_KIT_URL_PATTERN,
  STATUS_LABELS,
  formatProvenanceLabel,
  type Kit,
  type KitFile,
  type KitCategory,
  type KitStatus,
  type ScalematesKitData,
} from "@/shared/types";
import { ScalematesDiffDialog } from "./ScalematesDiffDialog";

interface EditKitDialogProps {
  kit: Kit | null;
  onClose: () => void;
}

export function EditKitDialog({ kit, onClose }: EditKitDialogProps) {
  const updateKitStore = useAppStore((s) => s.updateKit);
  const removeKit = useAppStore((s) => s.removeKit);

  const [name, setName] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [scale, setScale] = useState("");
  const [kitNumber, setKitNumber] = useState("");
  const [category, setCategory] = useState<KitCategory | "">("");
  const [status, setStatus] = useState<KitStatus>("shelf");
  const [notes, setNotes] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [retailerUrl, setRetailerUrl] = useState("");
  const [scalematesUrl, setScalematesUrl] = useState("");
  const [scalematesId, setScalematesId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [kitFiles, setKitFiles] = useState<KitFile[]>([]);

  // Scalemates import state
  const [importResult, setImportResult] = useState<ScalematesKitData | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [showDiffDialog, setShowDiffDialog] = useState(false);
  const [downloadingManual, setDownloadingManual] = useState(false);
  const [showRelatedConfirm, setShowRelatedConfirm] = useState(false);

  useEffect(() => {
    if (kit) {
      setName(kit.name);
      setManufacturer(kit.manufacturer ?? "");
      setScale(kit.scale ?? "");
      setKitNumber(kit.kit_number ?? "");
      setCategory((kit.category as KitCategory) ?? "");
      setStatus(kit.status);
      setNotes(kit.notes ?? "");
      setPrice(kit.price != null ? String(kit.price) : "");
      setCurrency(kit.currency ?? "USD");
      setRetailerUrl(kit.retailer_url ?? "");
      setScalematesUrl(kit.scalemates_url ?? "");
      setScalematesId(kit.scalemates_id ?? null);
      // Reset import state
      setImportResult(null);
      setDownloadingManual(false);
      setShowRelatedConfirm(false);
      // Load attached files
      api.listKitFiles(kit.id).then(setKitFiles).catch(() => setKitFiles([]));
    } else {
      setKitFiles([]);
    }
  }, [kit]);

  const isScalematesUrl = scalematesUrl.includes(SCALEMATES_KIT_URL_PATTERN);
  const hasScalematesId = !!scalematesId;

  const handleImport = async () => {
    if (!isScalematesUrl) return;
    setImportResult(null);
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
    if (updates.boxArtUrl && kit) {
      // Download immediately since kit already exists
      api.downloadScalematesBoxArt(kit.id, updates.boxArtUrl)
        .then((path) => {
          updateKitStore({ ...kit, box_art_path: path });
          toast.success("Box art downloaded");
        })
        .catch(() => toast.error("Box art download failed. You can add it manually."));
    }
  };

  const handleDownloadManual = async () => {
    if (!kit || !importResult?.manual) return;
    const manual = importResult.manual;

    if (!manual.is_exact_match && !showRelatedConfirm) {
      setShowRelatedConfirm(true);
      return;
    }

    setDownloadingManual(true);
    setShowRelatedConfirm(false);
    try {
      const newFile = await api.downloadScalematesManual(
        kit.id,
        manual.pdf_url,
        "Instruction Manual",
        manual.source_kit_name,
        manual.source_kit_year,
      );
      toast.success("Instruction manual downloaded");
      setKitFiles((prev) => [...prev, newFile]);
    } catch (err) {
      toast.error(`Manual download failed: ${err}`);
    } finally {
      setDownloadingManual(false);
    }
  };

  const handleSave = async () => {
    if (!kit || !name.trim()) return;
    setSubmitting(true);
    try {
      const updated = await api.updateKit({
        id: kit.id,
        name: name.trim(),
        manufacturer: manufacturer.trim() || null,
        scale: scale || null,
        kit_number: kitNumber.trim() || null,
        category: (category as KitCategory) || null,
        status: status,
        scalemates_url: scalematesUrl.trim() || null,
        scalemates_id: scalematesId,
        price: price ? parseFloat(price) : null,
        currency: currency.trim() || null,
        retailer_url: retailerUrl.trim() || null,
        notes: notes.trim() || null,
      });
      updateKitStore(updated);
      toast.success(`"${updated.name}" updated`);
      onClose();
    } catch (err) {
      toast.error(`Failed to update kit: ${err}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAttachFile = async () => {
    if (!kit) return;
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
  };

  const handleDeleteFile = async (fileId: string) => {
    try {
      await api.deleteKitFile(fileId);
      setKitFiles((prev) => prev.filter((f) => f.id !== fileId));
    } catch (err) {
      toast.error(`Failed to remove file: ${err}`);
    }
  };

  const handleDelete = async () => {
    if (!kit) return;
    try {
      await api.deleteKit(kit.id);
      removeKit(kit.id);
      toast.success(`"${kit.name}" deleted`);
      onClose();
    } catch (err) {
      toast.error(`Failed to delete kit: ${err}`);
    }
  };

  return (
    <Dialog open={kit !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[85vh] max-w-[480px] flex-col border-border bg-card p-4 shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-sm font-bold">Edit Kit</DialogTitle>
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

          {/* Status */}
          <div className="flex flex-col gap-1">
            <Label className="text-[11px] font-medium">Status</Label>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as KitStatus)}
            >
              <SelectTrigger className="h-8 w-[160px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(
                  Object.entries(STATUS_LABELS) as [KitStatus, string][]
                ).map(([value, label]) => (
                  <SelectItem key={value} value={value} className="text-xs">
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                  ) : hasScalematesId ? (
                    <RefreshCw className="h-3 w-3" />
                  ) : (
                    <Globe className="h-3 w-3" />
                  )}
                  {hasScalematesId ? "Refresh" : "Import"}
                </Button>
              )}
            </div>
          </div>

          {/* Manual download section (after import) */}
          {importResult?.manual && (
            <div className="rounded-md border border-border bg-sidebar p-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-text-primary">
                  {importResult.manual.is_exact_match
                    ? "Instruction manual available"
                    : `Manual from ${importResult.manual.source_kit_name ?? "related kit"}${importResult.manual.source_kit_year ? ` (${importResult.manual.source_kit_year})` : ""}`}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadManual}
                  disabled={downloadingManual}
                  className="h-6 gap-1 text-[10px]"
                >
                  {downloadingManual ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Download className="h-3 w-3" />
                  )}
                  Download
                </Button>
              </div>
              {!importResult.manual.is_exact_match && (
                <p className="mt-1 text-[10px] text-text-tertiary">
                  This manual may have minor differences from your kit.
                </p>
              )}
            </div>
          )}

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

          {/* Files */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] font-medium">Files</Label>
            {kitFiles.length > 0 && (
              <div className="flex flex-col gap-1 rounded-md border border-border">
                {kitFiles.map((f) => {
                  const filename = f.file_path.split("/").pop() ?? "file";
                  return (
                    <div
                      key={f.id}
                      className="flex items-center gap-2 border-b border-border px-2 py-1.5 last:border-0"
                    >
                      {f.file_type === "pdf" ? (
                        <FileText className="h-3.5 w-3.5 shrink-0 text-text-tertiary" />
                      ) : (
                        <ImageIcon className="h-3.5 w-3.5 shrink-0 text-text-tertiary" />
                      )}
                      <div className="min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => {
                            openPath(f.file_path).catch((err) => {
                              console.error("openPath failed:", f.file_path, err);
                              toast.error(`Failed to open file: ${err}`);
                            });
                          }}
                          className="block truncate text-left text-[11px] text-text-secondary hover:text-accent"
                        >
                          {f.label || filename}
                        </button>
                        {formatProvenanceLabel(f.source_kit_name, f.source_kit_year) && (
                          <span className="text-[9px] text-text-tertiary">
                            {formatProvenanceLabel(f.source_kit_name, f.source_kit_year)}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteFile(f.id)}
                        className="shrink-0 rounded p-0.5 text-text-tertiary hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-fit gap-1.5 text-[11px]"
              onClick={handleAttachFile}
            >
              <Paperclip className="h-3 w-3" />
              Attach File
            </Button>
          </div>
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
                Delete Kit
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-[360px]">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-sm">
                  Delete "{kit?.name}"?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-xs">
                  This will permanently remove this kit from your collection.
                  This action cannot be undone.
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
                  Delete Kit
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
            boxArtPath: kit?.box_art_path ?? null,
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
              This manual is from {importResult?.manual?.source_kit_name ?? "a related kit"}
              {importResult?.manual?.source_kit_year ? ` (${importResult.manual.source_kit_year})` : ""}.
              It may have minor differences from your kit.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDownloadManual}
              className="bg-accent text-xs text-white hover:bg-accent-hover"
            >
              Download Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
