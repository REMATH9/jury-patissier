const CACHE='jury-patisserie-v6';
const ASSETS=[
  './',
  './index.html',
  './style.css?v=6',
  './app.js?v=6',
  './questions.js?v=6',
  './manifest.json?v=6',
  './icon.svg',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;

  // Always try network first for HTML/CSS/JS so GitHub updates appear quickly.
  if (req.mode === 'navigate' ||
      req.url.includes('style.css') ||
      req.url.includes('app.js') ||
      req.url.includes('questions.js')) {
    event.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(cache => cache.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req))
  );
});
