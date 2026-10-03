// Service worker for 180° Count-Up.
//
// Strategy (per request type):
//   - Navigations / HTML  → network-first, cache fallback (offline only).
//     The HTML is the only non-hashed entry point: if it is served stale it
//     references bundle hashes that no longer exist on the CDN → white screen.
//   - /assets/* (Vite)     → cache-first. Filenames are content-hashed and
//     immutable, so a hit is always correct.
//   - Everything else same-origin (icons, manifest) → stale-while-revalidate.
//   - Cross-origin (GTM, fonts) → not intercepted.
//
// Bump CACHE whenever the caching logic changes. The activate handler drops
// every other cache and reloads any open tab so users stuck on a broken
// cached shell recover without clearing site data.
const CACHE = "dardos-v2";
const PRECACHE = ["/manifest.json", "/favicon.svg", "/icon-192.svg", "/icon-512.svg"];
const OFFLINE_SHELL = "/index.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  const cleanup = (async () => {
    const keys = await caches.keys();
    const stale = keys.filter((k) => k !== CACHE);
    await Promise.all(stale.map((k) => caches.delete(k)));
    await self.clients.claim();
    return stale.length;
  })();
  event.waitUntil(cleanup);

  // Upgrade path: tabs controlled by the previous worker may be showing a
  // stale shell whose bundle 404'd. Reload them once so they pick up fresh
  // HTML. On a first install there is nothing stale, so skip.
  // Deliberately NOT awaited inside waitUntil: fetch events are held until
  // activation finishes, and navigate() needs one, so awaiting it here would
  // deadlock the worker.
  cleanup
    .then(async (staleCount) => {
      if (staleCount === 0) return;
      const clients = await self.clients.matchAll({ type: "window" });
      for (const client of clients) {
        if ("navigate" in client) client.navigate(client.url).catch(() => {});
      }
    })
    .catch(() => {});
});

const isNavigation = (request) =>
  request.mode === "navigate" ||
  request.destination === "document" ||
  (request.headers.get("accept") || "").includes("text/html");

const cacheable = (response) => response && response.status === 200 && response.type === "basic";

async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  try {
    const response = await fetch(request);
    if (cacheable(response)) {
      // Store under a stable key so any deep link can fall back to the shell.
      cache.put(OFFLINE_SHELL, response.clone());
    }
    return response;
  } catch {
    const cached = (await cache.match(request)) || (await cache.match(OFFLINE_SHELL));
    return cached || Response.error();
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (cacheable(response)) cache.put(request, response.clone());
  return response;
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (cacheable(response)) cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached);
  return cached || network;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (isNavigation(request)) {
    event.respondWith(networkFirst(request));
    return;
  }
  if (url.pathname.startsWith("/assets/")) {
    event.respondWith(cacheFirst(request));
    return;
  }
  event.respondWith(staleWhileRevalidate(request));
});
