const CACHE_NAME = "execution-ebook-pwa-v2";
const PAGE_COUNT = 77;

const shellAssets = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./ebook-data.js",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png",
  "./assets/执行力心得体会汇编.pdf"
];

const pageAssets = Array.from({ length: PAGE_COUNT }, (_, index) => {
  return `./pages/page-${String(index + 1).padStart(3, "0")}.webp`;
});

async function cacheAll() {
  const cache = await caches.open(CACHE_NAME);
  await cache.addAll(shellAssets);
  pageAssets.forEach((asset) => {
    cache.add(asset).catch(() => {});
  });
}

self.addEventListener("install", (event) => {
  event.waitUntil(cacheAll().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)));
    }).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  const isShell =
    url.pathname.endsWith("/") ||
    url.pathname.endsWith("/index.html") ||
    url.pathname.endsWith("/app.js") ||
    url.pathname.endsWith("/styles.css") ||
    url.pathname.endsWith("/ebook-data.js") ||
    url.pathname.endsWith("/manifest.webmanifest");

  if (isShell) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      });
    })
  );
});
