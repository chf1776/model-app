import { useMemo, useState } from "react";
import { Camera } from "lucide-react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { useAppStore } from "@/store";
import { useNavigateToStep } from "@/hooks/useNavigateToStep";
import type { ProgressPhoto, MilestonePhoto } from "@/shared/types";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { OverviewCard } from "./OverviewCard";

type PhotoEntry =
  | (ProgressPhoto & { _kind: "progress" })
  | (MilestonePhoto & { _kind: "milestone" });

const MAX_THUMBNAILS = 5;

export function GalleryCard() {
  const progressPhotos = useAppStore((s) => s.overviewProgressPhotos);
  const milestonePhotos = useAppStore((s) => s.overviewMilestonePhotos);
  const navigateToStep = useNavigateToStep();
  const [lightboxPhoto, setLightboxPhoto] = useState<PhotoEntry | null>(null);

  const allPhotos = useMemo<PhotoEntry[]>(
    () =>
      [
        ...progressPhotos.map((p) => ({ ...p, _kind: "progress" as const })),
        ...milestonePhotos.map((p) => ({ ...p, _kind: "milestone" as const })),
      ].sort((a, b) => b.created_at - a.created_at),
    [progressPhotos, milestonePhotos],
  );

  const totalCount = allPhotos.length;
  const visible = allPhotos.slice(0, MAX_THUMBNAILS);
  const overflow = totalCount - MAX_THUMBNAILS;

  return (
    <OverviewCard
      title="Gallery"
      icon={Camera}
      subtitle={totalCount > 0 ? `${totalCount} photo${totalCount === 1 ? "" : "s"}` : undefined}
    >
      {totalCount === 0 ? (
        <div className="flex h-full items-center justify-center py-3">
          <div className="flex flex-col items-center text-text-tertiary">
            <Camera className="mb-1 h-5 w-5 opacity-40" />
            <span className="text-[9px]">No photos yet</span>
            <span className="mt-0.5 text-[8px] opacity-60">
              Add progress photos while building
            </span>
          </div>
        </div>
      ) : (
        <div className="flex gap-1">
          {visible.map((photo) => (
            <img
              key={photo.id}
              src={convertFileSrc(photo.file_path)}
              alt=""
              className="h-[50px] w-[50px] shrink-0 cursor-pointer rounded object-cover transition-opacity hover:opacity-80"
              onClick={() => setLightboxPhoto(photo)}
            />
          ))}
          {overflow > 0 && (
            <div className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded bg-border text-[10px] font-medium text-text-secondary">
              +{overflow}
            </div>
          )}
        </div>
      )}

      <Dialog
        open={!!lightboxPhoto}
        onOpenChange={(open) => !open && setLightboxPhoto(null)}
      >
        <DialogContent
          className="max-w-[80vw] p-2 sm:max-w-[80vw]"
          aria-describedby={undefined}
        >
          <DialogTitle className="sr-only">Photo preview</DialogTitle>
          {lightboxPhoto && (
            <div className="flex flex-col items-center gap-2">
              <img
                src={convertFileSrc(lightboxPhoto.file_path)}
                alt=""
                className="max-h-[70vh] rounded object-contain"
              />
              <div className="flex items-center gap-3 text-xs text-text-secondary">
                <span className="capitalize">{lightboxPhoto._kind} photo</span>
                <span className="text-text-tertiary">
                  {new Date(lightboxPhoto.created_at * 1000).toLocaleDateString()}
                </span>
                {lightboxPhoto._kind === "progress" && lightboxPhoto.step_id && (
                  <button
                    onClick={() => {
                      navigateToStep(lightboxPhoto.step_id);
                      setLightboxPhoto(null);
                    }}
                    className="text-accent hover:underline"
                  >
                    Go to step
                  </button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </OverviewCard>
  );
}
