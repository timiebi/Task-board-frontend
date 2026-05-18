/** Browser has allowed notification pop-ups for this site. */
export function hasActiveNotifications(): boolean {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }
  return Notification.permission === "granted";
}

export function isNotificationDenied(): boolean {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }
  return Notification.permission === "denied";
}

export function canAskForNotifications(): boolean {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }
  return Notification.permission === "default";
}
