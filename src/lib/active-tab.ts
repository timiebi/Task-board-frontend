import type { Tab } from "./types";

const STORAGE_KEY = "taskboard_active_tab";

const VALID_TABS = new Set<Tab>([
  "dashboard",
  "tasks",
  "notes",
  "plans",
  "events",
  "notifications",
  "settings",
]);

export function readStoredTab(): Tab | null {
  if (typeof window === "undefined") return null;
  const value = sessionStorage.getItem(STORAGE_KEY);
  if (!value || !VALID_TABS.has(value as Tab)) return null;
  return value as Tab;
}

export function storeActiveTab(tab: Tab) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, tab);
}
