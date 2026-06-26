// ============================================================
// Zed Tuition - Full Service Worker
// Version: v2.0.0
// ============================================================

const CACHE_VERSION = 'zed-tuition-v2.0.0';
const CACHE_NAME = CACHE_VERSION;

// ─── Core Assets to cache on install ───
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/grade10-12.html',
  '/form1-2.html',
  '/primary.html',
  '/viewer.html',
  '/about.html',
  '/searchresult.html',
  '/offline.html',
  '/style.css',
  '/main.js',
  '/favicon.png',
  // Font Awesome (CSS + Fonts)
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/webfonts/fa-solid-900.woff2',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/webfonts/fa-brands-400.woff2',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/webfonts/fa-regular-400.woff2'
];

// ─── Dynamic assets to cache on demand ───
const DYNAMIC_CACHE = 'zed-tuition-dynamic-v1';

// ─── Install Event ───
self.addEventListener('install', event => {
  console.log('[SW] Installing Service Worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching static assets...');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] All assets cached, skipping waiting...');
        return self.skipWaiting();
      })
      .catch(err => {
        console.error('[SW] Installation failed:', err);
      })
  );
});

// ─── Activate Event ───
self.addEventListener('activate', event => {
  console.log('[SW] Activating Service Worker...');
  
  event.waitUntil(
    caches.keys()
      .then(keys => {
        return Promise.all(
          keys.filter(key => {
            return key !== CACHE_NAME && key !== DYNAMIC_CACHE;
          }).map(key => {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          })
        );
      })
      .then(() => {
        console.log('[SW] Claiming clients...');
        return self.clients.claim();
      })
      .then(() => {
        console.log('[SW] Ready to handle requests.');
      })
  );
});

// ─── Fetch Event ───
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);

  // ── Skip non-GET requests ──
  if (request.method !== 'GET') {
    event.respondWith(fetch(request));
    return;
  }

  // ── Skip chrome-extension and other non-web requests ──
  if (url.protocol === 'chrome-extension:' || url.protocol === 'file:') {
    event.respondWith(fetch(request));
    return;
  }

  // ── Handle Google Drive document embeds ──
  if (url.hostname === 'drive.google.com' && url.pathname.includes('/file/d/')) {
    event.respondWith(handleDriveRequest(request));
    return;
  }

  // ── Handle YouTube embeds ──
  if (url.hostname === 'www.youtube.com' || url.hostname === 'youtube.com' || url.hostname === 'youtu.be') {
    event.respondWith(handleYouTubeRequest(request));
    return;
  }

  // ── Handle Google Drive thumbnails ──
  if (url.hostname === 'drive.google.com' && url.pathname.includes('/thumbnail')) {
    event.respondWith(handleThumbnailRequest(request));
    return;
  }

  // ── Regular requests: Cache-first strategy ──
  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {
        // Return cached response if available
        if (cachedResponse) {
          return cachedResponse;
        }

        // Otherwise fetch from network
        return fetch(request)
          .then(networkResponse => {
            // Only cache successful responses
            if (!networkResponse || networkResponse.status !== 200) {
              return networkResponse;
            }

            // Clone the response
            const responseClone = networkResponse.clone();

            // Cache the response (only for same-origin or specific CDNs)
            if (request.url.startsWith(self.location.origin) ||
                request.url.includes('cdnjs.cloudflare.com') ||
                request.url.includes('fonts.googleapis.com')) {
              caches.open(DYNAMIC_CACHE)
                .then(cache => {
                  cache.put(request, responseClone);
                })
                .catch(err => {
                  console.warn('[SW] Failed to cache:', request.url, err);
                });
            }

            return networkResponse;
          })
          .catch(err => {
            console.warn('[SW] Network request failed:', request.url, err);
            // Fallback for HTML pages
            if (request.headers.get('accept').includes('text/html')) {
              return caches.match('/offline.html');
            }
            // Return a simple fallback for images
            if (request.url.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i)) {
              return new Response(
                '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#1a1d2b"/><text x="50%" y="50%" font-family="sans-serif" font-size="14" fill="#7c5cff" text-anchor="middle" dy=".3em">Image unavailable</text></svg>',
                { headers: { 'Content-Type': 'image/svg+xml' } }
              );
            }
            return new Response('Network error', { status: 503 });
          });
      })
  );
});

// ─── Google Drive Document Handler ───
async function handleDriveRequest(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    console.warn('[SW] Drive request failed:', err);
    // Return offline message for drive embeds
    return new Response(
      '<html><body style="background:#0f0f0f;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;"><div style="text-align:center;"><h2 style="color:#7c5cff;">📄 Offline</h2><p>This document is not available offline.<br>Please connect to the internet to view it.</p></div></body></html>',
      { headers: { 'Content-Type': 'text/html' } }
    );
  }
}

// ─── YouTube Video Handler ───
async function handleYouTubeRequest(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    console.warn('[SW] YouTube request failed:', err);
    // Return offline message for videos
    return new Response(
      '<html><body style="background:#0f0f0f;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;"><div style="text-align:center;"><h2 style="color:#7c5cff;">🎬 Offline</h2><p>This video is not available offline.<br>Please connect to the internet to watch it.</p></div></body></html>',
      { headers: { 'Content-Type': 'text/html' } }
    );
  }
}

// ─── Google Drive Thumbnail Handler ───
async function handleThumbnailRequest(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    console.warn('[SW] Thumbnail request failed:', err);
    // Return a placeholder thumbnail
    return new Response(
      '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="260" viewBox="0 0 200 260"><rect width="200" height="260" fill="#1a1d2b"/><rect x="20" y="20" width="160" height="180" fill="#2a2d3b" rx="4"/><text x="100" y="140" font-family="sans-serif" font-size="48" fill="#7c5cff" text-anchor="middle">📄</text><text x="100" y="220" font-family="sans-serif" font-size="14" fill="#aaa" text-anchor="middle">Document</text></svg>',
      { headers: { 'Content-Type': 'image/svg+xml' } }
    );
  }
}

// ─── Background Sync for Download Queue ───
self.addEventListener('sync', event => {
  if (event.tag === 'download-sync') {
    event.waitUntil(processDownloadQueue());
  }
});

async function processDownloadQueue() {
  const cache = await caches.open('download-queue');
  const requests = await cache.keys();
  for (const request of requests) {
    try {
      const response = await fetch(request);
      if (response.ok) {
        // Store in downloads cache
        const downloads = await caches.open('downloads');
        await downloads.put(request, response);
        await cache.delete(request);
      }
    } catch (err) {
      console.warn('[SW] Download sync failed:', request.url, err);
    }
  }
}

// ─── Push Notifications (future feature) ───
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  const options = {
    body: data.body || 'New educational content available!',
    icon: 'favicon.png',
    badge: 'favicon.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/'
    }
  };
  event.waitUntil(
    self.registration.showNotification('Zed Tuition', options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});

// ─── Log successful registration ───
console.log('[SW] Service Worker loaded successfully!');