// /* Task Board service worker — push notifications + offline shell cache */

// const CACHE = "taskboard-shell-v4";
// const SHELL_ASSETS = ["/", "/manifest.webmanifest", "/icon.svg"];

// self.addEventListener("install", (event) => {
//   event.waitUntil(
//     caches.open(CACHE).then((cache) => cache.addAll(SHELL_ASSETS))
//   );
//   self.skipWaiting();
// });

// self.addEventListener("activate", (event) => {
//   event.waitUntil(
//     (async () => {
//       const keys = await caches.keys();
//       await Promise.all(
//         keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))
//       );
//       await self.clients.claim();
//     })()
//   );
// });

// self.addEventListener("fetch", (event) => {
//   const req = event.request;
//   if (req.method !== "GET") return;

//   const url = new URL(req.url);
//   if (url.origin !== self.location.origin) return;
//   if (url.pathname.startsWith("/api/")) return;

//   event.respondWith(
//     (async () => {
//       try {
//         const fresh = await fetch(req);
//         if (fresh && fresh.ok && req.mode !== "no-cors") {
//           const copy = fresh.clone();
//           caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
//         }
//         return fresh;
//       } catch {
//         const cached = await caches.match(req);
//         if (cached) return cached;
//         const fallback = await caches.match("/");
//         if (fallback) return fallback;
//         return new Response("Offline", { status: 503, statusText: "Offline" });
//       }
//     })()
//   );
// });

// function parsePushPayload(event) {
//   if (!event.data) {
//     return { title: "Task Board", body: "You have a new update.", url: "/" };
//   }
//   try {
//     return event.data.json();
//   } catch {
//     return { title: "Task Board", body: event.data.text(), url: "/" };
//   }
// }

// self.addEventListener("push", (event) => {
//   const payload = parsePushPayload(event);
//   const title = payload.title || "Task Board";
//   const options = {
//     body: payload.body || "",
//     icon: "/icon.svg",
//     badge: "/icon.svg",
//     tag: payload.tag || undefined,
//     renotify: !!payload.tag,
//     data: {
//       url: payload.url || "/",
//       ...(payload.data || {}),
//     },
//   };
//   event.waitUntil(self.registration.showNotification(title, options));
// });

// function tabFromUrl(rawUrl) {
//   try {
//     const parsed = new URL(rawUrl, self.location.origin);
//     return parsed.searchParams.get("tab") || null;
//   } catch {
//     return null;
//   }
// }

// self.addEventListener("notificationclick", (event) => {
//   event.notification.close();
//   const targetUrl = (event.notification.data && event.notification.data.url) || "/";
//   const tab = tabFromUrl(targetUrl);

//   event.waitUntil(
//     (async () => {
//       const allClients = await self.clients.matchAll({
//         type: "window",
//         includeUncontrolled: true,
//       });
//       for (const client of allClients) {
//         try {
//           const clientUrl = new URL(client.url);
//           if (clientUrl.origin === self.location.origin) {
//             await client.focus();
//             if (tab) {
//               client.postMessage({ type: "navigate", tab });
//             }
//             return;
//           }
//         } catch {
//           /* ignore malformed urls */
//         }
//       }
//       if (self.clients.openWindow) {
//         await self.clients.openWindow(targetUrl);
//       }
//     })()
//   );
// });


/* Task Board service worker — push notifications + resilient app cache */

const CACHE = "taskboard-shell-v7";
const SHELL_ASSETS = ["/manifest.webmanifest", "/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

function isHtmlRequest(req) {
  if (req.mode === "navigate") return true;
  const accept = req.headers.get("accept") || "";
  return accept.includes("text/html");
}

async function networkFirstHtml(req) {
  const cache = await caches.open(CACHE);
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const fresh = await fetch(req, { signal: controller.signal });
    clearTimeout(timeout);

    if (fresh && fresh.ok) {
      await cache.put("/", fresh.clone());
      return fresh;
    }
    throw new Error("HTML request returned a bad response");
  } catch {
    const cached = (await cache.match(req)) || (await cache.match("/"));
    if (cached) return cached;
    return new Response("Offline", { status: 503, statusText: "Offline" });
  }
}

async function cacheFirstAsset(req) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(req);
  if (cached) {
    fetch(req)
      .then((fresh) => {
        if (fresh && fresh.ok && req.mode !== "no-cors") {
          cache.put(req, fresh.clone()).catch(() => {});
        }
      })
      .catch(() => {});
    return cached;
  }

  try {
    const fresh = await fetch(req);
    if (fresh && fresh.ok && req.mode !== "no-cors") {
      await cache.put(req, fresh.clone());
    }
    return fresh;
  } catch {
    return new Response("Offline", { status: 503, statusText: "Offline" });
  }
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  event.respondWith(isHtmlRequest(req) ? networkFirstHtml(req) : cacheFirstAsset(req));
});

function parsePushPayload(event) {
  if (!event.data) {
    return { title: "Task Board", body: "You have a new update.", url: "/" };
  }
  try {
    return event.data.json();
  } catch {
    return { title: "Task Board", body: event.data.text(), url: "/" };
  }
}

self.addEventListener("push", (event) => {
  const payload = parsePushPayload(event);
  const title = payload.title || "Task Board";
  const options = {
    body: payload.body || "",
    icon: "/icon.svg",
    badge: "/icon.svg",
    tag: payload.tag || undefined,
    renotify: !!payload.tag,
    data: {
      url: payload.url || "/",
      ...(payload.data || {}),
    },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

function tabFromUrl(rawUrl) {
  try {
    const parsed = new URL(rawUrl, self.location.origin);
    return parsed.searchParams.get("tab") || null;
  } catch {
    return null;
  }
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || "/";
  const tab = tabFromUrl(targetUrl);

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      for (const client of allClients) {
        try {
          const clientUrl = new URL(client.url);
          if (clientUrl.origin === self.location.origin) {
            await client.focus();
            if (tab) {
              client.postMessage({ type: "navigate", tab });
            }
            return;
          }
        } catch {
          /* ignore malformed urls */
        }
      }
      if (self.clients.openWindow) {
        await self.clients.openWindow(targetUrl);
      }
    })()
  );
});
