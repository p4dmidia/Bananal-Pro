const CACHE_NAME = 'bananal-pro-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Ignorar chamadas para o Supabase (API e Edge Functions)
  if (url.hostname.includes('supabase.co')) {
    return;
  }

  // Ignore Vite-specific and development resources
  if (
    url.pathname.startsWith('/@vite') || 
    url.pathname.startsWith('/src') ||
    url.pathname.startsWith('/node_modules') ||
    url.pathname.includes('hot-update') ||
    url.search.includes('t=') ||
    (url.hostname === 'localhost' && url.port === '3000' && !url.pathname.includes('.'))
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
