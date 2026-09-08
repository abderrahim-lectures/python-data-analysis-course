// Service worker: versioned, network-first shell.
// - Navigations (HTML) are network-first: fresh course content always wins
//   over the cache; the cached page is only a fallback when offline.
// - Same-origin assets are stale-while-revalidate (hashed _astro/ files are
//   immutable, but a revalidation keeps the shell in sync).
// - Cross-origin requests (Pyodide from the jsDelivr CDN) are never touched:
//   opaque responses have no cacheable content.
// Bump the cache name below when you want to force a clean re-precache.

const CACHE_NAME = 'pda-2026-09-08';
const PRECACHE_URLS = ['/', '/learn', '/playground', '/progress', '/projects'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('/')))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const update = fetch(request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      });
      return cached || update;
    })
  );
});