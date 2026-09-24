const CACHE_NAME = 'bb-cache-v10'; // Bumped to v10!
const OFFLINE_URL = '/offline.html';

// 1. Core assets (Use absolute paths starting with '/')
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/about.html',
  '/news.html',
  '/services.html',
  '/events.html',
  '/resources.html',
  '/contact.html',
  '/donate.html',
  '/terms.html',
  '/privacy.html',
  '/cookies.html',
  '/safeguarding.html',
  '/offline.html',
  '/css/style.css',
  '/assets/images/BB.png',
  '/assets/images/bb-icon-512.png',
  '/manifest.json'
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
});

self.addEventListener('activate', (e) => {
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
  if (e.request.method !== 'GET' || !e.request.url.startsWith('http')) return;

  const url = new URL(e.request.url);

  // STRATEGY 1: Cache-first for images and styles
  if (url.pathname.match(/\.(png|jpg|jpeg|svg|css|woff2)$/)) {
    e.respondWith(
      caches.match(e.request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
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

  // STRATEGY 2: Network-first for pages with Netlify Pretty URL fix
  e.respondWith(
    fetch(e.request)
      .then((networkResponse) => {
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(e.request, networkResponse.clone());
          return networkResponse;
        });
      })
      .catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        
        // 1. Try to find the exact URL in the cache
        let cachedResponse = await cache.match(e.request);
        
        // 2. Netlify Fix: If "/about" fails, manually try appending ".html" to check the cache
        if (!cachedResponse && !url.pathname.endsWith('.html')) {
          cachedResponse = await cache.match(url.pathname + '.html');
        }
        
        if (cachedResponse) {
          return cachedResponse;
        }

        // 3. The Ultimate Fallback: Serve offline.html
        if (e.request.mode === 'navigate' || (e.request.headers.get('accept') && e.request.headers.get('accept').includes('text/html'))) {
          return cache.match(OFFLINE_URL);
        }
      })
  );
});