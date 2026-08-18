const CACHE_NAME = 'everyday-v2';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './meditation-10.mp3',
  './meditation-15.mp3',
  './meditation-20.mp3',
  './affirmation.mp3',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)))
    )
  );
  self.clients.claim();
});

// Files that rarely change and are large — safe to serve from cache first, offline-friendly
const CACHE_FIRST = ['.mp3', '.png'];

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  // Never touch Google APIs / fonts / CDN calls — those must always stay live
  if (url.origin !== self.location.origin) {
    return;
  }

  const isCacheFirst = CACHE_FIRST.some(ext => url.pathname.endsWith(ext));

  if (isCacheFirst) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        return cached || fetch(event.request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        });
      })
    );
    return;
  }

  // App shell (index.html, manifest.json, etc) — always try the network first
  // so updates show up immediately; fall back to cache only when offline.
  event.respondWith(
    fetch(event.request).then((response) => {
      const clone = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
      return response;
    }).catch(() => caches.match(event.request))
  );
});
