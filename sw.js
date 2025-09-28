// service-worker.js

const CACHE_NAME = 'taskmaster-v1';

// ⚠️ No GitHub Pages use caminhos relativos
// porque o site não está em / mas em /To-dolist/
const ASSETS = [
  './',                // raiz do projeto
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Instalação do Service Worker: pré-caching
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Ativação: remove caches antigos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// Intercepta requisições
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      // se houver no cache, retorna
      if (cachedResponse) return cachedResponse;

      // senão, busca na rede e armazena
      return fetch(event.request)
        .then(networkResponse => {
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        })
        // se offline e recurso não encontrado, não tenta entregar index.html
        .catch(() => {
          // aqui você pode retornar uma página offline customizada
          return caches.match('./index.html');
        });
    })
  );
});
