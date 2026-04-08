import { useEffect, useState } from "react";
import { Camera } from "lucide-react";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { open as openFileDialog } from "@tauri-apps/plugin-dialog";
import { toast } from "sonner";
import * as api from "@/api";
import { IMAGE_FILE_FILTER } from "@/shared/types";

const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "webp"];

export interface DragDropPhotoZoneProps {
  /** Step id whose progress photo is being added. */
  stepId: string;
}

/**
 * Dashed-border drop zone for adding progress photos to a step. Listens to
 * the Tauri webview drag-drop event so dragging an image file from Finder
 * adds it directly, and clicking opens the native file picker.
 */
export function DragDropPhotoZone({ stepId }: DragDropPhotoZoneProps) {
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    const unlisten = getCurrentWebview().onDragDropEvent((event) => {
      if (event.payload.type === "enter" || event.payload.type === "over") {
        setDragOver(true);
      } else if (event.payload.type === "drop") {
        setDragOver(false);
        const imagePath = event.payload.paths.find((p) => {
          const ext = p.split(".").pop()?.toLowerCase() ?? "";
          return IMAGE_EXTENSIONS.includes(ext);
        });
        if (imagePath) {
          api.addProgressPhoto(stepId, imagePath)
            .then(() => toast.success("Progress photo saved"))
            .catch((e) => toast.error(`Failed to save photo: ${e}`));
        }
      } else if (event.payload.type === "leave") {
        setDragOver(false);
      }
    });
    return () => { unlisten.then((fn) => fn()); };
  }, [stepId]);

  const handleClick = async () => {
    const path = await openFileDialog({
      multiple: false,
      filters: [IMAGE_FILE_FILTER],
    });
    if (typeof path === "string") {
      try {
        await api.addProgressPhoto(stepId, path);
        toast.success("Progress photo saved");
      } catch (e) {
        toast.error(`Failed to save photo: ${e}`);
      }
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`flex w-full items-center justify-center gap-2 rounded-md border border-dashed px-3 py-2.5 text-[11px] transition-colors ${
        dragOver
          ? "border-accent bg-accent/5 text-accent"
          : "border-border text-text-tertiary hover:border-accent hover:text-accent"
      }`}
    >
      <Camera className="h-3.5 w-3.5" />
      {dragOver ? "Drop image here" : "Click or drag a progress photo"}
    </button>
  );
}
