import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { CSSProperties } from "react";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const FORMULA_GRADIENT: CSSProperties = {
  background:
    "linear-gradient(135deg, var(--color-accent) 50%, var(--color-accent-hover) 50%)",
  borderStyle: "dashed",
};

/** Compute inline style for a palette-entry swatch (color, formula gradient, or muted fallback). */
export function getSwatchStyle(entry: {
  paint_color?: string | null;
  is_formula: boolean;
}): CSSProperties {
  if (entry.paint_color) return { backgroundColor: entry.paint_color };
  if (entry.is_formula) return FORMULA_GRADIENT;
  return { backgroundColor: "var(--color-muted)" };
}
