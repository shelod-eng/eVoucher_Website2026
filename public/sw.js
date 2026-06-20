/* eslint-disable */
/* ==========================================================================
   eVoucher PWA Service Worker v3
   - Network-first for navigation (private pages never cached)
   - Cache-first for static assets (images, fonts, JS, CSS)
   - Never cache authenticated/private routes
   - Automatic cache cleanup on activate
   - Update notification via postMessage
   ========================================================================== */

const CACHE_NAME = 'evoucher-pwa-v3';
const STATIC_CACHE = 'evoucher-static-v3';

/** Pages that should NEVER be served from cache (auth required or private data).
 *  CRITICAL: If a page requires authentication or contains user-specific data,
 *  it MUST be listed here. Failure to do so means one user's session data
 *  can be served to another user from cache — a POPIA / compliance violation.
 */
const PRIVATE_PATHS = [
  '/customer/',
  '/merchant/',
  '/portal/',
  '/profile',
  '/profile/',
  '/wallet',
  '/wallet/',
  '/cart',
  '/cart/',
  '/checkout',
  '/checkout/',
  '/api/',
  '/signin',
  '/signin/',
  '/signup',
  '/signup/',
  '/consumer',
  '/consumer/',
  '/consumer-experience',
  '/consumer-experience/',
  '/buy-vouchers',
  '/buy-vouchers/',
  '/benefits',
  '/benefits/',
  '/rewards',
  '/rewards/',
  '/redeem',
  '/redeem/',
  '/shop',
  '/shop/',
  '/analytics',
  '/analytics/',
  '/reset-password',
  '/reset-password/',
];

/* ---- Install: pre-cache minimal shell ---- */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      cache.addAll([
        '/',
        '/index.html',
        '/offline',
        '/manifest.json',
        '/icons/icon-192x192.png',
        '/icons/icon-512x512.png',
      ])
    ).catch(() => {
      // Non-critical; app works without precache
    })
  );
  // Activate immediately without waiting for page reloads
  self.skipWaiting();
});

/* ---- Activate: clean old caches, claim clients ---- */
self.addEventListener('activate', (event) => {
  const expectedCaches = [CACHE_NAME, STATIC_CACHE];
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => !expectedCaches.includes(key))
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

/* ---- Fetch: decide caching strategy per request ---- */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return;

  const path = url.pathname;

  // ---- Private/authenticated paths: network-only, never cache ----
  if (PRIVATE_PATHS.some((p) => path.startsWith(p) || path === p)) {
    // No event.respondWith — let the browser handle it naturally.
    // This ensures Cache-Control: private, no-store headers are respected
    // and no user-specific data is ever served from cache.
    return;
  }

  // ---- Static assets (images, fonts, JS, CSS): cache-first ----
  if (
    path.startsWith('/assets/') ||
    path.startsWith('/_next/static/') ||
    path.match(/\.(css|js|png|jpg|jpeg|gif|svg|ico|webp|woff2?|ttf|eot)$/i)
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request).then((response) => {
          if (response && response.ok && response.status < 400) {
            const copy = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        }).catch(() => cached);
        return cached || fetchPromise;
      })
    );
    return;
  }

  // ---- Navigation & other same-origin pages: network-first ----
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Only cache successful, non-private responses
        if (response && response.ok && response.status < 400) {
          const contentType = response.headers.get('Content-Type') || '';
          // Only cache HTML pages (not API responses that slip through)
          if (contentType.includes('text/html')) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
        }
        return response;
      })
      .catch(() => {
        // Offline: try the cache, fall back to /
        return caches.match(request).then(
          (cached) => cached || caches.match('/')
        );
      })
  );
});

/* ---- Message handler: skip-waiting for update prompt ---- */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
