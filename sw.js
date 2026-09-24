const CACHE_NAME = 'bb-cache-v12'; // Bumped to v12
const OFFLINE_URL = '/offline.html';

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
  '/css/style.css', // This will now correctly match requests for style.css?v=2
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

  // STRATEGY 1: Cache-first for images/css
  if (url.pathname.match(/\.(png|jpg|jpeg|svg|css|woff2)$/)) {
    e.respondWith(
      // CRITICAL FIX: { ignoreSearch: true } forces it to ignore the "?v=2"
      caches.match(e.request, { ignoreSearch: true }).then((cachedResponse) => {
        return cachedResponse || fetch(e.request).then((networkResponse) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, networkResponse.clone());
            return networkResponse;
          });
        });
      })
    );
    return;
  }

  // STRATEGY 2: Network-first for pages with offline fallback
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
        
        // Match HTML pages, ignoring any stray query strings
        let cachedResponse = await cache.match(e.request, { ignoreSearch: true });
        
        if (!cachedResponse && !url.pathname.endsWith('.html') && url.pathname !== '/') {
           cachedResponse = await cache.match(url.pathname + '.html', { ignoreSearch: true });
        }

        if (!cachedResponse && url.pathname.endsWith('/')) {
            const strippedPath = url.pathname.slice(0, -1);
            cachedResponse = await cache.match(strippedPath + '.html', { ignoreSearch: true });
        }
        
        if (cachedResponse) {
          return cachedResponse;
        }

        if (e.request.mode === 'navigate' || (e.request.headers.get('accept') && e.request.headers.get('accept').includes('text/html'))) {
          return cache.match(OFFLINE_URL, { ignoreSearch: true });
        }
      })
  );
});