// ═══════════════════════════════════════════════════════════
// ClubMates v3 — Service Worker (Network-First)
// ═══════════════════════════════════════════════════════════
// BUMP this version on every deployment to bust the cache:
var CACHE_VERSION = 'clubmates-v3.1';

// Files to pre-cache on install (shell files)
var SHELL_FILES = [
  './',
  './index.html'
];

// ── Install: pre-cache shell, skip waiting immediately ──
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(function(cache) {
      return cache.addAll(SHELL_FILES);
    })
  );
  self.skipWaiting(); // Activate new SW immediately
});

// ── Activate: delete old caches, claim all clients ──
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) {
          return key !== CACHE_VERSION;
        }).map(function(key) {
          return caches.delete(key);
        })
      );
    })
  );
  self.clients.claim(); // Take control of all open tabs
});

// ── Fetch: Network-first strategy ──
// Always try the network. If offline, fall back to cache.
self.addEventListener('fetch', function(event) {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // Skip cross-origin requests (Firebase SDK, CDNs, etc.)
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    fetch(event.request).then(function(response) {
      // Got a fresh response — cache it for offline fallback
      var clone = response.clone();
      caches.open(CACHE_VERSION).then(function(cache) {
        cache.put(event.request, clone);
      });
      return response;
    }).catch(function() {
      // Network failed — serve from cache
      return caches.match(event.request);
    })
  );
});
