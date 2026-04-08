import { SectionLabel } from "./primitives";

export interface QuantityCounterProps {
  current: number;
  total: number;
  onChange: (next: number) => void;
  /**
   * "dots" — full section with label, dot row, count, and ± buttons (used in BuildingStepPanel).
   * "compact" — single muted row with "Progress" label, count, and ± buttons (used in StepEditorPanel).
   */
  variant: "dots" | "compact";
}

/**
 * Quantity tracker shared between BuildingStepPanel (build mode) and
 * StepEditorPanel (setup mode). The two variants share state semantics
 * but have different visual treatments.
 */
export function QuantityCounter({ current, total, onChange, variant }: QuantityCounterProps) {
  const dec = () => onChange(Math.max(0, current - 1));
  const inc = () => onChange(Math.min(total, current + 1));
  const isComplete = current >= total;

  if (variant === "compact") {
    return (
      <div className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-1.5">
        <span className="text-[10px] text-text-secondary">Progress</span>
        <div className="flex items-center gap-2">
          <CounterButton onClick={dec} disabled={current <= 0} symbol="−" />
          <span className={`min-w-[2.5rem] text-center text-xs font-semibold ${
            isComplete ? "text-success" : "text-text-primary"
          }`}>
            {current} / {total}
          </span>
          <CounterButton onClick={inc} disabled={current >= total} symbol="+" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <SectionLabel>Quantity</SectionLabel>
      <div className="flex items-center gap-2">
        <div className="flex flex-1 gap-1">
          {Array.from({ length: total }, (_, i) => (
            <span
              key={i}
              className={`h-2.5 w-2.5 rounded-full ${
                i < current ? "bg-accent" : "border border-border bg-transparent"
              }`}
            />
          ))}
        </div>
        <span className={`font-mono text-xs font-semibold ${
          isComplete ? "text-success" : "text-text-primary"
        }`}>
          {current}/{total}
        </span>
        <div className="flex gap-1">
          <CounterButton onClick={dec} disabled={current <= 0} symbol="−" />
          <CounterButton onClick={inc} disabled={current >= total} symbol="+" />
        </div>
      </div>
    </div>
  );
}

function CounterButton({ onClick, disabled, symbol }: { onClick: () => void; disabled: boolean; symbol: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex h-5 w-5 items-center justify-center rounded-full border border-border text-[11px] text-text-secondary hover:bg-white disabled:opacity-30"
    >
      {symbol}
    </button>
  );
}
