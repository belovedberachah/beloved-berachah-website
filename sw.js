// =========================================================================
// BELOVED BERACHAH CIC - SERVICE WORKER (PWA)
// =========================================================================
const CACHE_NAME = 'bb-cache-v18'; 
const OFFLINE_URL = '/offline.html';

// Core assets to precache for instant offline availability
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

// 1. INSTALL EVENT: Precache critical files
self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Cache files individually. If an optional asset is missing, 
      // it skips it gracefully instead of failing the entire service worker installation.
      return Promise.all(
        PRECACHE_ASSETS.map(url => {
          return fetch(url).then(response => {
            if (response.ok) {
              return cache.put(url, response);
            }
          }).catch(error => {
            console.log('Skipping caching for file:', url);
          });
        })
      );
    })
  );
});

// 2. ACTIVATE EVENT: Clean up outdated cache versions
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

// 3. FETCH EVENT: Intelligent routing strategies for assets vs. pages
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);

  // Strategy A - ASSETS: Cache-First for instant loading performance
  if (url.pathname.match(/\.(png|jpg|jpeg|svg|css|woff2)$/)) {
    e.respondWith(
      caches.match(e.request, { ignoreSearch: true }).then((cached) => cached || fetch(e.request))
    );
    return;
  }

  // Strategy B - HTML PAGES: Network-First with offline fallback routing
  if (e.request.mode === 'navigate' || (e.request.headers.get('accept') && e.request.headers.get('accept').includes('text/html'))) {
    e.respondWith(
      fetch(e.request)
        .then((networkResponse) => {
           const cacheCopy = networkResponse.clone();
           caches.open(CACHE_NAME).then((cache) => cache.put(e.request, cacheCopy));
           return networkResponse;
        })
        .catch(() => {
           // Offline fallback logic
           return caches.match(e.request, { ignoreSearch: true }).then((cached) => {
              if (cached) return cached;
              
              // Netlify Pretty URL check
              return caches.match(url.pathname + '.html', { ignoreSearch: true }).then((pretty) => {
                 if (pretty) return pretty;
                 
                 // Fallback to the emergency offline page
                 return caches.match(OFFLINE_URL, { ignoreSearch: true });
              });
           });
        })
    );
  }
});