// ---
// Service Worker
//
// This file controls the caching and offline behavior of your PWA.
// ---

// 1. --- IMPORTANT: UPDATE THIS VERSION ---
// To push an update to users, increment this version number.
// e.g., 'mandarin-guide-v1', 'mandarin-guide-v2', etc.
const CACHE_NAME = 'mandarin-guide-v12';
// ---

// 2. --- Assets to Cache ---
// Add all core files your app needs to work offline.
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    './icon-192.png',
    './icon-512.png',
    './images/profile.jpg' // Caching the profile image
];

// --- Install Event ---
// This runs when the new Service Worker is first installed.
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Caching new assets');
                // We use addAll() to cache all essential files.
                // If any file fails to download, the installation fails.
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => {
                // Force this new service worker to become the "active" one immediately.
                // This bypasses the default "waiting" state.
                console.log('Service Worker: Installed and skipping wait.');
                self.skipWaiting();
            })
            .catch((err) => {
                console.error('Service Worker: Cache addAll failed', err);
            })
    );
});

// --- Activate Event ---
// This runs after the 'install' event and when the new SW takes control.
// This is the perfect time to clean up old caches.
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    // --- This is the crucial part ---
                    // If a cache's name is not our new CACHE_NAME, we delete it.
                    if (cacheName !== CACHE_NAME) {
                        console.log('Service Worker: Clearing old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            // Tell the active service worker to take control of all clients
            // (open tabs/windows) immediately.
            console.log('Service Worker: Activated and claimed clients.');
            return self.clients.claim();
        })
    );
});

// --- Fetch Event (Stale-While-Revalidate Strategy) ---
// This runs for every network request (e.g., for pages, images, scripts).
self.addEventListener('fetch', (event) => {
    // We only want to cache GET requests for http/https.
    if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
        return;
    }

    event.respondWith(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.match(event.request).then((cachedResponse) => {
                
                // 1. Make a network request in the background.
                const fetchedResponsePromise = fetch(event.request).then((networkResponse) => {
                    // 2. If we get a valid response, update the cache.
                    if (networkResponse && networkResponse.status === 200) {
                        cache.put(event.request, networkResponse.clone());
                    }
                    return networkResponse;
                }).catch(err => {
                    console.warn('Service Worker: Network fetch failed.', err);
                    // If network fails, we just rely on the cached response (if any).
                });

                // 3. Return the cached response *immediately* if we have one,
                // otherwise, wait for the network response.
                // This makes the app load fast (from cache) but also update 
                // itself in the background for the *next* visit.
                return cachedResponse || fetchedResponsePromise;
            });
        })
    );
});





