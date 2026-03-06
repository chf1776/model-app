import { useState } from "react";
import { Camera, MessageSquare, ArrowRight } from "lucide-react";
import { open } from "@tauri-apps/plugin-dialog";
import { toast } from "sonner";
import { useAppStore } from "@/store";
import * as api from "@/api";
import { IMAGE_FILE_FILTER } from "@/shared/types";

export function MilestoneDialog() {
  const milestone = useAppStore((s) => s.pendingMilestone);
  const dismissMilestone = useAppStore((s) => s.dismissMilestone);
  const activeProjectId = useAppStore((s) => s.activeProjectId);

  const [showNote, setShowNote] = useState(false);
  const [noteText, setNoteText] = useState("");

  if (!milestone) return null;

  const handleCapturePhoto = async () => {
    const path = await open({
      multiple: false,
      filters: [IMAGE_FILE_FILTER],
    });
    if (path) {
      try {
        await api.addMilestonePhoto(milestone.trackId, path);
        toast.success("Milestone photo saved");
      } catch (e) {
        toast.error(`Failed to save photo: ${e}`);
      }
    }
    dismissMilestone();
  };

  const handleAddNote = async () => {
    if (noteText.trim() && activeProjectId) {
      try {
        await api.addBuildLogEntry({
          projectId: activeProjectId,
          entryType: "note",
          body: noteText.trim(),
          trackId: milestone.trackId,
        });
      } catch (e) {
        toast.error(`Failed to save note: ${e}`);
      }
    }
    dismissMilestone();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-[320px] rounded-lg border border-border bg-card p-5 shadow-xl">
        <div className="mb-3 flex items-center gap-2">
          <span
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: milestone.trackColor }}
          />
          <h2 className="text-sm font-bold text-text-primary">Track Complete!</h2>
        </div>
        <p className="mb-4 text-xs text-text-secondary">
          You finished every step in <span className="font-semibold">{milestone.trackName}</span>.
        </p>

        {showNote ? (
          <div className="mb-3 space-y-2">
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Add a note about this milestone..."
              className="h-20 w-full resize-none rounded-md border border-border bg-white px-2.5 py-2 text-xs text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddNote}
                className="flex-1 rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-hover"
              >
                Save Note
              </button>
              <button
                onClick={() => setShowNote(false)}
                className="rounded-md border border-border px-3 py-1.5 text-xs text-text-secondary hover:bg-muted/50"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="mb-3 flex flex-col gap-2">
            <button
              onClick={handleCapturePhoto}
              className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs font-medium text-text-primary hover:bg-muted/50"
            >
              <Camera className="h-3.5 w-3.5 text-accent" />
              Capture Photo
            </button>
            <button
              onClick={() => setShowNote(true)}
              className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs font-medium text-text-primary hover:bg-muted/50"
            >
              <MessageSquare className="h-3.5 w-3.5 text-accent" />
              Add Note
            </button>
          </div>
        )}

        <button
          onClick={dismissMilestone}
          className="flex w-full items-center justify-center gap-1.5 rounded-md bg-accent px-3 py-2 text-xs font-semibold text-white hover:bg-accent-hover"
        >
          Continue
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
