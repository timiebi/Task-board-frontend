import { format, formatDistanceToNow, isPast, parseISO } from "date-fns";

export function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  try {
    return format(parseISO(iso), "MMM d, yyyy h:mm a");
  } catch {
    return iso;
  }
}

export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return format(parseISO(iso), "MMM d, yyyy");
  } catch {
    return iso;
  }
}

export function relativeTime(iso: string | null): string {
  if (!iso) return "";
  try {
    return formatDistanceToNow(parseISO(iso), { addSuffix: true });
  } catch {
    return "";
  }
}

export function isOverdue(iso: string | null, completed: boolean): boolean {
  if (!iso || completed) return false;
  try {
    return isPast(parseISO(iso));
  } catch {
    return false;
  }
}

export function toDatetimeLocalValue(iso: string | null): string {
  if (!iso) return "";
  try {
    const d = parseISO(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return "";
  }
}

export function fromDatetimeLocalValue(value: string): string | null {
  if (!value) return null;
  return new Date(value).toISOString();
}

export const priorityBadgeClass = {
  low: "badge badge-low",
  medium: "badge badge-medium",
  high: "badge badge-high",
} as const;
