import { useState, useMemo, useRef, useEffect } from "react";
import { Plus, Pencil, Trash2, Crop } from "lucide-react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppStore } from "@/store";
import { SPRUE_COLORS } from "@/shared/types";
import type { SprueRef } from "@/shared/types";
import * as api from "@/api";
import { toast } from "sonner";

const THUMB_W = 164;
const THUMB_H = 72;

export function SprueRail() {
  const sprueRefs = useAppStore((s) => s.sprueRefs);
  const activeProjectId = useAppStore((s) => s.activeProjectId);
  const activeSprueRefId = useAppStore((s) => s.activeSprueRefId);
  const setActiveSprueRef = useAppStore((s) => s.setActiveSprueRef);
  const addSprueRefStore = useAppStore((s) => s.addSprueRefStore);
  const updateSprueRefStore = useAppStore((s) => s.updateSprueRefStore);
  const removeSprueRefStore = useAppStore((s) => s.removeSprueRefStore);
  const setCanvasMode = useAppStore((s) => s.setCanvasMode);
  const currentSourcePages = useAppStore((s) => s.currentSourcePages);

  const [createOpen, setCreateOpen] = useState(false);
  const [editRef, setEditRef] = useState<SprueRef | null>(null);
  const [deleteRef, setDeleteRef] = useState<SprueRef | null>(null);
  const [label, setLabel] = useState("");
  const [selectedColor, setSelectedColor] = useState<string>(SPRUE_COLORS[0]);

  const sortedRefs = useMemo(
    () => [...sprueRefs].sort((a, b) => a.display_order - b.display_order),
    [sprueRefs],
  );

  const openCreate = async () => {
    setLabel("");
    if (activeProjectId) {
      try {
        const color = await api.getNextSprueColor(activeProjectId);
        setSelectedColor(color);
      } catch {
        setSelectedColor(SPRUE_COLORS[0]);
      }
    }
    setCreateOpen(true);
  };

  const handleCreate = async () => {
    if (!activeProjectId || !label.trim()) return;
    try {
      const ref = await api.createSprueRef({
        project_id: activeProjectId,
        label: label.trim(),
        color: selectedColor,
      });
      addSprueRefStore(ref);
      setActiveSprueRef(ref.id);
      setCreateOpen(false);
      toast.success(`Sprue "${ref.label}" added`);
    } catch (e) {
      toast.error(`Failed to create sprue: ${e}`);
    }
  };

  const openEdit = (ref: SprueRef, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditRef(ref);
    setLabel(ref.label);
    setSelectedColor(ref.color);
  };

  const handleUpdate = async () => {
    if (!editRef || !label.trim()) return;
    try {
      const updated = await api.updateSprueRef({
        id: editRef.id,
        label: label.trim(),
        color: selectedColor,
      });
      updateSprueRefStore(updated);
      setEditRef(null);
      toast.success("Sprue updated");
    } catch (e) {
      toast.error(`Failed to update sprue: ${e}`);
    }
  };

  const handleDelete = async () => {
    if (!deleteRef) return;
    try {
      await api.deleteSprueRef(deleteRef.id);
      removeSprueRefStore(deleteRef.id);
      if (activeSprueRefId === deleteRef.id) {
        setActiveSprueRef(null);
      }
      toast.success(`Sprue "${deleteRef.label}" deleted`);
    } catch (e) {
      toast.error(`Failed to delete sprue: ${e}`);
    }
    setDeleteRef(null);
  };

  const handleSelect = (ref: SprueRef) => {
    setActiveSprueRef(activeSprueRefId === ref.id ? null : ref.id);
  };

  const handleCropClick = (ref: SprueRef) => {
    setActiveSprueRef(ref.id);
    setCanvasMode("crop");
  };

  const hasPages = currentSourcePages.length > 0;

  return (
    <div className="flex w-[200px] shrink-0 flex-col overflow-hidden border-r border-border bg-sidebar">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="text-xs font-semibold text-text-primary">Sprues</span>
        <button
          onClick={openCreate}
          className="flex h-5 w-5 items-center justify-center rounded text-text-tertiary hover:bg-muted hover:text-text-secondary"
          title="Add sprue"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* List */}
      <ScrollArea className="min-h-0 flex-1">
        {sortedRefs.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
            <p className="mb-1 text-[11px] text-text-tertiary">
              No sprues defined yet.
            </p>
            <p className="mb-3 text-[10px] text-text-tertiary/70">
              Add sprues manually or draw them on instruction pages.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={openCreate}
              className="h-6 gap-1 text-[10px]"
            >
              <Plus className="h-3 w-3" />
              Add Sprue
            </Button>
          </div>
        ) : (
          <div className="py-1">
            {sortedRefs.map((ref) => {
              const isActive = ref.id === activeSprueRefId;
              return (
                <SprueRailItem
                  key={ref.id}
                  sprueRef={ref}
                  isActive={isActive}
                  hasPages={hasPages}
                  onClick={() => handleSelect(ref)}
                  onEditClick={(e) => openEdit(ref, e)}
                  onDeleteClick={(e) => {
                    e.stopPropagation();
                    setDeleteRef(ref);
                  }}
                  onCropClick={() => handleCropClick(ref)}
                />
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Hint at bottom */}
      {sortedRefs.length > 0 && hasPages && (
        <div className="border-t border-border px-3 py-2">
          <p className="text-[10px] text-text-tertiary">
            Press <kbd className="rounded border border-border px-1 py-0.5 text-[9px] font-medium">C</kbd> to draw sprue crops on the page
          </p>
        </div>
      )}

      {/* Create dialog */}
      <SprueFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Add Sprue"
        label={label}
        onLabelChange={setLabel}
        selectedColor={selectedColor}
        onColorChange={setSelectedColor}
        onSubmit={handleCreate}
        submitLabel="Add"
      />

      {/* Edit dialog */}
      <SprueFormDialog
        open={!!editRef}
        onOpenChange={(open) => !open && setEditRef(null)}
        title="Edit Sprue"
        label={label}
        onLabelChange={setLabel}
        selectedColor={selectedColor}
        onColorChange={setSelectedColor}
        onSubmit={handleUpdate}
        submitLabel="Save"
      />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteRef} onOpenChange={(open) => !open && setDeleteRef(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete sprue?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove <span className="font-medium">{deleteRef?.label}</span> and all its part associations from steps.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ── Rail Item ────────────────────────────────────────────────────────────────

interface SprueRailItemProps {
  sprueRef: SprueRef;
  isActive: boolean;
  hasPages: boolean;
  onClick: () => void;
  onEditClick: (e: React.MouseEvent) => void;
  onDeleteClick: (e: React.MouseEvent) => void;
  onCropClick: () => void;
}

function SprueRailItem({
  sprueRef,
  isActive,
  hasPages,
  onClick,
  onEditClick,
  onDeleteClick,
  onCropClick,
}: SprueRailItemProps) {
  const hasCrop =
    sprueRef.crop_x != null &&
    sprueRef.crop_y != null &&
    sprueRef.crop_w != null &&
    sprueRef.crop_h != null;

  return (
    <div
      onClick={onClick}
      className={`group cursor-pointer border-l-2 px-2 py-1.5 transition-colors ${
        isActive
          ? "border-l-accent bg-accent/8"
          : "border-l-transparent hover:bg-muted/50"
      }`}
    >
      {/* Header row: color swatch + label + action buttons */}
      <div className="flex items-center gap-1.5">
        <span
          className="h-3 w-3 shrink-0 rounded-sm"
          style={{ backgroundColor: sprueRef.color }}
        />
        <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-text-primary">
          {sprueRef.label}
        </span>
        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={onEditClick}
            className="rounded p-0.5 text-text-tertiary hover:text-text-secondary"
            title="Edit"
          >
            <Pencil className="h-3 w-3" />
          </button>
          <button
            onClick={onDeleteClick}
            className="rounded p-0.5 text-text-tertiary hover:text-red-500"
            title="Delete"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Crop preview thumbnail or placeholder */}
      <div className="mt-1.5">
        {hasCrop ? (
          <SprueCropThumbnail sprueRef={sprueRef} isActive={isActive} />
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCropClick();
            }}
            disabled={!hasPages}
            className={`flex h-[72px] w-full flex-col items-center justify-center gap-1 rounded border border-dashed border-border bg-black/[0.02] ${
              hasPages
                ? "cursor-pointer hover:border-accent/40 hover:bg-accent/5"
                : "cursor-default opacity-50"
            }`}
          >
            <Crop className="h-3.5 w-3.5 text-text-tertiary" />
            <span className="text-[9px] text-text-tertiary">
              {hasPages ? "Draw crop on page" : "No pages loaded"}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

// ── Sprue Crop Thumbnail ────────────────────────────────────────────────────

function SprueCropThumbnail({ sprueRef, isActive }: { sprueRef: SprueRef; isActive: boolean }) {
  const currentSourcePages = useAppStore((s) => s.currentSourcePages);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [hasImage, setHasImage] = useState(false);

  const pageIndex = sprueRef.source_page_id
    ? currentSourcePages.findIndex((p) => p.id === sprueRef.source_page_id)
    : -1;
  const page = pageIndex >= 0 ? currentSourcePages[pageIndex] : undefined;

  useEffect(() => {
    if (!page || sprueRef.crop_x == null) {
      setLoading(false);
      setHasImage(false);
      return;
    }
    setLoading(true);

    let aborted = false;
    const img = new Image();

    img.onload = () => {
      if (aborted || !canvasRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      setLoading(false);
      setHasImage(true);

      const rotation = page.rotation ?? 0;
      const cropX = sprueRef.crop_x!;
      const cropY = sprueRef.crop_y!;
      const cropW = sprueRef.crop_w!;
      const cropH = sprueRef.crop_h!;

      const rad = (rotation * Math.PI) / 180;
      const cos = Math.abs(Math.cos(rad));
      const sin = Math.abs(Math.sin(rad));
      const effectiveW = cropW * cos + cropH * sin;
      const effectiveH = cropW * sin + cropH * cos;

      const scale = Math.min(THUMB_W / effectiveW, THUMB_H / effectiveH);
      const drawW = Math.round(effectiveW * scale);
      const drawH = Math.round(effectiveH * scale);

      canvas.width = drawW;
      canvas.height = drawH;
      ctx.clearRect(0, 0, drawW, drawH);

      ctx.save();
      ctx.translate(drawW / 2, drawH / 2);
      ctx.rotate(rad);
      ctx.drawImage(
        img,
        cropX,
        cropY,
        cropW,
        cropH,
        (-cropW * scale) / 2,
        (-cropH * scale) / 2,
        cropW * scale,
        cropH * scale,
      );
      ctx.restore();
    };

    img.onerror = () => {
      if (aborted) return;
      setLoading(false);
      setHasImage(false);
    };

    img.src = convertFileSrc(page.file_path);

    return () => {
      aborted = true;
      img.src = "";
    };
  }, [page, sprueRef.crop_x, sprueRef.crop_y, sprueRef.crop_w, sprueRef.crop_h]);

  return (
    <div
      className={`relative flex h-[72px] items-center justify-center overflow-hidden rounded border bg-black/[0.02] ${
        isActive ? "border-accent" : "border-border"
      }`}
    >
      {loading && <Skeleton className="absolute inset-0" />}
      <canvas ref={canvasRef} className={loading ? "invisible" : ""} />
      {hasImage && pageIndex >= 0 && (
        <span className="absolute bottom-0.5 right-0.5 rounded bg-black/40 px-1 py-0.5 text-[8px] text-white">
          p.{pageIndex + 1}
        </span>
      )}
    </div>
  );
}

// ── Shared form dialog ──────────────────────────────────────────────────────

interface SprueFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  label: string;
  onLabelChange: (v: string) => void;
  selectedColor: string;
  onColorChange: (v: string) => void;
  onSubmit: () => void;
  submitLabel: string;
}

function SprueFormDialog({
  open,
  onOpenChange,
  title,
  label,
  onLabelChange,
  selectedColor,
  onColorChange,
  onSubmit,
  submitLabel,
}: SprueFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[320px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label className="text-[11px]">Label</Label>
            <Input
              value={label}
              onChange={(e) => onLabelChange(e.target.value)}
              placeholder="e.g. A, B, C..."
              className="h-8 text-xs"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && label.trim()) onSubmit();
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px]">Color</Label>
            <div className="flex flex-wrap gap-1.5">
              {SPRUE_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => onColorChange(color)}
                  className={`h-6 w-6 rounded-md border-2 transition-shadow ${
                    selectedColor === color
                      ? "border-text-primary shadow-sm"
                      : "border-transparent hover:border-border"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            size="sm"
            onClick={onSubmit}
            disabled={!label.trim()}
            className="bg-accent text-white hover:bg-accent-hover"
          >
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
