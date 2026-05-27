import type { ShareableType, Tab } from "./types";
import { formatDateTime } from "./utils";

export function tabForImportTarget(target: ShareableType): Tab {
  const map: Record<ShareableType, Tab> = {
    task: "tasks",
    note: "notes",
    plan: "plans",
    event: "events",
  };
  return map[target];
}

function snapshotLines(snapshot: Record<string, unknown>, itemType: string): string[] {
  const lines: string[] = [];
  const title = snapshot.title;
  if (title) lines.push(`Title: ${String(title)}`);

  if (itemType === "task") {
    if (snapshot.description) lines.push(String(snapshot.description));
    if (snapshot.due_date) lines.push(`Due: ${formatDateTime(String(snapshot.due_date))}`);
    if (snapshot.priority) lines.push(`Priority: ${String(snapshot.priority)}`);
    if (snapshot.is_daily) lines.push("Daily task");
  } else if (itemType === "note" || itemType === "plan") {
    if (snapshot.content) lines.push(String(snapshot.content));
    if (itemType === "plan") {
      if (snapshot.start_date) lines.push(`Start: ${String(snapshot.start_date)}`);
      if (snapshot.end_date) lines.push(`End: ${String(snapshot.end_date)}`);
      if (snapshot.status) lines.push(`Status: ${String(snapshot.status)}`);
    }
  } else if (itemType === "event") {
    if (snapshot.description) lines.push(String(snapshot.description));
    if (snapshot.starts_at) {
      lines.push(`Starts: ${formatDateTime(String(snapshot.starts_at))}`);
    }
    if (snapshot.remind_at) {
      lines.push(`Remind: ${formatDateTime(String(snapshot.remind_at))}`);
    }
  }

  return lines;
}

/** Full text for clipboard — notification + shared snapshot + message. */
export function buildSharedCopyText(input: {
  itemType: string;
  fromUsername: string;
  message?: string;
  snapshot?: Record<string, unknown>;
  notificationTitle?: string;
  notificationBody?: string;
}): string {
  const parts: string[] = [];

  if (input.notificationTitle) parts.push(input.notificationTitle);
  if (input.notificationBody && input.notificationBody !== input.notificationTitle) {
    parts.push(input.notificationBody);
  }

  parts.push("");
  parts.push(`From: ${input.fromUsername}`);
  parts.push(`Type: ${input.itemType}`);

  const snap = input.snapshot ?? {};
  parts.push(...snapshotLines(snap, input.itemType));

  if (input.message?.trim()) {
    parts.push("");
    parts.push("Message:");
    parts.push(input.message.trim());
  }

  return parts.join("\n").trim();
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}
