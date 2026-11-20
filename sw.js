// 오프라인 캐시. 파일을 바꾸면 VERSION을 올린다.
const VERSION = 'backnumber-v3';
const FILES = [
  './', 'index.html', 'manifest.webmanifest', 'css/style.css',
  'data/clubs.js', 'data/names.js', 'data/events.js',
  'js/pixel/core.js', 'js/pixel/player.js', 'js/pixel/pitch.js', 'js/pixel/badge.js', 'js/pixel/icons.js', 'js/pixel/trophies.js',
  'js/sim/core.js', 'js/sim/match.js', 'js/sim/season.js', 'js/sim/events.js',
  'js/ui/sound.js', 'js/ui/app.js',
  'fonts/galmuri/Galmuri11.woff2', 'fonts/galmuri/Galmuri11-Bold.woff2', 'fonts/galmuri/Galmuri9.woff2', 'fonts/galmuri/GalmuriMono11.woff2',
  'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

// 캐시 먼저. 효과음·엠블럼처럼 나중에 넣는 파일은 처음 받을 때 캐시에 넣는다.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then((hit) => hit || fetch(e.request).then((res) => {
      if (res.ok && new URL(e.request.url).origin === location.origin) {
        const copy = res.clone();
        caches.open(VERSION).then((c) => c.put(e.request, copy));
      }
      return res;
    }).catch(() => hit))
  );
});
