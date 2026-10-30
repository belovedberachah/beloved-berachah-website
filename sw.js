// =========================================================================
// BELOVED BERACHAH CIC - SERVICE WORKER (PWA)
// =========================================================================
// Bump CACHE_NAME whenever this file, the precache list, or any cache-first
// asset (CSS, PNG, JPG, SVG, WOFF2) changes. .avif images are not cached.
const CACHE_NAME = 'bb-cache-v20';
const OFFLINE_URL = '/offline/';

// Precache clean URLs, which match how Netlify serves the pages.
const PRECACHE_ASSETS = [
  '/',
  '/about/',
  '/news/',
  '/services/',
  '/events/',
  '/resources/',
  '/contact/',
  '/donate/',
  '/terms/',
  '/privacy/',
  '/cookies/',
  '/safeguarding/',
  OFFLINE_URL,
  '/css/style.css',
  '/assets/images/BB.png',
  '/assets/images/bb-icon-512.png',
  '/manifest.json'
];

// 1. INSTALL: precache each file. A missing file is skipped, not fatal.
self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.all(
        PRECACHE_ASSETS.map((url) =>
          fetch(url)
            .then((response) => {
              if (response.ok) return cache.put(url, response);
            })
            .catch(() => console.log('Skipping caching for file:', url))
        )
      )
    )
  );
});

// 2. ACTIVATE: delete caches from older versions, then take control of open pages.
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

// 3. FETCH
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);

  // Strategy A - ASSETS: cache-first
  if (/\.(png|jpg|jpeg|svg|css|woff2)$/.test(url.pathname)) {
    e.respondWith(
      caches.match(e.request, { ignoreSearch: true }).then((cached) => cached || fetch(e.request))
    );
    return;
  }

  // Strategy B - PAGES: network-first, then the cached copy, then the offline page
  const wantsHtml = e.request.mode === 'navigate' ||
    (e.request.headers.get('accept') || '').includes('text/html');

  if (wantsHtml) {
    e.respondWith(
      fetch(e.request)
        .then((networkResponse) => {
          const copy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, copy));
          return networkResponse;
        })
        .catch(() =>
          caches.match(e.request, { ignoreSearch: true })
            .then((cached) => cached || caches.match(OFFLINE_URL, { ignoreSearch: true }))
        )
    );
  }
});