import { useState, useCallback, useEffect, useMemo } from "react";
import type { StepPaintRefInfo } from "@/shared/types";
import { Plus, Pencil, Trash2, FlaskConical, X } from "lucide-react";
import { toast } from "sonner";
import * as api from "@/api";
import { useAppStore } from "@/store";
import { getSwatchStyle } from "@/lib/utils";
import type { PaletteEntry, PaletteComponentInput, Paint } from "@/shared/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PaletteSectionProps {
  entries: PaletteEntry[];
  projectId: string;
}

export function PaletteSection({ entries, projectId }: PaletteSectionProps) {
  const [addMode, setAddMode] = useState<"paint" | "formula" | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  // Lazy-load full paint catalog on first form open, fall back to project paints
  const [allPaints, setAllPaints] = useState<Paint[] | null>(null);
  const addEntry = useAppStore((s) => s.addOverviewPaletteEntry);
  const updateEntry = useAppStore((s) => s.updateOverviewPaletteEntry);
  const removeEntry = useAppStore((s) => s.removeOverviewPaletteEntry);
  const overviewStepPaintRefs = useAppStore((s) => s.overviewStepPaintRefs);

  const usageByEntryId = useMemo(() => {
    const map = new Map<string, StepPaintRefInfo[]>();
    for (const ref of overviewStepPaintRefs) {
      const list = map.get(ref.palette_entry_id) ?? [];
      list.push(ref);
      map.set(ref.palette_entry_id, list);
    }
    return map;
  }, [overviewStepPaintRefs]);

  const directPaints = useMemo(() => entries.filter((e) => !e.is_formula), [entries]);
  const formulas = useMemo(() => entries.filter((e) => e.is_formula), [entries]);

  // Load all paints once when any form opens
  useEffect(() => {
    if (addMode !== null && allPaints === null) {
      api.listPaints().then(setAllPaints).catch(() => setAllPaints([]));
    }
  }, [addMode, allPaints]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await api.deletePaletteEntry(id);
      removeEntry(id);
    } catch {
      toast.error("Failed to delete entry");
    }
  }, [removeEntry]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[9px] font-semibold uppercase tracking-wider text-text-tertiary">
          Palette ({entries.length})
        </p>
        {addMode === null && (
          <div className="flex gap-1">
            <button
              onClick={() => setAddMode("paint")}
              className="flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px] font-medium text-text-secondary hover:bg-muted hover:text-text-primary"
            >
              <Plus className="h-3 w-3" />
              Paint
            </button>
            <button
              onClick={() => setAddMode("formula")}
              className="flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px] font-medium text-text-secondary hover:bg-muted hover:text-text-primary"
            >
              <Plus className="h-3 w-3" />
              Formula
            </button>
          </div>
        )}
      </div>

      {addMode === "paint" && (
        <AddPaintForm
          projectId={projectId}
          allPaints={allPaints}
          onSave={(entry) => {
            addEntry(entry);
            setAddMode(null);
          }}
          onCancel={() => setAddMode(null)}
        />
      )}

      {addMode === "formula" && (
        <AddFormulaForm
          projectId={projectId}
          allPaints={allPaints}
          onSave={(entry) => {
            addEntry(entry);
            setAddMode(null);
          }}
          onCancel={() => setAddMode(null)}
        />
      )}

      {entries.length === 0 && addMode === null && (
        <p className="py-2 text-center text-[9px] text-text-tertiary">
          No palette entries yet
        </p>
      )}

      {/* Direct paints — swatch grid */}
      {directPaints.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {directPaints.map((entry) =>
            editingId === entry.id ? (
              <EditEntryForm
                key={entry.id}
                entry={entry}
                onSave={(updated) => { updateEntry(updated); setEditingId(null); }}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <PaletteSwatchItem
                key={entry.id}
                entry={entry}
                usage={usageByEntryId.get(entry.id) ?? []}
                onEdit={() => setEditingId(entry.id)}
                onDelete={() => handleDelete(entry.id)}
              />
            ),
          )}
        </div>
      )}

      {/* Formulas */}
      {formulas.length > 0 && (
        <div className="space-y-1">
          {directPaints.length > 0 && (
            <p className="text-[8px] font-semibold uppercase tracking-wider text-text-tertiary pt-1">
              Formulas
            </p>
          )}
          {formulas.map((entry) =>
            editingId === entry.id ? (
              <EditEntryForm
                key={entry.id}
                entry={entry}
                onSave={(updated) => { updateEntry(updated); setEditingId(null); }}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <FormulaRow
                key={entry.id}
                entry={entry}
                usage={usageByEntryId.get(entry.id) ?? []}
                onEdit={() => setEditingId(entry.id)}
                onDelete={() => handleDelete(entry.id)}
              />
            ),
          )}
        </div>
      )}
    </div>
  );
}

// ── PaletteSwatchItem (square swatch for direct paints) ────────────────────

function PaletteSwatchItem({
  entry,
  usage,
  onEdit,
  onDelete,
}: {
  entry: PaletteEntry;
  usage: StepPaintRefInfo[];
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="group/swatch relative text-center">
      <div
        className="h-7 w-7 rounded border border-black/10"
        style={getSwatchStyle(entry)}
        title={[entry.name, entry.paint_brand, entry.purpose, usage.length > 0 ? `Used in: ${usage.map((s) => s.step_title).join(", ")}` : null].filter(Boolean).join("\n")}
      />
      {/* Hover actions */}
      <div className="pointer-events-none absolute -right-1 -top-1 flex gap-0.5 opacity-0 transition-opacity group-hover/swatch:pointer-events-auto group-hover/swatch:opacity-100">
        <button
          onClick={onEdit}
          className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-accent text-white"
        >
          <Pencil className="h-2 w-2" />
        </button>
        <button
          onClick={onDelete}
          className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-white"
        >
          <X className="h-2 w-2" />
        </button>
      </div>
      <p className="mt-0.5 max-w-[32px] truncate text-[7px] leading-tight text-text-tertiary">
        {entry.name}
      </p>
    </div>
  );
}

// ── FormulaRow (card layout for formulas) ──────────────────────────────────

function FormulaRow({
  entry,
  usage,
  onEdit,
  onDelete,
}: {
  entry: PaletteEntry;
  usage: StepPaintRefInfo[];
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="group rounded border border-border/50 px-1.5 py-1">
      <div className="flex items-center gap-1.5">
        <FlaskConical className="h-3.5 w-3.5 shrink-0 text-accent" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[10px] font-medium leading-tight text-text-primary">
            {entry.name}
          </p>
          {entry.purpose && (
            <p className="truncate text-[9px] leading-tight text-text-tertiary">
              {entry.purpose}
            </p>
          )}
        </div>
        <div className="flex shrink-0 gap-0.5 opacity-0 group-hover:opacity-100">
          <button onClick={onEdit} className="rounded p-0.5 text-text-tertiary hover:text-text-primary">
            <Pencil className="h-3 w-3" />
          </button>
          <button onClick={onDelete} className="rounded p-0.5 text-text-tertiary hover:text-red-500">
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>
      {entry.components.length > 0 && (
        <div className="mt-1 space-y-0.5 pl-5">
          {entry.components.map((c) => (
            <div key={c.id} className="flex items-center gap-1">
              {c.paint_color && (
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full border border-border"
                  style={{ backgroundColor: c.paint_color }}
                />
              )}
              <span className="truncate text-[9px] text-text-secondary">
                {c.paint_brand} {c.paint_name}
              </span>
              {c.ratio_parts != null && (
                <span className="shrink-0 rounded bg-muted px-1 text-[8px] font-medium text-text-tertiary">
                  {c.ratio_parts} parts
                </span>
              )}
              {c.ratio_parts == null && c.percentage != null && (
                <span className="shrink-0 rounded bg-muted px-1 text-[8px] font-medium text-text-tertiary">
                  {c.percentage}%
                </span>
              )}
            </div>
          ))}
        </div>
      )}
      {entry.mixing_notes && (
        <p className="mt-0.5 pl-5 text-[8px] italic text-text-tertiary">
          {entry.mixing_notes}
        </p>
      )}
      {usage.length > 0 && (
        <p className="mt-0.5 truncate pl-5 text-[8px] text-text-tertiary">
          Used in: {usage.map((s) => s.step_title).join(", ")}
        </p>
      )}
    </div>
  );
}

// ── Shared form styles ─────────────────────────────────────────────────────

const FORM_CONTAINER = "space-y-1 rounded border border-accent/30 bg-muted/30 p-1.5";
const FORM_INPUT = "w-full rounded border border-border bg-card px-1.5 py-0.5 text-[10px] text-text-primary outline-none focus:border-accent";
const FORM_TEXTAREA = `${FORM_INPUT} resize-none`;

function FormActions({ onCancel, onSave, disabled }: { onCancel: () => void; onSave: () => void; disabled: boolean }) {
  return (
    <div className="flex justify-end gap-1">
      <button
        onClick={onCancel}
        className="rounded px-2 py-0.5 text-[9px] font-medium text-text-secondary hover:bg-muted"
      >
        Cancel
      </button>
      <button
        onClick={onSave}
        disabled={disabled}
        className="rounded bg-accent px-2 py-0.5 text-[9px] font-medium text-white hover:bg-accent-hover disabled:opacity-50"
      >
        Save
      </button>
    </div>
  );
}

// ── EditEntryForm ──────────────────────────────────────────────────────────

function EditEntryForm({
  entry,
  onSave,
  onCancel,
}: {
  entry: PaletteEntry;
  onSave: (e: PaletteEntry) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(entry.name);
  const [purpose, setPurpose] = useState(entry.purpose ?? "");
  const [mixingNotes, setMixingNotes] = useState(entry.mixing_notes ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await api.updatePaletteEntry({
        id: entry.id,
        name: name || undefined,
        purpose: purpose || undefined,
        mixing_notes: mixingNotes || undefined,
      });
      onSave(updated);
    } catch {
      toast.error("Failed to update entry");
    }
    setSaving(false);
  };

  return (
    <div className={FORM_CONTAINER}>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className={FORM_INPUT} />
      <input value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="Purpose (optional)" className={FORM_INPUT} />
      {entry.is_formula && (
        <textarea
          value={mixingNotes}
          onChange={(e) => setMixingNotes(e.target.value)}
          placeholder="Mixing notes (optional)"
          rows={2}
          className={FORM_TEXTAREA}
        />
      )}
      <FormActions onCancel={onCancel} onSave={handleSave} disabled={saving || !name.trim()} />
    </div>
  );
}

// ── Paint picker select (shared by both add forms) ─────────────────────────

function PaintSelect({
  paints,
  value,
  onChange,
  triggerClass,
  placeholder,
}: {
  paints: Paint[];
  value: string;
  onChange: (id: string) => void;
  triggerClass?: string;
  placeholder?: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={triggerClass ?? "h-6 text-[10px]"}>
        <SelectValue placeholder={placeholder ?? "Select paint..."} />
      </SelectTrigger>
      <SelectContent>
        {paints.map((p) => (
          <SelectItem key={p.id} value={p.id}>
            <span className="flex items-center gap-1">
              {p.color && (
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full border border-border"
                  style={{ backgroundColor: p.color }}
                />
              )}
              {p.brand} — {p.name}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// ── AddPaintForm ───────────────────────────────────────────────────────────

function AddPaintForm({
  projectId,
  allPaints,
  onSave,
  onCancel,
}: {
  projectId: string;
  allPaints: Paint[] | null;
  onSave: (entry: PaletteEntry) => void;
  onCancel: () => void;
}) {
  const [selectedPaintId, setSelectedPaintId] = useState<string>("");
  const [purpose, setPurpose] = useState("");
  const [saving, setSaving] = useState(false);

  const selectedPaint = allPaints?.find((p) => p.id === selectedPaintId);

  const handleSave = async () => {
    if (!selectedPaint) return;
    setSaving(true);
    try {
      const entry = await api.createPaletteEntry({
        project_id: projectId,
        name: selectedPaint.name,
        is_formula: false,
        paint_id: selectedPaint.id,
        purpose: purpose || undefined,
      });
      onSave(entry);
    } catch {
      toast.error("Failed to add paint");
    }
    setSaving(false);
  };

  return (
    <div className={FORM_CONTAINER}>
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-medium text-text-secondary">Add Paint to Palette</span>
        <button onClick={onCancel} className="rounded p-0.5 text-text-tertiary hover:text-text-primary">
          <X className="h-3 w-3" />
        </button>
      </div>
      {allPaints === null ? (
        <p className="text-[9px] text-text-tertiary">Loading paints...</p>
      ) : (
        <>
          <PaintSelect paints={allPaints} value={selectedPaintId} onChange={setSelectedPaintId} />
          <input value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="Purpose (optional)" className={FORM_INPUT} />
          <FormActions onCancel={onCancel} onSave={handleSave} disabled={saving || !selectedPaintId} />
        </>
      )}
    </div>
  );
}

// ── AddFormulaForm ─────────────────────────────────────────────────────────

function AddFormulaForm({
  projectId,
  allPaints,
  onSave,
  onCancel,
}: {
  projectId: string;
  allPaints: Paint[] | null;
  onSave: (entry: PaletteEntry) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [purpose, setPurpose] = useState("");
  const [mixingNotes, setMixingNotes] = useState("");
  const [components, setComponents] = useState<{ paintId: string; ratioParts: string }[]>([]);
  const [saving, setSaving] = useState(false);

  const addComponent = () => {
    setComponents([...components, { paintId: "", ratioParts: "" }]);
  };

  const updateComponent = (idx: number, field: "paintId" | "ratioParts", value: string) => {
    setComponents(components.map((c, i) => (i === idx ? { ...c, [field]: value } : c)));
  };

  const removeComponent = (idx: number) => {
    setComponents(components.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const entry = await api.createPaletteEntry({
        project_id: projectId,
        name: name.trim(),
        is_formula: true,
        purpose: purpose || undefined,
        mixing_notes: mixingNotes || undefined,
      });

      const validComponents = components.filter((c) => c.paintId);
      if (validComponents.length > 0) {
        const compInputs: PaletteComponentInput[] = validComponents.map((c) => ({
          paint_id: c.paintId,
          ratio_parts: c.ratioParts ? parseInt(c.ratioParts, 10) : undefined,
        }));
        const updatedComps = await api.setPaletteComponents(entry.id, compInputs);
        entry.components = updatedComps;
      }

      onSave(entry);
    } catch {
      toast.error("Failed to create formula");
    }
    setSaving(false);
  };

  return (
    <div className={FORM_CONTAINER}>
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-medium text-text-secondary">Add Formula</span>
        <button onClick={onCancel} className="rounded p-0.5 text-text-tertiary hover:text-text-primary">
          <X className="h-3 w-3" />
        </button>
      </div>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Formula name" className={FORM_INPUT} />
      <input value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="Purpose (optional)" className={FORM_INPUT} />

      {/* Components */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[8px] font-medium text-text-tertiary">Components</span>
          <button
            onClick={addComponent}
            className="flex items-center gap-0.5 text-[8px] font-medium text-accent hover:text-accent-hover"
          >
            <Plus className="h-2.5 w-2.5" />
            Add
          </button>
        </div>
        {allPaints === null ? (
          <p className="text-[8px] text-text-tertiary">Loading...</p>
        ) : (
          components.map((comp, idx) => (
            <div key={idx} className="flex items-center gap-1">
              <PaintSelect
                paints={allPaints}
                value={comp.paintId}
                onChange={(v) => updateComponent(idx, "paintId", v)}
                triggerClass="h-5 flex-1 text-[9px]"
                placeholder="Pick paint..."
              />
              <input
                value={comp.ratioParts}
                onChange={(e) => updateComponent(idx, "ratioParts", e.target.value)}
                placeholder="Parts"
                className="w-12 rounded border border-border bg-card px-1 py-0.5 text-[9px] text-text-primary outline-none focus:border-accent"
              />
              <button onClick={() => removeComponent(idx)} className="rounded p-0.5 text-text-tertiary hover:text-red-500">
                <X className="h-2.5 w-2.5" />
              </button>
            </div>
          ))
        )}
      </div>

      <textarea
        value={mixingNotes}
        onChange={(e) => setMixingNotes(e.target.value)}
        placeholder="Mixing notes (optional)"
        rows={2}
        className={FORM_TEXTAREA}
      />
      <FormActions onCancel={onCancel} onSave={handleSave} disabled={saving || !name.trim()} />
    </div>
  );
}
