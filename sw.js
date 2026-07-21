var CACHE_NAME = 'zaydio-v5.3';
var urlsToCache = [
  '/ZAYDIOLOGO.webp',
  '/album-everybody-sing.webp',
  '/album-the-new-abcs.webp',
  '/album-sing-along-lullabies.webp',
  '/album-island-vibes-lullabies.webp'
];

function isHtmlDocumentRequest(request, url) {
  if (request.mode === 'navigate') return true;
  if (url.pathname === '/' || url.pathname.endsWith('.html') || url.pathname.endsWith('/')) {
    return true;
  }
  var accept = request.headers.get('Accept') || '';
  return accept.indexOf('text/html') !== -1;
}

function isAssetRequest(url) {
  return url.pathname.endsWith('.css') || url.pathname.endsWith('.js');
}

self.addEventListener('install', function(event) {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('fetch', function(event) {
  var url = new URL(event.request.url);

  // Network-first for HTML documents and CSS/JS (stale offline fallback only).
  if (isHtmlDocumentRequest(event.request, url) || isAssetRequest(url)) {
    event.respondWith(
      fetch(event.request).then(function(response) {
        if (response && response.status === 200) {
          var responseClone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      }).catch(function() {
        return caches.match(event.request);
      })
    );
    return;
  }

  // Cache-first for images and other static assets.
  event.respondWith(
    caches.match(event.request).then(function(cached) {
      return cached || fetch(event.request).then(function(response) {
        if (response && response.status === 200) {
          var responseClone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      });
    })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(name) {
          return name !== CACHE_NAME;
        }).map(function(name) {
          return caches.delete(name);
        })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});
