const CACHE='jury-patisserie-v7';
const ASSETS=[
  './',
  './index.html',
  './style.css?v=7',
  './app.js?v=7',
  './questions.js?v=6',
  './vocabulary.js?v=7',
  './manifest.json?v=7',
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
  const req=event.request;
  if(req.mode==='navigate' || /\.(?:css|js)(?:\?|$)/.test(req.url)){
    event.respondWith(
      fetch(req).then(res=>{
        const copy=res.clone();
        caches.open(CACHE).then(cache=>cache.put(req,copy));
        return res;
      }).catch(()=>caches.match(req).then(r=>r||caches.match('./index.html')))
    );
    return;
  }
  event.respondWith(caches.match(req).then(r=>r||fetch(req)));
});
