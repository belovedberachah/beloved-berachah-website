const CACHE_NAME = 'bb-cache-v16'; 
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
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
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

  // 1. ASSETS: Cache-First for images and CSS (Instant loading)
  if (url.pathname.match(/\.(png|jpg|jpeg|svg|css|woff2)$/)) {
    e.respondWith(
      caches.match(e.request, { ignoreSearch: true }).then((cachedResponse) => {
        return cachedResponse || fetch(e.request);
      })
    );
    return;
  }

  // 2. HTML PAGES: Network-First with Brute-Force Offline Fallback
  e.respondWith(
    fetch(e.request)
      .then((networkResponse) => {
         // Internet is working! Save a fresh copy and return it.
         return caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, networkResponse.clone());
            return networkResponse;
         });
      })
      .catch(() => {
         // THE INTERNET IS DOWN.
         return caches.open(CACHE_NAME).then((cache) => {
            
            // Check 1: Do we have the exact URL saved?
            return cache.match(e.request, { ignoreSearch: true }).then((cached) => {
               if (cached) return cached;
               
               // Check 2: Do we have the .html version saved? (Netlify Pretty URLs)
               return cache.match(url.pathname + '.html', { ignoreSearch: true }).then((pretty) => {
                  if (pretty) return pretty;

                  // Check 3: We don't have it. Serve the Emergency Offline Page!
                  return cache.match(OFFLINE_URL).then((offline) => {
                     if (offline) return offline;
                     
                     // The indestructible failsafe (in case offline.html itself is missing)
                     return new Response(
                       '<html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Offline</title></head><body style="padding:40px 20px; font-family:sans-serif; text-align:center;"><h2>You are offline.</h2><p>Please reconnect to the internet.</p></body></html>',
                       { headers: { 'Content-Type': 'text/html' } }
                     );
                  });
               });
            });
         });
      })
  );
});