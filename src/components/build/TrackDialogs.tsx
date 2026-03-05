import { useState, useEffect, useMemo } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TRACK_COLORS } from "@/shared/types";
import type { Track, Step } from "@/shared/types";

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

// ── Join Point Dialog ────────────────────────────────────────────────────────

interface JoinPointDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  track: Track | null;
  tracks: Track[];
  steps: Step[];
  onSetJoinPoint: (
    id: string,
    joinPointStepId: string | null,
    joinPointNotes: string | null,
  ) => void;
}

export function JoinPointDialog({
  open,
  onOpenChange,
  track,
  tracks,
  steps,
  onSetJoinPoint,
}: JoinPointDialogProps) {
  const [targetTrackId, setTargetTrackId] = useState<string>("");
  const [targetStepId, setTargetStepId] = useState<string>("");
  const [notes, setNotes] = useState("");

  // Other tracks (exclude current)
  const otherTracks = useMemo(
    () => tracks.filter((t) => t.id !== track?.id),
    [tracks, track],
  );

  // Steps for selected target track, sorted by display_order
  const targetSteps = useMemo(() => {
    if (!targetTrackId) return [];
    return steps
      .filter((s) => s.track_id === targetTrackId)
      .sort((a, b) => a.display_order - b.display_order);
  }, [steps, targetTrackId]);

  // Initialize state from existing join point
  useEffect(() => {
    if (!open || !track) return;
    if (track.join_point_step_id) {
      const existingStep = steps.find((s) => s.id === track.join_point_step_id);
      if (existingStep) {
        setTargetTrackId(existingStep.track_id);
        setTargetStepId(existingStep.id);
      } else {
        setTargetTrackId("");
        setTargetStepId("");
      }
    } else {
      setTargetTrackId("");
      setTargetStepId("");
    }
    setNotes(track.join_point_notes ?? "");
  }, [open, track, steps]);

  // Reset step when target track changes
  const handleTrackChange = (trackId: string) => {
    setTargetTrackId(trackId);
    setTargetStepId("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!track || !targetStepId) return;
    onSetJoinPoint(track.id, targetStepId, notes.trim() || null);
    onOpenChange(false);
  };

  const handleClear = () => {
    if (!track) return;
    onSetJoinPoint(track.id, null, null);
    onOpenChange(false);
  };

  // Build step label: "Step N: title" for root, "Step N.M: title" for sub-steps
  const getStepLabel = (step: Step) => {
    if (step.parent_step_id) {
      const parent = steps.find((s) => s.id === step.parent_step_id);
      if (parent) {
        const siblings = steps
          .filter((s) => s.parent_step_id === parent.id && s.track_id === step.track_id)
          .sort((a, b) => a.display_order - b.display_order);
        const childIdx = siblings.findIndex((s) => s.id === step.id);
        return `Step ${parent.display_order + 1}.${childIdx + 1}: ${step.title}`;
      }
    }
    return `Step ${step.display_order + 1}: ${step.title}`;
  };

  const hasExisting = !!track?.join_point_step_id;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">
            {hasExisting ? "Edit" : "Set"} Join Point
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs">Target Track</Label>
            <Select value={targetTrackId} onValueChange={handleTrackChange}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Select a track" />
              </SelectTrigger>
              <SelectContent>
                {otherTracks.map((t) => (
                  <SelectItem key={t.id} value={t.id} className="text-xs">
                    <span className="flex items-center gap-2">
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ backgroundColor: t.color }}
                      />
                      {t.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Target Step</Label>
            <Select
              value={targetStepId}
              onValueChange={setTargetStepId}
              disabled={!targetTrackId || targetSteps.length === 0}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue
                  placeholder={
                    !targetTrackId
                      ? "Select a track first"
                      : targetSteps.length === 0
                        ? "No steps"
                        : "Select a step"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {targetSteps.map((s) => (
                  <SelectItem key={s.id} value={s.id} className="text-xs">
                    {getStepLabel(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Notes (optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[60px] text-xs"
              placeholder="e.g. Attach after painting"
            />
          </div>

          <DialogFooter>
            {hasExisting && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="mr-auto text-xs text-red-600 hover:text-red-700"
              >
                Clear
              </Button>
            )}
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
              disabled={!targetStepId}
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
