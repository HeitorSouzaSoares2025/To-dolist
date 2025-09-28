// Nome do cache
const CACHE_NAME = 'taskmaster-v1';

// Arquivos que serão armazenados no cache (offline)
const ASSETS = [
  '/',                // raiz
  '/index.html',      // página principal
  '/style.css',       // estilos
  '/script.js',       // script principal
  '/manifest.json',   // manifest do PWA
  '/icon-192.png',    // ícone PWA
  '/icon-512.png'     // ícone PWA
];

// -------------------- INSTALAÇÃO --------------------
self.addEventListener('install', evt => {
  // Adiciona os arquivos definidos em ASSETS ao cache
  evt.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );

  // Força a ativação imediata do SW após a instalação
  self.skipWaiting();
});

// -------------------- ATIVAÇÃO --------------------
self.addEventListener('activate', evt => {
  // Remove caches antigos (quando a versão muda)
  evt.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(k => {
          if (k !== CACHE_NAME) return caches.delete(k);
        })
      )
    )
  );

  // Garante que o SW ative imediatamente nas abas abertas
  self.clients.claim();
});

// -------------------- INTERCEPTAÇÃO DE REQUISIÇÕES --------------------
self.addEventListener('fetch', evt => {
  // Apenas requisições GET são cacheadas
  if (evt.request.method !== 'GET') return;

  evt.respondWith(
    caches.match(evt.request) // procura no cache
      .then(res => 
        res || fetch(evt.request) // se não achar no cache, faz a requisição
          .then(fres => {
            // Armazena no cache para uso futuro
            return caches.open(CACHE_NAME).then(cache => {
              cache.put(evt.request, fres.clone());
              return fres;
            });
          })
          // Se não houver internet, retorna a página offline
          .catch(() => caches.match('/index.html'))
      )
  );
});
