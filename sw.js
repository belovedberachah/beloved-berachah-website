const CACHE_NAME = 'bb-cache-v8'; // Bumped to v8 to force update

// 1. Core assets to cache immediately when the PWA is installed
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './about.html',
  './news.html',
  './services.html',
  './events.html',
  './resources.html',
  './contact.html',
  './donate.html',
  './terms.html',
  './privacy.html',
  './cookies.html',
  './safeguarding.html',
  './css/style.css',
  './assets/images/BB.png',
  './manifest.json'
];

self.addEventListener('install', (e) => {
  self.skipWaiting(); // Force the waiting service worker to become the active service worker
  
  // Pre-cache all essential files so the app works offline instantly
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
});

self.addEventListener('activate', (e) => {
  // Only wipe OLD caches, keep the current v8 cache active
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // CRITICAL FIX: Do not intercept POST requests (forms) or browser extension traffic
  if (e.request.method !== 'GET' || !e.request.url.startsWith('http')) {
    return;
  }

  const url = new URL(e.request.url);

  // STRATEGY 1: Cache-First for Static Assets (Speed & Performance)
  // Images, CSS, and Fonts rarely change. Load them instantly from the cache.
  if (url.pathname.match(/\.(png|jpg|jpeg|svg|css|woff2)$/)) {
    e.respondWith(
      caches.match(e.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse; // Return instant cached version
        }
        // If not in cache, fetch from network and save it for next time
        return fetch(e.request).then((networkResponse) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, networkResponse.clone());
            return networkResponse;
          });
        });
      })
    );
    return;
  }

  // STRATEGY 2: Network-First for HTML (Content Freshness)
  // Always try to get the newest text/content from the web. If offline, use cache.
  e.respondWith(
    fetch(e.request)
      .then((networkResponse) => {
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(e.request, networkResponse.clone());
          return networkResponse;
        });
      })
      .catch(() => {
        // Network failed (offline), return the pre-cached HTML page
        return caches.match(e.request);
      })
  );
});