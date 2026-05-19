/** User-facing copy for errors and API failures (not developer jargon). */

export const USER_MESSAGES = {
  network:
    "We couldn't connect right now. Check your internet and try again in a moment.",
  sessionExpired: "Your session ended. Please sign in again.",
  generic: "Something went wrong. Please try again.",
  notFound: "We couldn't find that. It may have been removed.",
  forbidden: "You don't have permission to do that.",
  serverError: "Our servers are having a moment. Please try again shortly or refresh.",
  timeout: "That took too long. Please try again.",
} as const;

const DETAIL_MAP: Record<string, string> = {
  "Invalid username or password.": "That username or password doesn't match. Try again.",
  "That username or password doesn't match. Try again.":
    "That username or password doesn't match. Try again.",
  "Username and password are required.": "Please enter a username and password.",
  "Please enter a username and password.": "Please enter a username and password.",
  "Username already taken.": "That username is already taken. Pick another one.",
  "That username is already taken. Pick another one.":
    "That username is already taken. Pick another one.",
  "Password must be at least 8 characters.":
    "Use a password at least 8 characters long.",
  "Use a password at least 8 characters long.":
    "Use a password at least 8 characters long.",
  "You cannot invite yourself.": "You can't invite your own email address.",
  "Already connected with this person.": "You're already connected with them.",
  "Invite not found.": "That invite is no longer available.",
  "Not allowed.": "You can't respond to this invite.",
  "Invalid or expired invite.": "This invite link isn't valid anymore.",
  "Sign in to accept this invite.": "Sign in first, then accept the invite.",
  "User not found.": "We couldn't find that person.",
  "You can only share with accepted connections.":
    "They need to accept your invite before you can share.",
  "You do not own this item.": "You can only share things you created.",
  "Not found.": USER_MESSAGES.notFound,
  "Invalid notification.": "This notification isn't valid anymore.",
  "Invite already handled.": "You've already accepted or declined this invite.",
  "You've already accepted or declined this invite.":
    "You've already accepted or declined this invite.",
  "This invite wasn't sent to you.": "This invite wasn't sent to you.",
  "That type of item can't be shared.": "That type of item can't be shared.",
  "We couldn't find that shared item.": "We couldn't find that shared item.",
  "We couldn't find that notification.": "We couldn't find that notification.",
  "This notification isn't valid anymore.": "This notification isn't valid anymore.",
  "Invite declined.": "Invite declined.",
  "Network error": USER_MESSAGES.network,
  Unauthorized: USER_MESSAGES.sessionExpired,
};

export function friendlyApiMessage(
  body: unknown,
  status: number,
  fallback?: string
): string {
  let raw = fallback ?? USER_MESSAGES.generic;

  if (body && typeof body === "object") {
    const o = body as Record<string, unknown>;
    if (typeof o.detail === "string") raw = o.detail;
    else if (typeof o.error === "string") raw = o.error;
    else if (Array.isArray(o.detail) && o.detail[0]) {
      const first = o.detail[0];
      if (typeof first === "string") raw = first;
      else if (first && typeof first === "object" && "detail" in first) {
        raw = String((first as { detail?: string }).detail ?? raw);
      }
    }
  }

  if (DETAIL_MAP[raw]) return DETAIL_MAP[raw];

  const lower = raw.toLowerCase();
  if (lower.includes("network") || lower.includes("reach server") || lower.includes("backend")) {
    return USER_MESSAGES.network;
  }
  if (status === 403) return USER_MESSAGES.forbidden;
  if (status === 404) return USER_MESSAGES.notFound;
  if (status >= 500) return USER_MESSAGES.serverError;

  return raw;
}
