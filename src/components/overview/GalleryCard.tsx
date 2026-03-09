import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { Camera, Star, Plus, ArrowUpDown, ExternalLink, Pencil, Trash2, Image as ImageIcon } from "lucide-react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { open as openFileDialog } from "@tauri-apps/plugin-dialog";
import { useAppStore } from "@/store";
import { useNavigateToStep } from "@/hooks/useNavigateToStep";
import type { PhotoSourceType } from "@/shared/types";
import { IMAGE_FILE_FILTER } from "@/shared/types";
import { relativeTime } from "@/shared/format";
import * as api from "@/api";
import { ImageLightbox } from "@/components/shared/ImageLightbox";
import { OverviewCard } from "./OverviewCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type MergedPhoto = {
  id: string;
  file_path: string;
  caption: string | null;
  source_type: PhotoSourceType;
  track_id: string | null;
  step_id: string | null;
  is_starred: boolean;
  created_at: number;
};

type GalleryFilter = "all" | "starred" | "gallery" | "progress" | "milestones";

const FILTER_LABELS: { key: GalleryFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "starred", label: "Starred" },
  { key: "gallery", label: "Gallery" },
  { key: "progress", label: "Progress" },
  { key: "milestones", label: "Milestones" },
];

interface GalleryCardProps {
  expanded: boolean;
  onExpand?: () => void;
  onCollapse: () => void;
}

export function GalleryCard({ expanded, onExpand, onCollapse }: GalleryCardProps) {
  const project = useAppStore((s) => s.project);
  const progressPhotos = useAppStore((s) => s.overviewProgressPhotos);
  const milestonePhotos = useAppStore((s) => s.overviewMilestonePhotos);
  const galleryPhotos = useAppStore((s) => s.overviewGalleryPhotos);
  const steps = useAppStore((s) => s.steps);
  const tracks = useAppStore((s) => s.tracks);
  const activeProjectId = useAppStore((s) => s.activeProjectId);
  const addOverviewGalleryPhoto = useAppStore((s) => s.addOverviewGalleryPhoto);
  const removeOverviewGalleryPhoto = useAppStore((s) => s.removeOverviewGalleryPhoto);
  const updateOverviewGalleryCaption = useAppStore((s) => s.updateOverviewGalleryCaption);
  const toggleOverviewPhotoStar = useAppStore((s) => s.toggleOverviewPhotoStar);
  const updateProject = useAppStore((s) => s.updateProject);
  const navigateToStep = useNavigateToStep();

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [filter, setFilter] = useState<GalleryFilter>("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [editingCaption, setEditingCaption] = useState(false);
  const [captionDraft, setCaptionDraft] = useState("");
  const captionInputRef = useRef<HTMLInputElement>(null);

  // Maps for deriving track/step info
  const stepMap = useMemo(() => {
    const map: Record<string, { title: string; track_id: string }> = {};
    for (const s of steps) map[s.id] = { title: s.title, track_id: s.track_id };
    return map;
  }, [steps]);

  const trackMap = useMemo(() => {
    const colors: Record<string, string> = {};
    const names: Record<string, string> = {};
    for (const t of tracks) {
      colors[t.id] = t.color;
      names[t.id] = t.name;
    }
    return { colors, names };
  }, [tracks]);

  // Merge all photos
  const allPhotos = useMemo<MergedPhoto[]>(() => {
    const merged: MergedPhoto[] = [
      ...progressPhotos.map((p) => {
        const step = stepMap[p.step_id];
        return {
          id: p.id,
          file_path: p.file_path,
          caption: step ? step.title : null,
          source_type: "progress" as const,
          track_id: step?.track_id ?? null,
          step_id: p.step_id,
          is_starred: p.is_starred,
          created_at: p.created_at,
        };
      }),
      ...milestonePhotos.map((p) => ({
        id: p.id,
        file_path: p.file_path,
        caption: trackMap.names[p.track_id] ? `${trackMap.names[p.track_id]} milestone` : "Milestone",
        source_type: "milestone" as const,
        track_id: p.track_id,
        step_id: null,
        is_starred: p.is_starred,
        created_at: p.created_at,
      })),
      ...galleryPhotos.map((p) => ({
        id: p.id,
        file_path: p.file_path,
        caption: p.caption,
        source_type: "gallery" as const,
        track_id: null,
        step_id: null,
        is_starred: p.is_starred,
        created_at: p.created_at,
      })),
    ];
    merged.sort((a, b) =>
      sortOrder === "newest"
        ? b.created_at - a.created_at
        : a.created_at - b.created_at,
    );
    return merged;
  }, [progressPhotos, milestonePhotos, galleryPhotos, stepMap, trackMap, sortOrder]);

  // Filtered photos
  const filteredPhotos = useMemo(() => {
    if (filter === "all") return allPhotos;
    if (filter === "starred") return allPhotos.filter((p) => p.is_starred);
    if (filter === "gallery") return allPhotos.filter((p) => p.source_type === "gallery");
    if (filter === "progress") return allPhotos.filter((p) => p.source_type === "progress");
    return allPhotos.filter((p) => p.source_type === "milestone");
  }, [allPhotos, filter]);

  // Lightbox images from filtered set
  const lightboxImages = useMemo(
    () =>
      filteredPhotos.map((p) => ({
        src: convertFileSrc(p.file_path),
        caption: p.caption ?? undefined,
      })),
    [filteredPhotos],
  );

  const currentPhoto = lightboxIndex !== null ? filteredPhotos[lightboxIndex] : null;

  const handleToggleStar = useCallback(
    async (photo: MergedPhoto) => {
      await api.togglePhotoStar(photo.source_type, photo.id);
      toggleOverviewPhotoStar(photo.source_type, photo.id);
    },
    [toggleOverviewPhotoStar],
  );

  const handleSetCover = useCallback(
    async (photo: MergedPhoto) => {
      if (!project) return;
      await updateProject({ id: project.id, hero_photo_path: photo.file_path });
    },
    [project, updateProject],
  );

  const handleDeleteGalleryPhoto = useCallback(
    async (photo: MergedPhoto) => {
      await api.deleteGalleryPhoto(photo.id);
      removeOverviewGalleryPhoto(photo.id);
      // Advance or close lightbox using functional update to avoid stale closures
      setLightboxIndex((prev) => {
        if (prev === null) return null;
        // filteredPhotos still has the old length at this point;
        // after store update, the list will be 1 shorter
        const newLen = filteredPhotos.length - 1;
        if (newLen <= 0) return null;
        if (prev >= newLen) return prev - 1;
        return prev;
      });
    },
    [removeOverviewGalleryPhoto, filteredPhotos.length],
  );

  const handleSaveCaption = useCallback(
    async (photo: MergedPhoto, newCaption: string) => {
      const caption = newCaption.trim() || null;
      await api.updateGalleryPhotoCaption(photo.id, caption);
      updateOverviewGalleryCaption(photo.id, caption);
      setEditingCaption(false);
    },
    [updateOverviewGalleryCaption],
  );

  const handleAddPhoto = useCallback(async () => {
    if (!activeProjectId) return;
    const selected = await openFileDialog({
      multiple: false,
      filters: [IMAGE_FILE_FILTER],
    });
    if (selected) {
      const photo = await api.addGalleryPhoto(activeProjectId, selected as string, null);
      addOverviewGalleryPhoto(photo);
    }
  }, [activeProjectId, addOverviewGalleryPhoto]);

  // Focus caption input when editing
  useEffect(() => {
    if (editingCaption && captionInputRef.current) {
      captionInputRef.current.focus();
      captionInputRef.current.select();
    }
  }, [editingCaption]);

  // Lightbox actions
  const lightboxActions = currentPhoto ? (
    <div className="mt-1 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => handleToggleStar(currentPhoto)}
        className="flex items-center gap-1 text-sm text-white/80 hover:text-white"
      >
        <Star
          className={cn("h-4 w-4", currentPhoto.is_starred && "fill-yellow-400 text-yellow-400")}
        />
        {currentPhoto.is_starred ? "Unstar" : "Star"}
      </button>
      <button
        onClick={() => handleSetCover(currentPhoto)}
        className="flex items-center gap-1 text-sm text-white/80 hover:text-white"
      >
        <ImageIcon className="h-4 w-4" />
        Set as Cover
      </button>
      {currentPhoto.source_type === "progress" && currentPhoto.step_id && (
        <button
          onClick={() => {
            navigateToStep(currentPhoto.step_id!);
            setLightboxIndex(null);
          }}
          className="flex items-center gap-1 text-sm text-white/80 hover:text-white"
        >
          <ExternalLink className="h-4 w-4" />
          Go to step
        </button>
      )}
      {currentPhoto.source_type === "gallery" && (
        <>
          {editingCaption ? (
            <input
              ref={captionInputRef}
              type="text"
              value={captionDraft}
              onChange={(e) => setCaptionDraft(e.target.value)}
              onBlur={() => handleSaveCaption(currentPhoto, captionDraft)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSaveCaption(currentPhoto, captionDraft);
                }
                if (e.key === "Escape") {
                  e.preventDefault();
                  setEditingCaption(false);
                }
              }}
              className="h-6 w-36 rounded border border-white/30 bg-white/10 px-2 text-xs text-white placeholder:text-white/40"
              placeholder="Caption..."
            />
          ) : (
            <button
              onClick={() => {
                setCaptionDraft(currentPhoto.caption ?? "");
                setEditingCaption(true);
              }}
              className="flex items-center gap-1 text-sm text-white/80 hover:text-white"
            >
              <Pencil className="h-4 w-4" />
              Edit Caption
            </button>
          )}
          <button
            onClick={() => handleDeleteGalleryPhoto(currentPhoto)}
            className="flex items-center gap-1 text-sm text-red-400 hover:text-red-300"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </>
      )}
    </div>
  ) : null;

  // Reset editing state when lightbox photo changes
  useEffect(() => {
    setEditingCaption(false);
  }, [lightboxIndex]);

  // Reset filter when collapsing so compact lightbox indices stay in sync
  useEffect(() => {
    if (!expanded) setFilter("all");
  }, [expanded]);

  const totalCount = allPhotos.length;

  // ── Compact View — Mini Masonry ───────────────────────────────────────────
  if (!expanded) {
    return (
      <OverviewCard
        title="Gallery"
        icon={Camera}
        subtitle={totalCount > 0 ? `${totalCount} photo${totalCount === 1 ? "" : "s"}` : undefined}
        expanded={false}
        onExpand={onExpand}
        onCollapse={onCollapse}
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
          <div
            className="grid gap-0.5"
            style={{
              gridTemplateColumns: `repeat(${Math.ceil(Math.sqrt(totalCount))}, 1fr)`,
              gridTemplateRows: `repeat(${Math.ceil(totalCount / Math.ceil(Math.sqrt(totalCount)))}, 1fr)`,
            }}
          >
            {allPhotos.map((photo, idx) => (
              <img
                key={photo.id}
                src={convertFileSrc(photo.file_path)}
                alt=""
                loading="lazy"
                className="h-full w-full cursor-pointer rounded-sm object-cover transition-opacity hover:opacity-80"
                onClick={() => setLightboxIndex(idx)}
              />
            ))}
          </div>
        )}

        <ImageLightbox
          images={lightboxImages}
          index={lightboxIndex ?? 0}
          open={lightboxIndex !== null}
          onOpenChange={(open) => !open && setLightboxIndex(null)}
          onIndexChange={setLightboxIndex}
          actions={lightboxActions}
        />
      </OverviewCard>
    );
  }

  // ── Expanded View ─────────────────────────────────────────────────────────
  return (
    <OverviewCard
      title="Gallery"
      icon={Camera}
      subtitle={totalCount > 0 ? `${totalCount} photo${totalCount === 1 ? "" : "s"}` : undefined}
      expanded
      onExpand={onExpand}
      onCollapse={onCollapse}
    >
      <div className="flex min-h-0 flex-1 flex-col gap-2">
        {/* Header row */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleAddPhoto}
            className="flex items-center gap-1 rounded bg-accent px-2 py-1 text-[10px] font-medium text-white hover:bg-accent-hover"
          >
            <Plus className="h-3 w-3" />
            Add Photo
          </button>
          <button
            onClick={() => setSortOrder((s) => (s === "newest" ? "oldest" : "newest"))}
            className="ml-auto flex items-center gap-1 rounded border border-border px-1.5 py-0.5 text-[9px] text-text-secondary hover:bg-muted"
          >
            <ArrowUpDown className="h-3 w-3" />
            {sortOrder === "newest" ? "Newest" : "Oldest"}
          </button>
        </div>

        {/* Filter pills */}
        <div className="flex gap-1">
          {FILTER_LABELS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={cn(
                "rounded-full px-2 py-0.5 text-[9px] font-medium transition-colors",
                filter === key
                  ? "bg-accent text-white"
                  : "bg-muted text-text-secondary hover:text-text-primary",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Masonry grid */}
        <ScrollArea className="min-h-0 flex-1">
          {filteredPhotos.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex flex-col items-center text-text-tertiary">
                <Camera className="mb-1.5 h-6 w-6 opacity-40" />
                {totalCount === 0 ? (
                  <>
                    <span className="text-[10px] font-medium">Capture your build journey</span>
                    <button
                      onClick={handleAddPhoto}
                      className="mt-2 flex items-center gap-1 rounded bg-accent px-2 py-1 text-[10px] font-medium text-white hover:bg-accent-hover"
                    >
                      <Plus className="h-3 w-3" />
                      Add Photo
                    </button>
                  </>
                ) : (
                  <span className="text-[10px]">No {filter} photos</span>
                )}
              </div>
            </div>
          ) : (
            <div className="columns-3 gap-2 pr-2">
              {filteredPhotos.map((photo, idx) => (
                <PhotoTile
                  key={photo.id}
                  photo={photo}
                  trackColor={photo.track_id ? trackMap.colors[photo.track_id] : undefined}
                  onClick={() => setLightboxIndex(idx)}
                  onToggleStar={() => handleToggleStar(photo)}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Lightbox */}
      <ImageLightbox
        images={lightboxImages}
        index={lightboxIndex ?? 0}
        open={lightboxIndex !== null}
        onOpenChange={(open) => !open && setLightboxIndex(null)}
        onIndexChange={setLightboxIndex}
        actions={lightboxActions}
      />
    </OverviewCard>
  );
}

// ── PhotoTile ────────────────────────────────────────────────────────────────

function PhotoTile({
  photo,
  trackColor,
  onClick,
  onToggleStar,
}: {
  photo: MergedPhoto;
  trackColor?: string;
  onClick: () => void;
  onToggleStar: () => void;
}) {
  return (
    <div
      className="group relative mb-2 cursor-pointer overflow-hidden rounded-lg break-inside-avoid"
      onClick={onClick}
    >
      {/* Track color bar */}
      {trackColor && (
        <div className="absolute inset-x-0 top-0 z-10 h-[3px]" style={{ backgroundColor: trackColor }} />
      )}

      <img
        src={convertFileSrc(photo.file_path)}
        alt=""
        loading="lazy"
        className="w-full object-cover"
      />

      {/* Bottom gradient + caption */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-1.5 pb-1 pt-4">
        {photo.caption && (
          <p className="truncate text-[9px] leading-tight text-white/90">{photo.caption}</p>
        )}
        <p className="text-[8px] text-white/60">{relativeTime(photo.created_at)}</p>
      </div>

      {/* Star button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleStar();
        }}
        className={cn(
          "absolute right-1 top-1 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-black/30 transition-opacity",
          photo.is_starred
            ? "opacity-100"
            : "opacity-0 hover:bg-black/50 group-hover:opacity-100",
        )}
      >
        <Star
          className={cn(
            "h-3 w-3",
            photo.is_starred
              ? "fill-yellow-400 text-yellow-400"
              : "text-white/80",
          )}
        />
      </button>
    </div>
  );
}
