const STORAGE_KEY = "task_board_pending_invite_token";

export function storePendingInviteToken(token: string) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, token);
}

export function getPendingInviteToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(STORAGE_KEY);
}

export function clearPendingInviteToken() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY);
}

export function captureInviteTokenFromUrl() {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  const token = params.get("invite");
  if (!token) return;
  storePendingInviteToken(token);
  params.delete("invite");
  const next = params.toString()
    ? `${window.location.pathname}?${params}`
    : window.location.pathname;
  window.history.replaceState({}, "", next);
}

const TAB_VALUES = new Set([
  "dashboard",
  "tasks",
  "notes",
  "plans",
  "events",
  "notifications",
  "settings",
]);

/** Returns and clears any `?tab=...` value from the URL. */
export function consumeTabFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const tab = params.get("tab");
  if (!tab || !TAB_VALUES.has(tab)) return null;
  params.delete("tab");
  const next = params.toString()
    ? `${window.location.pathname}?${params}`
    : window.location.pathname;
  window.history.replaceState({}, "", next);
  return tab;
}
