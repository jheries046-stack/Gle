const CACHE_NAME = 'gle-shell-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/product.html',
  '/order.html',
  '/reviews.html',
  '/faq.html',
  '/contact.html',
  '/styles/style.css',
  '/scripts/script.js',
  '/images/logo.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  // Network-first for API paths
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/orders') || url.pathname.startsWith('/reviews')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-first for navigation and static assets
  event.respondWith(
    caches.match(event.request).then(resp => resp || fetch(event.request).then(fetchResp => {
      return caches.open(CACHE_NAME).then(cache => {
        try { cache.put(event.request, fetchResp.clone()); } catch (e) { /* ignore put errors */ }
        return fetchResp;
      });
    })).catch(() => caches.match('/'))
  );
});
