import { useState, useEffect, useRef } from "react";
import { Camera, ArrowRight, X } from "lucide-react";
import { open } from "@tauri-apps/plugin-dialog";
import { convertFileSrc } from "@tauri-apps/api/core";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { toast } from "sonner";
import { useAppStore } from "@/store";
import * as api from "@/api";
import { IMAGE_FILE_FILTER } from "@/shared/types";

const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "webp"];

export function MilestoneDialog() {
  const milestone = useAppStore((s) => s.pendingMilestone);
  const dismissMilestone = useAppStore((s) => s.dismissMilestone);
  const activeProjectId = useAppStore((s) => s.activeProjectId);

  const [noteText, setNoteText] = useState("");
  const [photoPath, setPhotoPath] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const dropZoneRef = useRef<HTMLButtonElement>(null);

  // Listen for Tauri file drag-drop events
  useEffect(() => {
    if (!milestone) return;
    const unlisten = getCurrentWebview().onDragDropEvent((event) => {
      if (event.payload.type === "enter" || event.payload.type === "over") {
        setDragOver(true);
      } else if (event.payload.type === "drop") {
        setDragOver(false);
        const paths = event.payload.paths;
        const imagePath = paths.find((p) => {
          const ext = p.split(".").pop()?.toLowerCase() ?? "";
          return IMAGE_EXTENSIONS.includes(ext);
        });
        if (imagePath) {
          setPhotoPath(imagePath);
        }
      } else if (event.payload.type === "leave") {
        setDragOver(false);
      }
    });
    return () => { unlisten.then((fn) => fn()); };
  }, [milestone]);

  if (!milestone) return null;

  const handlePickPhoto = async () => {
    const path = await open({
      multiple: false,
      filters: [IMAGE_FILE_FILTER],
    });
    if (path) {
      setPhotoPath(path);
    }
  };

  const handleContinue = async () => {
    setSaving(true);
    try {
      // Save photo if one was picked
      if (photoPath) {
        try {
          await api.addMilestonePhoto(milestone.trackId, photoPath);
        } catch (e) {
          toast.error(`Failed to save photo: ${e}`);
        }
      }
      // Save note if one was written
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
    } finally {
      setSaving(false);
      setNoteText("");
      setPhotoPath(null);
      dismissMilestone();
    }
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

        {/* Photo area */}
        {photoPath ? (
          <div className="relative mb-3">
            <img
              src={convertFileSrc(photoPath)}
              alt="Milestone"
              className="w-full rounded-md border border-border object-cover"
              style={{ maxHeight: 160 }}
            />
            <button
              onClick={() => setPhotoPath(null)}
              className="absolute right-1 top-1 rounded-full bg-black/50 p-0.5 text-white hover:bg-black/70"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <button
            ref={dropZoneRef}
            onClick={handlePickPhoto}
            className={`mb-3 flex w-full items-center justify-center gap-2 rounded-md border border-dashed px-3 py-4 text-xs transition-colors ${
              dragOver
                ? "border-accent bg-accent/5 text-accent"
                : "border-border text-text-tertiary hover:border-accent hover:text-accent"
            }`}
          >
            <Camera className="h-4 w-4" />
            {dragOver ? "Drop image here" : "Click or drag a photo"}
          </button>
        )}

        {/* Note area */}
        <textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="Add a note about this milestone..."
          className="mb-3 h-16 w-full resize-none rounded-md border border-border bg-white px-2.5 py-2 text-xs text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none"
        />

        <button
          onClick={handleContinue}
          disabled={saving}
          className="flex w-full items-center justify-center gap-1.5 rounded-md bg-accent px-3 py-2 text-xs font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
        >
          Continue
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
