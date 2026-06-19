const CACHE_NAME = "miyame-tasks-v2";
const urlsToCache = [
  "/",
  "/manifest.json",
  "/employee",
  "/director"
];

self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener("fetch", event => {
  // Bypass cache for Next.js HMR/Webpack requests in development
  if (event.request.url.includes("/_next/webpack-hmr") || event.request.url.includes("hot-update")) {
    return;
  }

  // Network First, fallback to cache
  event.respondWith(
    fetch(event.request).then(response => {
      if(!response || response.status !== 200 || response.type !== "basic") {
        return response;
      }
      var responseToCache = response.clone();
      caches.open(CACHE_NAME).then(function(cache) {
        if (event.request.method === "GET") {
          cache.put(event.request, responseToCache);
        }
      });
      return response;
    }).catch(() => {
      return caches.match(event.request);
    })
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(self.clients.claim());
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
