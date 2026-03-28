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
