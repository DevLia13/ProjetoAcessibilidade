/**
 * Service Worker para Projeto Acessibilidade PWA
 * Habilita instalação mobile (Android / iOS) e funcionamento offline completo
 */

const CACHE_NAME = 'projeto-acessibilidade-v1.0.0';

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './js/data.js',
  './js/gallery-manager.js',
  './js/chart-adapter.js',
  './js/chart-audio-describer.js',
  './js/app.js',
  './js/pwa.js',
  './assets/plate_5.png',
  './assets/plate_74.jpg',
  './assets/plate_26.jpg',
  './assets/plate_8.jpg',
  './assets/plate_12.jpg',
  './assets/icons/favicon-16x16.png',
  './assets/icons/favicon-32x32.png',
  './assets/icons/icon-72x72.png',
  './assets/icons/icon-96x96.png',
  './assets/icons/icon-128x128.png',
  './assets/icons/icon-144x144.png',
  './assets/icons/icon-152x152.png',
  './assets/icons/icon-180x180.png',
  './assets/icons/icon-192x192.png',
  './assets/icons/icon-384x384.png',
  './assets/icons/icon-512x512.png',
  './assets/icons/icon-maskable-512x512.png'
];

// Instalação: Pré-carrega recursos essenciais no cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[PWA SW] Aviso ao pré-carregar alguns recursos:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Ativação: Limpa versões de cache antigas e assume o controle dos clientes
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[PWA SW] Removendo cache obsoleto:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Estratégia Stale-While-Revalidate com fallback para Cache
self.addEventListener('fetch', (event) => {
  // Ignora requisições não-GET ou extensões do navegador (ex: chrome-extension)
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          // Atualiza o cache em background se a resposta for válida
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Em caso de falha de rede (offline), retorna o que estiver em cache
          return cachedResponse;
        });

      // Retorna resposta do cache imediatamente se existir, caso contrário aguarda rede
      return cachedResponse || fetchPromise;
    })
  );
});
