/**
 * PWA Service Worker
 * Handles offline functionality, push notifications, and caching
 */

const CACHE_VERSION = 'evoucher-v' + Date.now(); // Auto-increment on each deploy
const CACHE_ASSETS = [
  '/',
  '/shop',
  '/manifest.json',
  '/offline.html',
];

// Install service worker and take control immediately
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      return cache.addAll(CACHE_ASSETS);
    }).then(() => self.skipWaiting()) // Take control immediately
  );
});

// Activate service worker and claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_VERSION) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Take control of all pages immediately
  );
});

// Fetch strategy: Network first, fallback to cache
// Only cache GET requests — POST and other methods are not supported by the Cache API
self.addEventListener('fetch', (event) => {
  // Never intercept non-GET requests (POST, PUT, DELETE, etc.)
  // This prevents "POST not supported in Cache API" errors and ensures
  // payment requests always reach the server on Chrome, Firefox, and Edge.
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip caching API routes — always fetch fresh from network
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Only cache successful same-origin GET responses
        if (response.ok && response.type !== 'opaque') {
          const responseClone = response.clone();
          caches.open(CACHE_VERSION).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          return cachedResponse || caches.match('/offline.html');
        });
      })
  );
});

// Push notification handler
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  const options = {
    body: data.body || 'New notification from eVoucher',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/',
    },
  };

  event.waitUntil(self.registration.showNotification(data.title || 'eVoucher', options));
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url));
});
