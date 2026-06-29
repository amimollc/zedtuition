// ============================================================
// Zed Tuition - Service Worker with full offline support
// Version: v4.0.0
// ============================================================

importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');

const CACHE_NAME = 'zed-tuition-v4';
const OFFLINE_PAGE = '/zedtuition/offline.html';

// Static assets to cache on install
const STATIC_ASSETS = [
  '/zedtuition/',
  '/zedtuition/index.html',
  '/zedtuition/offline.html',
  '/zedtuition/grade10-12.html',
  '/zedtuition/form1-2.html',
  '/zedtuition/primary.html',
  '/zedtuition/viewer.html',
  '/zedtuition/about.html',
  '/zedtuition/searchresult.html',
  '/zedtuition/style.css',
  '/zedtuition/main.js',
  '/zedtuition/fullscreen.js',
  '/zedtuition/favicon.png',
  '/zedtuition/icon-72.png',
  '/zedtuition/icon-96.png',
  '/zedtuition/icon-128.png',
  '/zedtuition/icon-144.png',
  '/zedtuition/icon-152.png',
  '/zedtuition/icon-192.png',
  '/zedtuition/icon-384.png',
  '/zedtuition/icon-512.png'
];

// ─── Install: cache static assets ───
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// ─── Activate: clean old caches ───
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// ─── Use Workbox for navigation preload and routing ───
if (workbox.navigationPreload.isSupported()) {
  workbox.navigationPreload.enable();
}

// Stale-while-revalidate for all same-origin requests
workbox.routing.registerRoute(
  ({ request, url }) => request.destination === 'document' ||
                        request.destination === 'script' ||
                        request.destination === 'style' ||
                        request.destination === 'image',
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: CACHE_NAME,
    plugins: [
      {
        cacheWillUpdate: async ({ response }) => {
          if (response && response.status === 200) {
            return response;
          }
          return null;
        }
      }
    ]
  })
);

// ─── Custom fetch handler for navigation (pages) ───
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Skip non-GET and external requests we don't control
  if (request.method !== 'GET') return;
  if (url.origin !== self.location.origin) {
    // Allow external origins defined in scope_extensions (Drive, YouTube, CDN)
    // We'll let them go through, but we can cache them dynamically if needed.
    return;
  }

  // Navigation requests (HTML pages)
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          // Try network first, with preload if available
          const preloadResp = await event.preloadResponse;
          if (preloadResp) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, preloadResp.clone());
            return preloadResp;
          }

          const networkResp = await fetch(request);
          if (networkResp && networkResp.status === 200) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResp.clone());
            return networkResp;
          }
          throw new Error('Network response not ok');
        } catch (error) {
          // Fallback to offline page
          const cache = await caches.open(CACHE_NAME);
          const offlineResp = await cache.match(OFFLINE_PAGE);
          return offlineResp || new Response('Offline', { status: 503 });
        }
      })()
    );
    return;
  }

  // For all other same-origin requests, use Workbox's StaleWhileRevalidate
  // which we already registered. But we need to respond with it.
  // Workbox already handles it if we don't call event.respondWith here.
  // So we do nothing – Workbox will handle it.
});

// ─── Background sync ───
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-queue') {
    event.waitUntil(processSyncQueue());
  }
});

async function processSyncQueue() {
  // Implement your sync logic here if needed
}

// ─── Push notifications ───
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const options = {
    body: data.body || 'New content available!',
    icon: '/zedtuition/favicon.png',
    badge: '/zedtuition/favicon.png',
    vibrate: [200, 100, 200],
    data: { url: data.url || '/zedtuition/' }
  };
  event.waitUntil(
    self.registration.showNotification('Zed Tuition', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/zedtuition/')
  );
});

console.log('[SW] Zed Tuition Service Worker loaded');