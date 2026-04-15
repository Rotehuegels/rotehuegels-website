// Rotehügels PWA Service Worker
// Provides offline caching for the dashboard shell and static assets

const CACHE_NAME = 'rotehuegels-v1';
const STATIC_ASSETS = [
  '/logo.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/apple-touch-icon.png',
  '/fonts/pdf.worker.min.js',
  '/manifest.json',
];

// Install — cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

// Fetch — network-first for API/pages, cache-first for static assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip API calls, auth, and external requests
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth/') || url.origin !== self.location.origin) return;

  // Static assets — cache-first
  if (STATIC_ASSETS.some((a) => url.pathname === a) ||
      url.pathname.startsWith('/fonts/') ||
      url.pathname.startsWith('/icons/') ||
      url.pathname.startsWith('/assets/') ||
      url.pathname.match(/\.(png|jpg|jpeg|svg|ico|woff2?|ttf|css|js)$/)) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // HTML pages — network-first with offline fallback
  if (event.request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache successful page responses
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
          // Return cached version if network fails
          return caches.match(event.request).then((cached) => {
            if (cached) return cached;
            // Return a basic offline page
            return new Response(
              '<html><body style="font-family:system-ui;text-align:center;padding:60px 20px;background:#09090b;color:#fff;">' +
              '<h1>Offline</h1><p style="color:#888;">You are offline. Please check your connection.</p>' +
              '<a href="/" style="color:#f59e0b;">Try again</a></body></html>',
              { headers: { 'Content-Type': 'text/html' } }
            );
          });
        })
    );
    return;
  }
});
