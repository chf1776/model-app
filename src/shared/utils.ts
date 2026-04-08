export function isPartFullyTicked(part: { ticked_count: number; quantity: number }): boolean {
  return part.ticked_count >= part.quantity;
}

export function formatPartProgress(part: { ticked_count: number; quantity: number }): string {
  return part.quantity > 1 ? ` ${part.ticked_count}/${part.quantity}` : "";
}

/**
 * Compare two part numbers numerically when possible, falling back to
 * lexicographic order. Nulls sort before non-null values.
 */
export function comparePartNumbers(
  a: string | null,
  b: string | null,
): number {
  const na = a ? parseInt(a, 10) : 0;
  const nb = b ? parseInt(b, 10) : 0;
  if (isNaN(na) || isNaN(nb)) return (a ?? "").localeCompare(b ?? "");
  return na - nb;
}

/**
 * Group parts by sprue label, sorted alphabetically by label and
 * numerically by part number within each group.
 */
export function groupPartsBySprue<T extends { sprue_label: string; part_number: string | null }>(
  parts: T[],
): Array<readonly [string, T[]]> {
  const map = new Map<string, T[]>();
  for (const part of parts) {
    const arr = map.get(part.sprue_label) ?? [];
    arr.push(part);
    map.set(part.sprue_label, arr);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, group]) =>
      [label, group.sort((a, b) => comparePartNumbers(a.part_number, b.part_number))] as const,
    );
}
