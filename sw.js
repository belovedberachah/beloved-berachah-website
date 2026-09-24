const CACHE_NAME = 'bb-cache-v11';
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
  if (e.request.method !== 'GET' || !e.request.url.startsWith('http')) return;

  const url = new URL(e.request.url);

  // Cache-first for images/css
  if (url.pathname.match(/\.(png|jpg|jpeg|svg|css|woff2)$/)) {
    e.respondWith(
      caches.match(e.request).then((cachedResponse) => {
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

  // Network-first for pages with offline fallback
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
        
        // 1. Try exact match
        let cachedResponse = await cache.match(e.request);
        
        // 2. Try Netlify pretty URL match (e.g., /about -> /about.html)
        if (!cachedResponse && !url.pathname.endsWith('.html') && url.pathname !== '/') {
           // We explicitly add .html to the end of the pathname
           cachedResponse = await cache.match(url.pathname + '.html');
        }

        // 3. Try stripping the trailing slash if it exists (e.g., /about/ -> /about.html)
        if (!cachedResponse && url.pathname.endsWith('/')) {
            const strippedPath = url.pathname.slice(0, -1);
            cachedResponse = await cache.match(strippedPath + '.html');
        }
        
        if (cachedResponse) {
          return cachedResponse;
        }

        // 4. Return offline page if it's a navigation request
        if (e.request.mode === 'navigate' || (e.request.headers.get('accept') && e.request.headers.get('accept').includes('text/html'))) {
          return cache.match(OFFLINE_URL);
        }
      })
  );
});