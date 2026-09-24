const CACHE_NAME = 'bb-cache-v9'; // Bumped to v9 to force the new update!
const OFFLINE_URL = './offline.html';

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
  './offline.html', // Added offline fallback page
  './css/style.css',
  './assets/images/BB.png',
  './assets/images/bb-icon-512.png', // Added the new shortcut/iOS icon
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
  // Only wipe OLD caches, keep the current v9 cache active
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

  // STRATEGY 2: Network-First for HTML (Content Freshness) + Offline Fallback
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
        // Network failed (offline). Let's see if we have this specific page saved.
        return caches.match(e.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse; // We have it! Serve the cached page.
          }
          
          // THE ULTIMATE FALLBACK:
          // If the page is NOT in the cache, and the user is trying to navigate to a webpage,
          // serve the dedicated offline emergency page instead of the browser dinosaur.
          if (e.request.mode === 'navigate' || (e.request.headers.get('accept') && e.request.headers.get('accept').includes('text/html'))) {
            return caches.match(OFFLINE_URL);
          }
        });
      })
  );
});