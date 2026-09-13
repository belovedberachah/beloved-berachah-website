const CACHE_NAME = 'bb-cache-v7';

self.addEventListener('install', (e) => {
  self.skipWaiting(); // Force the waiting service worker to become the active service worker
});

self.addEventListener('activate', (e) => {
  // Only wipe OLD caches, keep the current v7 cache active
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// NETWORK FIRST STRATEGY
self.addEventListener('fetch', (e) => {
  // CRITICAL FIX: Do not intercept POST requests (forms) or browser extension traffic
  if (e.request.method !== 'GET' || !e.request.url.startsWith('http')) {
    return;
  }

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