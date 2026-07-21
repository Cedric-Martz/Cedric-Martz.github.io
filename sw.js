const CACHE_VERSION = 'portfolio-v4';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

const PRECACHE_URLS = [
  './',
  './index.html',
  './projets.html',
  './blog.html',
  './contact.html',
  './quote-game.html',
  './css/style.css',
  './portfolio.js',
  './app.js',
  './data/quotes.json',
  './assets/site.webmanifest',
  './favicon.ico',
  './assets/images/favicon.svg',
  './assets/images/favicon.ico',
  './assets/images/apple-touch-icon.png',
  './assets/images/web-app-manifest-192x192.png',
  './assets/images/web-app-manifest-512x512.png',
  './assets/images/final_logo.webp',
  './assets/images/quote_game_icon.webp',
  './assets/images/background-quote-game.png',
  './assets/images/default_picture.jpg',
  './assets/images/bellingcat.jpg',
  './assets/images/osintfr_mooc.jpg',
  './assets/images/forbiddenstories.png',
  './assets/images/gralhix.png',
  './assets/images/fox.png'
];

const QUOTES_API = 'https://dummyjson.com/quotes?limit=150';

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(STATIC_CACHE);
    await cache.addAll(PRECACHE_URLS);

    try {
      const response = await fetch(QUOTES_API);
      if (response.ok) await cache.put(QUOTES_API, response);
    } catch {
    }

    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const currentCaches = new Set([STATIC_CACHE, RUNTIME_CACHE]);
    const names = await caches.keys();
    await Promise.all(names.map((name) => (
      currentCaches.has(name) ? Promise.resolve() : caches.delete(name)
    )));
    await self.clients.claim();
  })());
});

async function networkFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
    return response;
  } catch {
    return (await cache.match(request))
      || (await caches.match(request))
      || (await caches.match('./index.html'));
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await caches.match(request);
  const update = fetch(request).then((response) => {
    if (response.status === 200 || response.type === 'opaque') {
      cache.put(request, response.clone());
    }
    return response;
  });

  if (cached) {
    update.catch(() => { });
    return cached;
  }
  return update;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  if (url.hostname === 'dummyjson.com' || url.hostname.endsWith('wikipedia.org') || url.hostname.endsWith('wikimedia.org')) {
    event.respondWith(staleWhileRevalidate(request));
  }
});
