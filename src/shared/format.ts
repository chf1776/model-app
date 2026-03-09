/** Format a duration in seconds as a human-readable string. */
export function formatDuration(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  if (days === 0) return "today";
  if (days === 1) return "1 day";
  if (days < 30) return `${days} days`;
  const months = Math.floor(days / 30);
  const remDays = days % 30;
  if (months < 12) {
    return remDays > 0 ? `${months}mo ${remDays}d` : `${months} month${months > 1 ? "s" : ""}`;
  }
  const years = Math.floor(months / 12);
  const remMonths = months % 12;
  return remMonths > 0 ? `${years}y ${remMonths}mo` : `${years} year${years > 1 ? "s" : ""}`;
}

/** Format a Unix timestamp (seconds) as a relative time string. */
export function relativeTime(ts: number): string {
  const now = Date.now() / 1000;
  const diff = now - ts;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  const days = Math.floor(diff / 86400);
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months === 1) return "1 month ago";
  if (months < 12) return `${months} months ago`;
  return new Date(ts * 1000).toLocaleDateString();
}
