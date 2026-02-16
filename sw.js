// Clubhouse — Service Worker (network-first, offline shell)
var CACHE = 'clubhouse-v1';

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(c) {
      return c.addAll(['./', './index.html']).catch(function() {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(names.map(function(n) {
        if (n !== CACHE) return caches.delete(n);
      }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  if (e.request.method !== 'GET') return;
  // Never cache Firebase / Google API calls
  var u = e.request.url;
  if (u.indexOf('firebaseio.com') !== -1 ||
      u.indexOf('googleapis.com') !== -1 ||
      u.indexOf('firestore.googleapis.com') !== -1) {
    return;                       // let browser handle normally
  }
  e.respondWith(
    fetch(e.request).then(function(res) {
      if (res.status === 200) {
        var clone = res.clone();
        caches.open(CACHE).then(function(c) { c.put(e.request, clone); });
      }
      return res;
    }).catch(function() {
      return caches.match(e.request).then(function(r) {
        return r || (e.request.destination === 'document'
          ? caches.match('./index.html')
          : new Response('Offline', { status: 503 }));
      });
    })
  );
});
