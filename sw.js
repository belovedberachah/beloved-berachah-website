const CACHE_NAME = 'bb-cache-v14'; 
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
  // Ignore non-GET requests (like form submissions)
  if (e.request.method !== 'GET' || !e.request.url.startsWith('http')) return;

  const url = new URL(e.request.url);

  // STRATEGY 1: Cache-First for static assets (Images, CSS)
  if (url.pathname.match(/\.(png|jpg|jpeg|svg|css|woff2)$/)) {
    e.respondWith(
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

  // STRATEGY 2: Network-First for HTML, with chained offline fallback
  e.respondWith(
    fetch(e.request)
      .then((networkResponse) => {
        // If internet works, save a fresh copy and return it
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(e.request, networkResponse.clone());
          return networkResponse;
        });
      })
      .catch(() => {
        // If internet fails, gracefully check the cache without async/await
        return caches.open(CACHE_NAME).then((cache) => {
          return cache.match(e.request, { ignoreSearch: true }).then((cachedResponse) => {
            
            // 1. Return exact match if found
            if (cachedResponse) return cachedResponse;

            // 2. Netlify Pretty URL check (append .html)
            if (!url.pathname.endsWith('.html') && url.pathname !== '/') {
              return cache.match(url.pathname + '.html', { ignoreSearch: true }).then((prettyResponse) => {
                if (prettyResponse) return prettyResponse;
                
                // Ultimate Fallback if pretty URL fails
                if (e.request.mode === 'navigate' || (e.request.headers.get('accept') && e.request.headers.get('accept').includes('text/html'))) {
                  return cache.match(OFFLINE_URL, { ignoreSearch: true });
                }
              });
            }

            // 3. Ultimate Fallback for everything else
            if (e.request.mode === 'navigate' || (e.request.headers.get('accept') && e.request.headers.get('accept').includes('text/html'))) {
              return cache.match(OFFLINE_URL, { ignoreSearch: true });
            }
          });
        });
      })
  );
});