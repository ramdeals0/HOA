/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;

const SHELL_CACHE = 'hoa-shell-v1';
const NEWS_CACHE = 'hoa-api-news-v1';
const DOCUMENTS_CACHE = 'hoa-api-documents-v1';

const SHELL_ASSETS = ['/', '/offline', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png', '/icons/icon.svg'];

function isNewsApiRequest(url: URL): boolean {
  return /\/api\/t\/[^/]+\/news(\/|$)/.test(url.pathname);
}

function isDocumentsApiRequest(url: URL): boolean {
  return /\/api\/t\/[^/]+\/documents(\/|$)/.test(url.pathname);
}

function isStaticAssetRequest(url: URL): boolean {
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.endsWith('.woff2')
  );
}

async function networkFirst(request: Request, cacheName: string): Promise<Response> {
  const cache = await caches.open(cacheName);

  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }

    return new Response(
      JSON.stringify({
        error: 'You are offline and no cached data is available.',
        offline: true,
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}

async function cacheFirst(request: Request, cacheName: string): Promise<Response> {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) {
    return cached;
  }

  const response = await fetch(request);
  if (response.ok) {
    await cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_ASSETS)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => ![SHELL_CACHE, NEWS_CACHE, DOCUMENTS_CACHE].includes(key))
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== 'GET') {
    return;
  }

  if (isNewsApiRequest(url)) {
    event.respondWith(networkFirst(request, NEWS_CACHE));
    return;
  }

  if (isDocumentsApiRequest(url)) {
    event.respondWith(networkFirst(request, DOCUMENTS_CACHE));
    return;
  }

  if (isStaticAssetRequest(url)) {
    event.respondWith(cacheFirst(request, SHELL_CACHE));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(SHELL_CACHE);
        const cachedRoot = await cache.match('/');
        if (cachedRoot) {
          return cachedRoot;
        }
        const offlinePage = await cache.match('/offline');
        return (
          offlinePage ??
          new Response('You are offline.', {
            status: 503,
            headers: { 'Content-Type': 'text/plain' },
          })
        );
      }),
    );
  }
});

export {};
