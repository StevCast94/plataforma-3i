// Service worker mínimo: existe solo para cumplir el criterio de
// instalabilidad de PWA (manifest + SW con fetch handler). Sin caché propia
// a propósito — la app cambia seguido y una caché stale rompería el login
// persistente y el contenido editado desde el admin. Pass-through puro.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
