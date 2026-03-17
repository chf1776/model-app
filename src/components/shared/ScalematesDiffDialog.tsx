import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { ScalematesKitData, KitCategory } from "@/shared/types";
import { KIT_CATEGORIES } from "@/shared/types";

interface DiffRow {
  field: string;
  label: string;
  current: string;
  scalemates: string;
  /** Raw value for fields like category where display differs from stored value */
  rawValue: string;
  checked: boolean;
}

interface ScalematesDiffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  importResult: ScalematesKitData;
  currentValues: {
    name: string;
    manufacturer: string;
    scale: string;
    kitNumber: string;
    category: string;
    boxArtPath: string | null;
  };
  onApply: (updates: {
    name?: string;
    manufacturer?: string;
    scale?: string;
    kitNumber?: string;
    category?: KitCategory | "";
    boxArtUrl?: string | null;
    scalematesId?: string;
  }) => void;
}

function categoryLabel(value: string): string {
  return KIT_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

function SmallCheckbox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border transition-colors ${
        checked
          ? "border-accent bg-accent text-white"
          : "border-border bg-card hover:border-accent/50"
      }`}
    >
      {checked && (
        <svg className="h-2.5 w-2.5" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M2 6l3 3 5-5" />
        </svg>
      )}
    </button>
  );
}

export function ScalematesDiffDialog({
  open,
  onOpenChange,
  importResult,
  currentValues,
  onApply,
}: ScalematesDiffDialogProps) {
  const buildRows = (): DiffRow[] => {
    const rows: DiffRow[] = [];

    const addRow = (field: string, label: string, current: string, scalemates: string | null, rawValue?: string) => {
      if (scalemates == null || scalemates === "") return;
      rows.push({
        field,
        label,
        current,
        scalemates,
        rawValue: rawValue ?? scalemates,
        checked: !current, // Pre-check if current is empty
      });
    };

    addRow("name", "Name", currentValues.name, importResult.name);
    addRow("manufacturer", "Manufacturer", currentValues.manufacturer, importResult.manufacturer);
    addRow("scale", "Scale", currentValues.scale, importResult.scale);
    addRow("kitNumber", "Kit Number", currentValues.kitNumber, importResult.kit_number);
    addRow(
      "category",
      "Category",
      currentValues.category ? categoryLabel(currentValues.category) : "",
      importResult.category ? categoryLabel(importResult.category) : null,
      importResult.category ?? undefined,
    );

    return rows;
  };

  const [rows, setRows] = useState<DiffRow[]>(buildRows);
  const [boxArtChecked, setBoxArtChecked] = useState(
    importResult.box_art_url != null && !currentValues.boxArtPath,
  );
  const [boxArtError, setBoxArtError] = useState(false);

  const allChecked = rows.every((r) => r.checked) && (importResult.box_art_url ? boxArtChecked : true);

  const toggleAll = () => {
    const newVal = !allChecked;
    setRows(rows.map((r) => ({ ...r, checked: newVal })));
    if (importResult.box_art_url) setBoxArtChecked(newVal);
  };

  const toggleRow = (index: number) => {
    setRows(rows.map((r, i) => (i === index ? { ...r, checked: !r.checked } : r)));
  };

  const handleApply = () => {
    const updates: Record<string, string | null | undefined> = {};

    for (const row of rows) {
      if (row.checked) {
        updates[row.field] = row.rawValue;
      }
    }

    if (boxArtChecked && importResult.box_art_url) {
      updates.boxArtUrl = importResult.box_art_url;
    }

    updates.scalematesId = importResult.scalemates_id;

    onApply(updates as Parameters<typeof onApply>[0]);
    onOpenChange(false);
  };

  const hasAnyField = rows.length > 0 || importResult.box_art_url;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[520px] border-border bg-card p-4 shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-sm font-bold">Import from Scalemates</DialogTitle>
        </DialogHeader>

        {!hasAnyField ? (
          <p className="py-4 text-center text-xs text-text-tertiary">
            No importable data found on this page.
          </p>
        ) : (
          <div className="space-y-1">
            {/* Select all header */}
            <div className="flex items-center gap-2 border-b border-border pb-1.5">
              <SmallCheckbox checked={allChecked} onChange={toggleAll} />
              <span className="flex-1 text-[10px] font-semibold text-text-tertiary">
                {allChecked ? "Deselect All" : "Select All"}
              </span>
              <span className="w-[140px] text-[10px] font-semibold text-text-tertiary">Current</span>
              <span className="w-[140px] text-[10px] font-semibold text-text-tertiary">Scalemates</span>
            </div>

            {/* Text field rows */}
            {rows.map((row, i) => (
              <div key={row.field} className="flex items-center gap-2 py-1">
                <SmallCheckbox checked={row.checked} onChange={() => toggleRow(i)} />
                <span className="w-[72px] text-[11px] font-medium text-text-secondary">
                  {row.label}
                </span>
                <span className="w-[140px] truncate text-[11px] text-text-tertiary">
                  {row.current || "\u2014"}
                </span>
                <span className="w-[140px] truncate text-[11px] text-text-primary">
                  {row.scalemates}
                </span>
              </div>
            ))}

            {/* Box art row */}
            {importResult.box_art_url && (
              <div className="flex items-center gap-2 py-1">
                <SmallCheckbox checked={boxArtChecked} onChange={() => setBoxArtChecked(!boxArtChecked)} />
                <span className="w-[72px] text-[11px] font-medium text-text-secondary">
                  Box Art
                </span>
                <span className="w-[140px] text-[11px] text-text-tertiary">
                  {currentValues.boxArtPath ? "Has image" : "\u2014"}
                </span>
                <div className="w-[140px]">
                  {boxArtError ? (
                    <span className="text-[10px] text-text-tertiary">Preview unavailable</span>
                  ) : (
                    <img
                      src={importResult.box_art_url}
                      alt="Scalemates box art"
                      className="h-10 w-10 rounded object-cover"
                      onError={() => setBoxArtError(true)}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleApply}
            disabled={!rows.some((r) => r.checked) && !boxArtChecked}
            className="bg-accent text-xs text-white hover:bg-accent-hover"
          >
            Apply Selected
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
