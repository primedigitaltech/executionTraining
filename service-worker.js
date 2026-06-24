const CACHE_NAME = "execution-ebook-pwa-v7";

const shellAssets = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./ebook-data.js",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png"
];

async function cacheAll() {
  const cache = await caches.open(CACHE_NAME);
  await Promise.all(shellAssets.map((asset) => cache.add(asset).catch(() => undefined)));
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

async function cachedFallback(request) {
  const exact = await caches.match(request);
  if (exact) return exact;

  const url = new URL(request.url);
  if (url.search) {
    url.search = "";
    const withoutQuery = await caches.match(url.toString());
    if (withoutQuery) return withoutQuery;
  }

  if (request.mode === "navigate") {
    return caches.match("./index.html");
  }

  return undefined;
}

async function fetchAndCache(request) {
  const response = await fetch(request);
  if (response && response.ok) {
    const copy = response.clone();
    caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  const isShell =
    event.request.mode === "navigate" ||
    url.pathname.endsWith("/") ||
    url.pathname.endsWith("/index.html") ||
    url.pathname.endsWith("/app.js") ||
    url.pathname.endsWith("/styles.css") ||
    url.pathname.endsWith("/ebook-data.js") ||
    url.pathname.endsWith("/manifest.webmanifest");

  if (isShell) {
    event.respondWith(
      fetchAndCache(event.request)
        .catch(() => cachedFallback(event.request))
    );
    return;
  }

  event.respondWith(fetch(event.request));
});
