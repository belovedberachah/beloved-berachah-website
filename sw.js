const CACHE_NAME = 'bb-cache-v17'; 
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
      // CRITICAL FIX: Cache files individually. 
      // If a file like 'donate.html' doesn't exist yet, it skips it instead of crashing the whole app.
      return Promise.all(
        PRECACHE_ASSETS.map(url => {
          return fetch(url).then(response => {
            if (response.ok) {
              return cache.put(url, response);
            }
          }).catch(error => {
            console.log('Skipping caching for missing file:', url);
          });
        })
      );
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
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);

  // 1. ASSETS: Cache-First for instant loading
  if (url.pathname.match(/\.(png|jpg|jpeg|svg|css|woff2)$/)) {
    e.respondWith(
      caches.match(e.request, { ignoreSearch: true }).then((cached) => cached || fetch(e.request))
    );
    return;
  }

  // 2. HTML PAGES: Network-First with dedicated Offline Navigation routing
  if (e.request.mode === 'navigate' || (e.request.headers.get('accept') && e.request.headers.get('accept').includes('text/html'))) {
    e.respondWith(
      fetch(e.request)
        .then((networkResponse) => {
           const cacheCopy = networkResponse.clone();
           caches.open(CACHE_NAME).then((cache) => cache.put(e.request, cacheCopy));
           return networkResponse;
        })
        .catch(() => {
           // The internet is disconnected.
           return caches.match(e.request, { ignoreSearch: true }).then((cached) => {
              if (cached) return cached;
              
              // Netlify Pretty URL check
              return caches.match(url.pathname + '.html', { ignoreSearch: true }).then((pretty) => {
                 if (pretty) return pretty;
                 
                 // Finally, serve the emergency offline page
                 return caches.match(OFFLINE_URL, { ignoreSearch: true });
              });
           });
        })
    );
  }
});