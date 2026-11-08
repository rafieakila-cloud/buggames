const C = 'buggames-v13';
const ASSETS = [
  './', './index.html', './css/style.css', './manifest.webmanifest',
  './js/icons.js', './js/app.js', './js/engine3d.js',
  './js/games-action.js', './js/games-board.js', './js/games-quiz.js',
  './js/games-extras.js', './js/games-extras-b.js', './js/games-extras-c.js',
  './js/games-extras-d.js', './js/games-extras-e.js',
  './js/games-3d.js', './js/games-3d-extra.js', './js/games-3d-extra-b.js',
  './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-512.png', './icons/apple-touch-icon.png', './icons/qr-install.png'
];
self.addEventListener('install', e => { e.waitUntil(caches.open(C).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== C).map(x => caches.delete(x)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  e.respondWith(
    fetch(new Request(e.request, { cache: 'no-store' })).then(res => {
      if (res && res.ok) { const clone = res.clone(); caches.open(C).then(c => c.put(e.request, clone)); }
      return res;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('./index.html')))
  );
});
