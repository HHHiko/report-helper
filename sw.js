// Service Worker — 交班报表助手
const CACHE_NAME = 'report-helper-v6';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
];

// Install: cache all assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch: 页面与云端目标数据(.json)优先网络，保证每次打开都是最新；离线时回退缓存。其他资源缓存优先。
self.addEventListener('fetch', (event) => {
  const isPage = event.request.mode === 'navigate';
  const isJson = new URL(event.request.url).pathname.endsWith('.json');
  if (isPage || isJson) {
    event.respondWith(
      fetch(event.request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(isPage ? './index.html' : event.request, copy);
        });
        return response;
      }).catch(() => {
        if (isPage) return caches.match('./index.html');
        return caches.match(event.request);
      })
    );
  } else {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        return cached || fetch(event.request);
      })
    );
  }
});
