import { useState, useEffect } from "react";
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
import { TRACK_COLORS } from "@/shared/types";
import type { Track } from "@/shared/types";

// ── Color Picker ────────────────────────────────────────────────────────────

function ColorSwatches({
  value,
  onChange,
}: {
  value: string;
  onChange: (color: string) => void;
}) {
  return (
    <div className="flex gap-1.5">
      {TRACK_COLORS.map((c) => (
        <button
          key={c.value}
          type="button"
          onClick={() => onChange(c.value)}
          className={`h-6 w-6 rounded-full border-2 transition-transform hover:scale-110 ${
            value === c.value ? "border-text-primary" : "border-transparent"
          }`}
          style={{ backgroundColor: c.value }}
          title={c.label}
        />
      ))}
    </div>
  );
}

// ── Add Track Dialog ────────────────────────────────────────────────────────

interface AddTrackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trackCount: number;
  onAdd: (name: string, color?: string) => void;
}

export function AddTrackDialog({
  open,
  onOpenChange,
  trackCount,
  onAdd,
}: AddTrackDialogProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState<string>(TRACK_COLORS[0].value);

  useEffect(() => {
    if (open) {
      setName(`Track ${trackCount + 1}`);
      setColor(TRACK_COLORS[trackCount % TRACK_COLORS.length].value);
    }
  }, [open, trackCount]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd(name.trim(), color);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">Add Track</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs">Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-8 text-xs"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Color</Label>
            <ColorSwatches value={color} onChange={setColor} />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!name.trim()}
              className="bg-accent text-xs text-white hover:bg-accent-hover"
            >
              Add Track
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Rename Track Dialog ─────────────────────────────────────────────────────

interface RenameTrackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  track: Track | null;
  onRename: (id: string, name: string) => void;
}

export function RenameTrackDialog({
  open,
  onOpenChange,
  track,
  onRename,
}: RenameTrackDialogProps) {
  const [name, setName] = useState("");

  useEffect(() => {
    if (open && track) {
      setName(track.name);
    }
  }, [open, track]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !track) return;
    onRename(track.id, name.trim());
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">Rename Track</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs">Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-8 text-xs"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!name.trim()}
              className="bg-accent text-xs text-white hover:bg-accent-hover"
            >
              Rename
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Change Color Dialog ─────────────────────────────────────────────────────

interface ChangeColorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  track: Track | null;
  onChangeColor: (id: string, color: string) => void;
}

export function ChangeColorDialog({
  open,
  onOpenChange,
  track,
  onChangeColor,
}: ChangeColorDialogProps) {
  const [color, setColor] = useState<string>(TRACK_COLORS[0].value);

  useEffect(() => {
    if (open && track) {
      setColor(track.color);
    }
  }, [open, track]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!track) return;
    onChangeColor(track.id, color);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">Change Track Color</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs">Color</Label>
            <ColorSwatches value={color} onChange={setColor} />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="bg-accent text-xs text-white hover:bg-accent-hover"
            >
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Delete Track Dialog ─────────────────────────────────────────────────────

interface DeleteTrackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  track: Track | null;
  onDelete: (id: string) => void;
}

export function DeleteTrackDialog({
  open,
  onOpenChange,
  track,
  onDelete,
}: DeleteTrackDialogProps) {
  if (!track) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-sm">Delete Track</AlertDialogTitle>
          <AlertDialogDescription className="text-xs">
            Are you sure you want to delete "{track.name}"?
            {track.step_count > 0 && (
              <>
                {" "}
                This will also delete {track.step_count}{" "}
                {track.step_count === 1 ? "step" : "steps"}.
              </>
            )}{" "}
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="text-xs">Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              onDelete(track.id);
              onOpenChange(false);
            }}
            className="bg-red-600 text-xs text-white hover:bg-red-700"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
