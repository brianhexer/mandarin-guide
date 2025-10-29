const CACHE_NAME = 'mandarin-guide-cache-v1';
// This list should ideally include all local assets like icons, 
// but we'll start with the core app.
const URLS_TO_CACHE = [
  'index.html',
  '/', // Alias for index.html
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
];

/**
 * Installation: Open a cache and add all core files to it.
 */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Opened cache');
        // addAll() fetches and caches all specified URLs.
        return cache.addAll(URLS_TO_CACHE);
      })
      .catch(err => {
        console.error('Service Worker: Failed to cache resources during install', err);
      })
  );
});

/**
 * Activation: Clean up old, unused caches.
 */
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME]; // Only keep the current cache
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // If a cache is not in our whitelist, delete it.
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

/**
 * Fetch: Intercept network requests.
 * Try to serve from cache first for an offline-first experience.
 */
self.addEventListener('fetch', event => {
  // We only want to cache GET requests.
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Use a Cache First strategy for all requests.
  // This makes the app load instantly and work offline.
  // The service worker update-on-reload cycle handles getting new versions.
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Cache hit - return response
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Not in cache - fetch from network, then cache it
        return fetch(event.request).then(
          networkResponse => {
              // Check if we got a valid response
            if(!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              if (event.request.url.startsWith('https://fonts.gstatic.com')) {
                   // Don't log errors for font files
                } else {
                 console.log('Service Worker: Skipping cache for', event.request.url);
              }
                return networkResponse;
              }

            // Clone the response
              const responseToCache = networkResponse.clone();
              
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });
                
              return networkResponse;
            }
          ).catch(err => {
            console.error('Service Worker: Fetch failed', err);
            // You could return a placeholder asset here if you had one.
          });
        })
    );
  }
});

