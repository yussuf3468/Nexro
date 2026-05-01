/**
 * Nexro Service Worker — v1
 *
 * Strategy:
 *  - App shell (/, /upload, /offline, manifest, fonts) → Cache-first, fallback network
 *  - API routes (/api/*) → Network-only (never cache encrypted data)
 *  - Static assets (/_next/static/*, /icons/*) → Cache-first
 *  - Navigation requests → Network-first, fallback /offline
 */

const CACHE_NAME = "nexro-v1";
const STATIC_CACHE_NAME = "nexro-static-v1";

/** Pages to pre-cache on install */
const APP_SHELL = ["/", "/upload", "/offline", "/manifest.json"];

/** Paths that must NEVER be cached */
const NEVER_CACHE_PATTERNS = [/^\/api\//];

// ── Install ──────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  );
});

// ── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== CACHE_NAME && k !== STATIC_CACHE_NAME)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return;

  // Never cache API routes — network-only
  if (NEVER_CACHE_PATTERNS.some((re) => re.test(url.pathname))) {
    return; // Let browser handle normally
  }

  // Static Next.js assets → cache-first
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/")
  ) {
    event.respondWith(cacheFirst(request, STATIC_CACHE_NAME));
    return;
  }

  // HTML navigation → network-first, fallback /offline
  if (request.mode === "navigate") {
    event.respondWith(networkFirstNavigate(request));
    return;
  }

  // Everything else → stale-while-revalidate
  event.respondWith(staleWhileRevalidate(request, CACHE_NAME));
});

// ── Strategies ────────────────────────────────────────────────────────────────

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("Offline", { status: 503 });
  }
}

async function networkFirstNavigate(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    const offline = await caches.match("/offline");
    return offline ?? new Response("Offline", { status: 503 });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const networkFetch = fetch(request).then((response) => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  });

  return cached ?? networkFetch;
}
