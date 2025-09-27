// Version - update this to bust the cache when you deploy changes
const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `badminton-queue-${CACHE_VERSION}`;

// Files to cache for offline use
const urlsToCache = [
  '/',
  '/index.html',
  '/src/main.jsx',
  '/src/BadmintonQueue.jsx',
  '/src/styles/main.scss',
  // Add other static assets as needed
];

// Install event - cache all required files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        // Force the new service worker to activate immediately
        self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete old cache versions
          if (cacheName.startsWith('badminton-queue-') && cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Take control of all pages immediately
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache when offline, network first when online
self.addEventListener('fetch', (event) => {
  event.respondWith(
    // Try network first for better freshness when online
    fetch(event.request)
      .then((response) => {
        // If we got a valid response, cache it and return it
        if (response && response.status === 200) {
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
        }
        return response;
      })
      .catch(() => {
        // Network failed, try to serve from cache
        return caches.match(event.request)
          .then((response) => {
            if (response) {
              return response;
            }
            // If not in cache and offline, return a fallback for HTML requests
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('/index.html');
            }
          });
      })
  );
});

// Listen for messages from the client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});