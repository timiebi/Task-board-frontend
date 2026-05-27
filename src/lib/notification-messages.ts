import type { AppNotification } from "./types";

export function notificationDeleteMessage(notification: AppNotification): string {
  switch (notification.kind) {
    case "item_shared":
      return (
        "This removes the alert from Activity and the matching item in Shared with you. " +
        "Anything you've already added to your tasks, notes, plans, or reminders stays on your board."
      );
    case "connection_invite":
      return (
        "This removes the alert from Activity. Pending invites are still available under " +
        "Settings → People until you accept or decline."
      );
    case "connection_accepted":
      return (
        "This removes the alert from Activity. Your connection with that person is unchanged."
      );
    default:
      return "This removes the alert from Activity.";
  }
}

export const CLEAR_ALL_ACTIVITY_MESSAGE =
  "This permanently clears your entire Activity feed and removes everything in Shared with you. " +
  "Items you've already copied to your tasks, notes, plans, or reminders will not be removed.";
