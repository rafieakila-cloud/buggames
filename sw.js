const C = 'buggames-store-v6';
const ASSETS = [
  './', './index.html', './css/style.css', './js/app.js', './manifest.webmanifest',
  './js/icons.js', './js/engine3d.js', './js/games-action.js', './js/games-board.js', './js/games-quiz.js', './js/games-3d.js',
  './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-512.png', './icons/apple-touch-icon.png'
];
self.addEventListener('install', e => { e.waitUntil(caches.open(C).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== C).map(x => caches.delete(x)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  /* network-first: selalu coba versi terbaru, fallback ke cache saat offline */
  e.respondWith(
    fetch(e.request).then(res => {
      if (res && res.ok) { const clone = res.clone(); caches.open(C).then(c => c.put(e.request, clone)); }
      return res;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('./index.html')))
  );
});
