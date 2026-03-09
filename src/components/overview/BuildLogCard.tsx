import { useMemo, useState, useRef, useCallback } from "react";
import { ScrollText, Send, Camera, X } from "lucide-react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { open as openFileDialog } from "@tauri-apps/plugin-dialog";
import { useAppStore } from "@/store";
import { relativeTime } from "@/shared/format";
import { useNavigateToStep } from "@/hooks/useNavigateToStep";
import type { BuildLogEntry } from "@/shared/types";
import { IMAGE_FILE_FILTER } from "@/shared/types";
import { addBuildLogEntry, addBuildLogPhoto } from "@/api";
import { OverviewCard } from "./OverviewCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ImageLightbox, type LightboxImage } from "@/components/shared/ImageLightbox";
import { cn } from "@/lib/utils";

const MAX_ENTRIES = 8;

type LogFilter = "all" | "steps" | "notes" | "photos" | "milestones";

const FILTER_LABELS: { key: LogFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "steps", label: "Steps" },
  { key: "notes", label: "Notes" },
  { key: "photos", label: "Photos" },
  { key: "milestones", label: "Milestones" },
];

function matchesFilter(entry: BuildLogEntry, filter: LogFilter): boolean {
  switch (filter) {
    case "all":
      return true;
    case "steps":
      return entry.entry_type === "step_complete";
    case "notes":
      return entry.entry_type === "note";
    case "photos":
      return entry.entry_type === "photo";
    case "milestones":
      return entry.entry_type === "milestone" || entry.entry_type === "build_complete";
  }
}

function entryLabel(
  entry: BuildLogEntry,
  stepTitleMap: Record<string, string>,
): string {
  const stepTitle = entry.step_id ? stepTitleMap[entry.step_id] : null;
  switch (entry.entry_type) {
    case "step_complete":
      return stepTitle
        ? `Completed "${stepTitle}"`
        : entry.body ?? `Step ${entry.step_number ?? ""} completed`;
    case "milestone":
      return entry.body ?? "Milestone reached";
    case "note":
      return entry.body ?? "Note added";
    case "photo":
      return entry.caption
        ? entry.caption
        : stepTitle
          ? `Photo for "${stepTitle}"`
          : "Photo added";
    case "build_complete":
      return "Build complete";
    default:
      return entry.body ?? entry.entry_type;
  }
}

function groupByDay(entries: BuildLogEntry[]) {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const todayStr = today.toDateString();
  const yesterdayStr = yesterday.toDateString();

  const dayLabel = (ts: number) => {
    const dateStr = new Date(ts * 1000).toDateString();
    if (dateStr === todayStr) return "Today";
    if (dateStr === yesterdayStr) return "Yesterday";
    return new Date(ts * 1000).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  };

  const groups: { label: string; entries: BuildLogEntry[] }[] = [];
  let currentLabel = "";
  for (const entry of entries) {
    const label = dayLabel(entry.created_at);
    if (label !== currentLabel) {
      groups.push({ label, entries: [entry] });
      currentLabel = label;
    } else {
      groups[groups.length - 1].entries.push(entry);
    }
  }
  return groups;
}

interface BuildLogCardProps {
  expanded: boolean;
  onExpand?: () => void;
  onCollapse: () => void;
}

export function BuildLogCard({ expanded, onExpand, onCollapse }: BuildLogCardProps) {
  const buildLog = useAppStore((s) => s.overviewBuildLog);
  const tracks = useAppStore((s) => s.tracks);
  const steps = useAppStore((s) => s.steps);
  const activeProjectId = useAppStore((s) => s.activeProjectId);
  const addOverviewBuildLogEntry = useAppStore((s) => s.addOverviewBuildLogEntry);
  const navigateToStep = useNavigateToStep();

  const [filter, setFilter] = useState<LogFilter>("all");
  const [noteText, setNoteText] = useState("");
  const [pendingPhoto, setPendingPhoto] = useState<string | null>(null);
  const [photoCaption, setPhotoCaption] = useState("");
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const trackColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const t of tracks) map[t.id] = t.color;
    return map;
  }, [tracks]);

  const stepTitleMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const s of steps) map[s.id] = s.title;
    return map;
  }, [steps]);

  const filteredEntries = useMemo(() => {
    const source = expanded ? buildLog : buildLog.slice(0, MAX_ENTRIES);
    if (!expanded || filter === "all") return source;
    return source.filter((e) => matchesFilter(e, filter));
  }, [buildLog, expanded, filter]);

  const grouped = useMemo(() => groupByDay(filteredEntries), [filteredEntries]);

  // All photo entries for lightbox navigation (skip in compact mode)
  const photoEntries = useMemo(
    () => (expanded ? filteredEntries.filter((e) => e.photo_path) : []),
    [filteredEntries, expanded],
  );
  const lightboxImages: LightboxImage[] = useMemo(
    () =>
      photoEntries.map((e) => ({
        src: convertFileSrc(e.photo_path!),
        caption: e.caption ?? undefined,
      })),
    [photoEntries],
  );

  const openPhotoLightbox = useCallback(
    (entryId: string) => {
      const idx = photoEntries.findIndex((e) => e.id === entryId);
      if (idx >= 0) {
        setLightboxIndex(idx);
        setLightboxOpen(true);
      }
    },
    [photoEntries],
  );

  const handlePickPhoto = async () => {
    const selected = await openFileDialog({
      multiple: false,
      filters: [IMAGE_FILE_FILTER],
    });
    if (selected) {
      setPendingPhoto(selected as string);
    }
  };

  const handleSend = async () => {
    if (!activeProjectId || sending) return;
    setSending(true);
    try {
      if (pendingPhoto) {
        const entry = await addBuildLogPhoto(
          activeProjectId,
          pendingPhoto,
          photoCaption || null,
        );
        addOverviewBuildLogEntry(entry);
        setPendingPhoto(null);
        setPhotoCaption("");
        setNoteText("");
      } else if (noteText.trim()) {
        const entry = await addBuildLogEntry({
          projectId: activeProjectId,
          entryType: "note",
          body: noteText.trim(),
        });
        addOverviewBuildLogEntry(entry);
        setNoteText("");
      }
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === "Escape") {
      e.preventDefault();
      if (pendingPhoto) {
        setPendingPhoto(null);
        setPhotoCaption("");
      } else {
        inputRef.current?.blur();
      }
    }
  };

  const canSend = !!pendingPhoto || !!noteText.trim();

  const renderEntry = (entry: BuildLogEntry) => {
    const trackColor = entry.track_id ? trackColorMap[entry.track_id] : undefined;
    const isMilestone = entry.entry_type === "milestone";
    const isCompletion =
      entry.entry_type === "step_complete" || entry.entry_type === "build_complete";
    const dotColor =
      isCompletion || isMilestone ? trackColor ?? "var(--color-accent)" : undefined;
    const isClickable = !!entry.step_id;

    return (
      <div
        key={entry.id}
        className={`flex items-start gap-1.5 rounded px-1 py-0.5 ${
          isClickable ? "cursor-pointer hover:bg-muted" : ""
        }`}
        onClick={() => entry.step_id && navigateToStep(entry.step_id)}
      >
        {isMilestone ? (
          <div
            className="mt-[3px] h-2 w-2 shrink-0 rounded-sm"
            style={{ backgroundColor: dotColor }}
          />
        ) : (
          <div
            className="mt-[3px] h-2 w-2 shrink-0 rounded-full border"
            style={
              dotColor
                ? { backgroundColor: dotColor, borderColor: dotColor }
                : { borderColor: "var(--color-accent)" }
            }
          />
        )}
        <div className="min-w-0 flex-1">
          <span className="truncate text-[9px] leading-tight text-text-secondary">
            {entryLabel(entry, stepTitleMap)}
          </span>
          {entry.photo_path && (
            <button
              className="mt-0.5 block"
              onClick={(e) => {
                e.stopPropagation();
                openPhotoLightbox(entry.id);
              }}
            >
              <img
                src={convertFileSrc(entry.photo_path)}
                alt={entry.caption ?? "Build log photo"}
                className="h-16 rounded object-cover"
              />
            </button>
          )}
        </div>
        <span className="shrink-0 text-[8px] text-text-tertiary">
          {relativeTime(entry.created_at)}
        </span>
      </div>
    );
  };

  // ── Compact view ───────────────────────────────────────────────────────────
  if (!expanded) {
    return (
      <OverviewCard
        title="Build Log"
        icon={ScrollText}
        subtitle={
          buildLog.length > 0
            ? `${buildLog.length} entr${buildLog.length === 1 ? "y" : "ies"}`
            : undefined
        }
        expanded={false}
        onExpand={onExpand}
        onCollapse={onCollapse}
      >
        {grouped.length === 0 ? (
          <div className="flex h-full items-center justify-center py-3">
            <div className="flex flex-col items-center text-text-tertiary">
              <ScrollText className="mb-1 h-4 w-4 opacity-40" />
              <span className="text-[9px]">No activity yet</span>
              <span className="mt-0.5 text-[8px] opacity-60">
                Complete steps in Build mode to see history
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-1.5">
            {grouped.map((group) => (
              <div key={group.label}>
                <p className="mb-0.5 text-[8px] font-semibold uppercase tracking-wider text-text-tertiary">
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {group.entries.map(renderEntry)}
                </div>
              </div>
            ))}
          </div>
        )}
      </OverviewCard>
    );
  }

  // ── Expanded view ──────────────────────────────────────────────────────────
  return (
    <OverviewCard
      title="Build Log"
      icon={ScrollText}
      subtitle={
        buildLog.length > 0
          ? `${buildLog.length} entr${buildLog.length === 1 ? "y" : "ies"}`
          : undefined
      }
      expanded
      onExpand={onExpand}
      onCollapse={onCollapse}
    >
      <div className="flex min-h-0 flex-1 flex-col gap-2">
        {/* Composer */}
        {activeProjectId && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <input
                ref={inputRef}
                type="text"
                placeholder={pendingPhoto ? "Add a caption..." : "Add a note..."}
                className="h-7 flex-1 rounded border border-border bg-background px-2 text-[11px] text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none"
                value={pendingPhoto ? photoCaption : noteText}
                onChange={(e) =>
                  pendingPhoto
                    ? setPhotoCaption(e.target.value)
                    : setNoteText(e.target.value)
                }
                onKeyDown={handleKeyDown}
              />
              <button
                onClick={handlePickPhoto}
                className="flex h-7 w-7 items-center justify-center rounded border border-border text-text-tertiary hover:bg-muted hover:text-text-primary"
                title="Attach photo"
              >
                <Camera className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={handleSend}
                disabled={!canSend || sending}
                className="flex h-7 w-7 items-center justify-center rounded bg-accent text-white hover:bg-accent-hover disabled:opacity-40"
                title="Send"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
            {pendingPhoto && (
              <div className="flex items-center gap-2 rounded border border-border bg-muted/50 px-2 py-1.5">
                <img
                  src={convertFileSrc(pendingPhoto)}
                  alt="Pending photo"
                  className="h-10 w-10 shrink-0 rounded object-cover"
                />
                <span className="min-w-0 flex-1 truncate text-[10px] text-text-secondary">
                  Photo selected
                </span>
                <button
                  onClick={() => {
                    setPendingPhoto(null);
                    setPhotoCaption("");
                  }}
                  className="flex h-5 w-5 items-center justify-center rounded text-text-tertiary hover:text-text-primary"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Filter Pills */}
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

        {/* Entry list */}
        <ScrollArea className="min-h-0 flex-1">
          {grouped.length === 0 ? (
            <div className="flex items-center justify-center py-6">
              <div className="flex flex-col items-center text-text-tertiary">
                <ScrollText className="mb-1 h-4 w-4 opacity-40" />
                <span className="text-[9px]">
                  {filter === "all" ? "No activity yet" : `No ${filter} entries`}
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5 pr-2">
              {grouped.map((group) => (
                <div key={group.label}>
                  <p className="mb-0.5 text-[8px] font-semibold uppercase tracking-wider text-text-tertiary">
                    {group.label}
                  </p>
                  <div className="space-y-0.5">
                    {group.entries.map(renderEntry)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Lightbox */}
      {lightboxImages.length > 0 && (
        <ImageLightbox
          images={lightboxImages}
          index={lightboxIndex}
          open={lightboxOpen}
          onOpenChange={setLightboxOpen}
          onIndexChange={setLightboxIndex}
          title="Build log photo"
        />
      )}
    </OverviewCard>
  );
}
