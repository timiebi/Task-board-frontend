import { format, formatDistanceToNow, isPast, parseISO } from "date-fns";
import type { Event, Task } from "./types";

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

/** Earliest due or remind time; used to surface tasks that are due soon. */
function taskUrgencyTimestamp(task: Task): number | null {
  const stamps: number[] = [];
  for (const iso of [task.due_date, task.remind_at]) {
    if (!iso) continue;
    try {
      stamps.push(parseISO(iso).getTime());
    } catch {
      /* skip invalid */
    }
  }
  if (stamps.length === 0) return null;
  return Math.min(...stamps);
}

/** Incomplete first; then soonest deadline/reminder; tasks without dates last. */
export function sortTasksByUrgency(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;

    const ta = taskUrgencyTimestamp(a);
    const tb = taskUrgencyTimestamp(b);
    if (ta === null && tb === null) return 0;
    if (ta === null) return 1;
    if (tb === null) return -1;
    return ta - tb;
  });
}

export type TaskPartitions = {
  overdue: Task[];
  active: Task[];
  done: Task[];
};

/** Split tasks into overdue (incomplete), other active (incomplete), and done. */
/** True if the event hasn't started yet or has a future reminder time. */
export function isUpcomingEvent(event: Event, now = Date.now()): boolean {
  const start = event.starts_at ? new Date(event.starts_at).getTime() : 0;
  const remind = event.remind_at ? new Date(event.remind_at).getTime() : 0;
  return start >= now || remind >= now;
}

/** Earliest future moment for this event (start or reminder). */
export function eventUpcomingTimestamp(event: Event, now = Date.now()): number | null {
  const stamps: number[] = [];
  if (event.starts_at) {
    const t = new Date(event.starts_at).getTime();
    if (t >= now) stamps.push(t);
  }
  if (event.remind_at) {
    const t = new Date(event.remind_at).getTime();
    if (t >= now) stamps.push(t);
  }
  if (stamps.length === 0) return null;
  return Math.min(...stamps);
}

/** Label for Home / lists — prefers the next upcoming time (often the reminder). */
export function eventDisplayTime(event: Event, now = Date.now()): string | null {
  const upcoming = eventUpcomingTimestamp(event, now);
  if (upcoming === null) {
    return event.starts_at ? formatDateTime(event.starts_at) : null;
  }
  if (event.remind_at && new Date(event.remind_at).getTime() === upcoming) {
    return formatDateTime(event.remind_at);
  }
  return formatDateTime(event.starts_at);
}

/** When saving: if only the reminder is in the future, align starts_at so Home lists it. */
export function normalizeEventTimes(
  starts_at: string,
  remind_at: string | null
): { starts_at: string; remind_at: string | null } {
  if (!remind_at) return { starts_at, remind_at };
  const now = Date.now();
  const remindMs = new Date(remind_at).getTime();
  const startMs = new Date(starts_at).getTime();
  if (remindMs >= now && startMs < now) {
    return { starts_at: remind_at, remind_at };
  }
  return { starts_at, remind_at };
}

export function partitionTasks(tasks: Task[]): TaskPartitions {
  const incomplete = tasks.filter((t) => !t.completed);
  const done = [...tasks.filter((t) => t.completed)].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );

  const overdue = sortTasksByUrgency(
    incomplete.filter((t) => isOverdue(t.due_date, false))
  );
  const active = sortTasksByUrgency(
    incomplete.filter((t) => !isOverdue(t.due_date, false))
  );

  return { overdue, active, done };
}
