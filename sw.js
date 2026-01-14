/* eslint-disable no-restricted-globals */
const CACHE_VERSION = 'v1';
const CACHE_NAME = `demo-pwa-${CACHE_VERSION}`;

// Assets to cache immediately on install
const PRECACHE_ASSETS = [
  '/',
  '/scripts/aem.js',
  '/scripts/scripts.js',
  '/styles/styles.css',
  '/styles/lazy-styles.css',
  '/styles/fonts.css',
  '/manifest.json',
];

// Install event - cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Precaching core assets');
      return cache.addAll(PRECACHE_ASSETS.map((url) => new Request(url, { cache: 'reload' })))
        .catch((error) => {
          console.error('[Service Worker] Precaching failed:', error);
        });
    }).then(() => {
      console.log('[Service Worker] Skip waiting on install');
      return self.skipWaiting();
    }),
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => Promise.all(
      cacheNames.map((cacheName) => {
        if (cacheName !== CACHE_NAME) {
          console.log('[Service Worker] Deleting old cache:', cacheName);
          return caches.delete(cacheName);
        }
        return null;
      }),
    )).then(() => {
      console.log('[Service Worker] Claiming clients');
      return self.clients.claim();
    }),
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome extension requests
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  // Skip cross-origin requests (except fonts and images)
  if (url.origin !== location.origin) {
    const isFont = request.destination === 'font' || url.pathname.match(/\.(woff2?|ttf|otf|eot)$/);
    const isImage = request.destination === 'image' || url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)$/);
    if (!isFont && !isImage) {
      return;
    }
  }

  // Handle the request with cache-first strategy
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => cache.match(request).then((cachedResponse) => {
      // Return cached response if available
      if (cachedResponse) {
        // Fetch and update cache in the background for HTML documents
        if (request.destination === 'document' || url.pathname.endsWith('.html') || url.pathname === '/' || !url.pathname.includes('.')) {
          fetch(request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(request, networkResponse.clone());
            }
          }).catch(() => {
            // Network fetch failed, but we have cache
          });
        }
        return cachedResponse;
      }

      // No cache, try network
      return fetch(request).then((networkResponse) => {
        // Cache successful responses
        if (networkResponse && networkResponse.status === 200) {
          // Clone the response before caching
          const responseToCache = networkResponse.clone();

          // Cache based on content type
          const contentType = networkResponse.headers.get('content-type') || '';
          const shouldCache = contentType.includes('text/html')
            || contentType.includes('text/css')
            || contentType.includes('application/javascript')
            || contentType.includes('application/json')
            || contentType.includes('image/')
            || contentType.includes('font/')
            || request.destination === 'font'
            || request.destination === 'image'
            || request.destination === 'script'
            || request.destination === 'style'
            || request.destination === 'document';

          if (shouldCache) {
            cache.put(request, responseToCache);
          }
        }
        return networkResponse;
      }).catch((error) => {
        console.error('[Service Worker] Fetch failed:', error);
        // Return offline page for navigation requests
        if (request.destination === 'document') {
          return cache.match('/offline.html').then((offlineResponse) => {
            if (offlineResponse) {
              return offlineResponse;
            }
            // Fallback response if no offline page
            return new Response(
              '<html><body><h1>Offline</h1><p>You are currently offline. Please check your connection.</p></body></html>',
              { headers: { 'content-type': 'text/html' } },
            );
          });
        }
        throw error;
      });
    })),
  );
});

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => cache.addAll(event.data.urls)),
    );
  }
});
