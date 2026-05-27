/** Scroll to a card in Notifications → Shared with you. */
export function focusSharedInboxItem(sharedItemId: number): boolean {
  if (typeof document === "undefined") return false;
  const node = document.querySelector(
    `[data-shared-item-id="${sharedItemId}"]`
  ) as HTMLElement | null;
  if (!node) return false;
  node.scrollIntoView({ behavior: "smooth", block: "center" });
  node.classList.add("focus-pulse");
  window.setTimeout(() => node.classList.remove("focus-pulse"), 1600);
  return true;
}

export function focusSharedInboxItemWithRetry(
  sharedItemId: number,
  onMissing?: () => void
): void {
  const attempt = (tries: number) => {
    if (focusSharedInboxItem(sharedItemId)) return;
    if (tries < 5) {
      window.setTimeout(() => attempt(tries + 1), 120);
      return;
    }
    onMissing?.();
  };
  attempt(0);
}
