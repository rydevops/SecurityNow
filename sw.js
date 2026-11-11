/*
 * Security Now! Interactive Book — service worker.
 *
 * This worker exists only so the app can be installed as a PWA.
 * It deliberately does NO caching: every request goes straight to the
 * network with `cache: "no-store"`, so a fresh deploy to GitHub Pages
 * is always what the user sees.
 */
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // Remove any cache a previous version may have created.
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // let the browser handle third-party requests

  event.respondWith((async () => {
    try {
      // `no-store` cannot be combined with mode "navigate", so rebuild the request.
      return await fetch(req.url, {
        cache: 'no-store',
        credentials: 'same-origin',
        headers: req.mode === 'navigate' ? undefined : req.headers,
      });
    } catch (err) {
      if (req.mode === 'navigate') {
        return new Response(
          '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
          '<title>Offline</title><body style="background:#050f22;color:#e8f0ff;font-family:system-ui;padding:2rem;text-align:center">' +
          '<h1>You’re offline</h1><p>Security Now! needs a connection so it always shows the latest episodes.</p>' +
          '<button onclick="location.reload()" style="padding:.7rem 1.4rem;font-size:1rem">Try again</button></body>',
          { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        );
      }
      throw err;
    }
  })());
});
