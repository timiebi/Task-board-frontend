import { api } from "./api";

export type PushState = "unsupported" | "denied" | "default" | "subscribed";

export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

function urlBase64ToUint8Array(b64: string): ArrayBuffer {
  const padding = "=".repeat((4 - (b64.length % 4)) % 4);
  const base64 = (b64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const buffer = new ArrayBuffer(raw.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i++) view[i] = raw.charCodeAt(i);
  return buffer;
}

async function getRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;
  try {
    return await navigator.serviceWorker.ready;
  } catch {
    return null;
  }
}

export async function getCurrentPushState(): Promise<PushState> {
  if (!isPushSupported()) return "unsupported";
  if (Notification.permission === "denied") return "denied";
  const reg = await getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  if (sub) return "subscribed";
  return Notification.permission === "granted" ? "default" : "default";
}

export async function ensurePushSubscription(): Promise<PushState> {
  if (!isPushSupported()) return "unsupported";

  if (Notification.permission === "default") {
    const result = await Notification.requestPermission();
    if (result !== "granted") {
      return result === "denied" ? "denied" : "default";
    }
  } else if (Notification.permission === "denied") {
    return "denied";
  }

  const reg = await getRegistration();
  if (!reg) return "default";

  let subscription = await reg.pushManager.getSubscription();
  if (!subscription) {
    let publicKey: string;
    try {
      const res = await api.push.publicKey();
      publicKey = res.public_key;
    } catch {
      return "default";
    }
    if (!publicKey) return "default";

    try {
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
    } catch {
      return "default";
    }
  }

  const json = subscription.toJSON() as {
    endpoint?: string;
    keys?: { p256dh?: string; auth?: string };
  };
  if (!json.endpoint || !json.keys?.p256dh || !json.keys.auth) {
    return "default";
  }

  try {
    await api.push.subscribe({
      endpoint: json.endpoint,
      keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
      user_agent:
        typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 300) : "",
    });
  } catch {
    /* server unreachable — keep the local subscription so we can retry later */
  }

  return "subscribed";
}

export async function disablePushSubscription(): Promise<void> {
  if (!isPushSupported()) return;
  const reg = await getRegistration();
  const subscription = await reg?.pushManager.getSubscription();
  if (!subscription) return;
  const endpoint = subscription.endpoint;
  try {
    await subscription.unsubscribe();
  } catch {
    /* even if local unsubscribe fails, still tell the server */
  }
  try {
    await api.push.unsubscribe(endpoint);
  } catch {
    /* ignore */
  }
}
