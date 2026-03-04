import { useState } from "react";
import { Plus, Route } from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/store";
import * as api from "@/api";
import type { Track } from "@/shared/types";
import { TrackItem } from "./TrackItem";
import {
  AddTrackDialog,
  RenameTrackDialog,
  ChangeColorDialog,
  DeleteTrackDialog,
} from "./TrackDialogs";

export function TrackRail() {
  const tracks = useAppStore((s) => s.tracks);
  const activeTrackId = useAppStore((s) => s.activeTrackId);
  const activeProjectId = useAppStore((s) => s.activeProjectId);
  const setActiveTrack = useAppStore((s) => s.setActiveTrack);
  const addTrack = useAppStore((s) => s.addTrack);
  const updateTrackStore = useAppStore((s) => s.updateTrackStore);
  const removeTrack = useAppStore((s) => s.removeTrack);

  const [addOpen, setAddOpen] = useState(false);
  const [renameTrack, setRenameTrack] = useState<Track | null>(null);
  const [colorTrack, setColorTrack] = useState<Track | null>(null);
  const [deleteTrackTarget, setDeleteTrackTarget] = useState<Track | null>(null);

  const handleAdd = async (name: string, color?: string) => {
    if (!activeProjectId) return;
    try {
      const track = await api.createTrack({
        project_id: activeProjectId,
        name,
        color,
      });
      addTrack(track);
      setActiveTrack(track.id);
    } catch (e) {
      toast.error(`Failed to create track: ${e}`);
    }
  };

  const handleRename = async (id: string, name: string) => {
    try {
      const updated = await api.updateTrack({ id, name });
      updateTrackStore(updated);
    } catch (e) {
      toast.error(`Failed to rename track: ${e}`);
    }
  };

  const handleChangeColor = async (id: string, color: string) => {
    try {
      const updated = await api.updateTrack({ id, color });
      updateTrackStore(updated);
    } catch (e) {
      toast.error(`Failed to update track color: ${e}`);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteTrack(id);
      removeTrack(id);
    } catch (e) {
      toast.error(`Failed to delete track: ${e}`);
    }
  };

  return (
    <div className="flex w-[200px] shrink-0 flex-col border-r border-border bg-sidebar">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-[11px] font-semibold tracking-wide text-text-tertiary uppercase">
          Tracks
        </span>
        <button
          onClick={() => setAddOpen(true)}
          className="flex h-5 w-5 items-center justify-center rounded text-text-tertiary hover:bg-black/5 hover:text-text-secondary"
          title="Add track"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Track list */}
      <div className="flex-1 overflow-y-auto">
        {tracks.length === 0 ? (
          <div className="flex flex-col items-center px-4 pt-8 text-center">
            <Route className="mb-2 h-5 w-5 text-text-tertiary/50" />
            <p className="text-[10px] text-text-tertiary">
              No tracks yet. Add a track to organize your build steps.
            </p>
          </div>
        ) : (
          tracks.map((track) => (
            <TrackItem
              key={track.id}
              track={track}
              isActive={track.id === activeTrackId}
              onSelect={() => setActiveTrack(track.id)}
              onRename={() => setRenameTrack(track)}
              onChangeColor={() => setColorTrack(track)}
              onDelete={() => setDeleteTrackTarget(track)}
            />
          ))
        )}
      </div>

      {/* Dialogs */}
      <AddTrackDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        trackCount={tracks.length}
        onAdd={handleAdd}
      />
      <RenameTrackDialog
        open={!!renameTrack}
        onOpenChange={(open) => !open && setRenameTrack(null)}
        track={renameTrack}
        onRename={handleRename}
      />
      <ChangeColorDialog
        open={!!colorTrack}
        onOpenChange={(open) => !open && setColorTrack(null)}
        track={colorTrack}
        onChangeColor={handleChangeColor}
      />
      <DeleteTrackDialog
        open={!!deleteTrackTarget}
        onOpenChange={(open) => !open && setDeleteTrackTarget(null)}
        track={deleteTrackTarget}
        onDelete={handleDelete}
      />
    </div>
  );
}
