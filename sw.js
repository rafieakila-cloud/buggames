const C = 'buggames-store-v8';
const ASSETS = [
  './', './index.html',
  './css/style.css?v=8',
  './js/app.js?v=8', './js/icons.js?v=8', './js/engine3d.js?v=8', './js/games-action.js?v=8', './js/games-board.js?v=8', './js/games-quiz.js?v=8', './js/games-3d.js?v=8',
  './manifest.webmanifest',
  './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png', './icons/qr-install.png', './icons/maskable-512.png', './icons/apple-touch-icon.png'
];
self.addEventListener('install', e => { e.waitUntil(caches.open(C).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== C).map(x => caches.delete(x)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  /* network-first: selalu coba versi terbaru, fallback ke cache saat offline */
  e.respondWith(
    fetch(new Request(e.request, { cache: 'no-store' })).then(res => {
      if (res && res.ok) { const clone = res.clone(); caches.open(C).then(c => c.put(e.request, clone)); }
      return res;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('./index.html')))
  );
});
