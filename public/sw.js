// Self-destructing Service Worker
// This is used to clean up any active Service Workers and clear browser service worker caches
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    self.registration.unregister()
      .then(() => self.clients.matchAll())
      .then((clients) => {
        clients.forEach((client) => {
          if (client.url) {
            client.navigate(client.url);
          }
        });
      })
  );
});
