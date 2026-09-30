const CACHE = 'studypinyin-v13';
const ASSETS = ['./', './index.html', './src/main.js?v=11', './src/pinyin-data.js', './src/voice-examples.js', './src/styles.css?v=12', './assets/pinyin-regular.woff2', './manifest.webmanifest', './icon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(Promise.all([
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))),
    self.clients.claim(),
  ]));
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(fetch(event.request).then(async (response) => {
    if (response.status === 200) {
      try {
        const cache = await caches.open(CACHE);
        await cache.put(event.request, response.clone());
      } catch {}
    }
    return response;
  }).catch(async () => {
    try {
      return await caches.match(event.request) || Response.error();
    } catch {
      return Response.error();
    }
  }));
});
