import type { ShareableType, Tab } from "./types";

type FocusTarget = {
  tab: Tab;
  type: ShareableType;
  id: number;
};

const STORAGE_KEY = "tb:pending-focus-target";

export function setPendingFocusTarget(target: FocusTarget) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(target));
}

export function consumePendingFocusForTab(tab: Tab): FocusTarget | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as FocusTarget;
    if (parsed.tab !== tab) return null;
    window.sessionStorage.removeItem(STORAGE_KEY);
    return parsed;
  } catch {
    window.sessionStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function focusByDataTarget(type: ShareableType, id: number): boolean {
  if (typeof document === "undefined") return false;
  const selector = `[data-focus-type="${type}"][data-focus-id="${id}"]`;
  const node = document.querySelector(selector) as HTMLElement | null;
  if (!node) return false;
  node.scrollIntoView({ behavior: "smooth", block: "center" });
  node.classList.add("focus-pulse");
  window.setTimeout(() => node.classList.remove("focus-pulse"), 1600);
  return true;
}
