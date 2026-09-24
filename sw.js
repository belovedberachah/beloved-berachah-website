const CACHE_NAME = 'bb-cache-v15';
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
  // Ignore non-GET requests (like form submissions)
  if (e.request.method !== 'GET') return;

  e.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);

    try {
      // 1. Always try to get the file from the internet first
      const networkResponse = await fetch(e.request);
      cache.put(e.request, networkResponse.clone());
      return networkResponse;
    } catch (error) {
      // 2. THE INTERNET IS DOWN - start checking the cache
      
      // Check for the exact file requested
      let cachedResponse = await cache.match(e.request, { ignoreSearch: true });
      if (cachedResponse) return cachedResponse;

      // Check Netlify pretty URL (add .html to the end)
      const url = new URL(e.request.url);
      if (!url.pathname.endsWith('.html')) {
        cachedResponse = await cache.match(url.pathname + '.html', { ignoreSearch: true });
        if (cachedResponse) return cachedResponse;
      }

      // 3. ULTIMATE FALLBACK: Serve offline.html for any failed web page navigation
      if (e.request.mode === 'navigate' || (e.request.headers.get('accept') && e.request.headers.get('accept').includes('text/html'))) {
        const offlineResponse = await cache.match(OFFLINE_URL, { ignoreSearch: true });
        
        if (offlineResponse) {
          // We found offline.html! Serve it.
          return offlineResponse;
        } else {
          // If offline.html is mysteriously missing from the cache, dynamically generate a page so it NEVER crashes!
          return new Response(
            '<html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Offline | Beloved Berachah</title></head><body style="padding:40px 20px; font-family:sans-serif; background-color:#fafaf9; color:#334155; text-align:center;"><h2>You are offline.</h2><p>Please reconnect to the internet to view this page.</p></body></html>',
            { headers: { 'Content-Type': 'text/html' } }
          );
        }
      }

      // If it's just a missing image file, let it fail quietly
      return Response.error();
    }
  })());
});