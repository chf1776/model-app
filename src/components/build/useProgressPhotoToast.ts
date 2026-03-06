import { useEffect } from "react";
import { toast } from "sonner";
import { open } from "@tauri-apps/plugin-dialog";
import { useAppStore } from "@/store";
import * as api from "@/api";
import { IMAGE_FILE_FILTER } from "@/shared/types";

export function useProgressPhotoToast() {
  const pendingStepId = useAppStore((s) => s.pendingProgressPhotoStepId);
  const clearPending = useAppStore((s) => s.clearPendingProgressPhoto);

  useEffect(() => {
    if (!pendingStepId) return;
    clearPending();

    const stepId = pendingStepId;
    toast("Capture your progress?", {
      duration: 4000,
      action: {
        label: "Add Photo",
        onClick: async () => {
          const path = await open({
            multiple: false,
            filters: [IMAGE_FILE_FILTER],
          });
          if (path) {
            try {
              await api.addProgressPhoto(stepId, path);
              toast.success("Progress photo saved");
            } catch (e) {
              toast.error(`Failed to save photo: ${e}`);
            }
          }
        },
      },
    });
  }, [pendingStepId, clearPending]);
}
