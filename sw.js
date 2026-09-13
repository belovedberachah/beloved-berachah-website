const CACHE_NAME = 'bb-cache-v6';

self.addEventListener('install', (e) => {
  self.skipWaiting(); // Force the waiting service worker to become the active service worker
});

self.addEventListener('activate', (e) => {
  // Completely wipe all old caches when v4 activates
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// NETWORK FIRST STRATEGY
// Always try to get the live page from GitHub. If offline, fallback to cache.
self.addEventListener('fetch', (e) => {
  e.respondWith(
    fetch(e.request)
      .then((networkResponse) => {
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(e.request, networkResponse.clone());
          return networkResponse;
        });
      })
      .catch(() => {
        return caches.match(e.request);
      })
  );
});
