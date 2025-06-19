// sw.js
const CACHE_NAME = 'footstats-pro-v2';
const OFFLINE_URL = '/offline.html';

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => 
      cache.addAll([
        '/',
        '/index.html',
        '/styles/main.css',
        '/scripts/main.js',
        OFFLINE_URL,
        'https://cdn.jsdelivr.net/npm/chart.js',
        'https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js'
      ])
    )
  );
});

self.addEventListener('fetch', event => {
  // Ignorar completamente requisições da API
  if (event.request.url.includes('api.footstats.com')) {
    return;
  }

  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(event.request).then(cachedResponse => {
        const fetchPromise = fetch(event.request).then(networkResponse => {
          // Atualiza cache para respostas válidas
          if (networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(error => {
          // Fallback estratégico
          if (cachedResponse) return cachedResponse;
          if (event.request.mode === 'navigate') {
            return cache.match(OFFLINE_URL);
          }
          return Response.error();
        });
        
        return cachedResponse || fetchPromise;
      });
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Forçar controle sobre todas as abas imediatamente
      return self.clients.claim();
    })
  );
});
