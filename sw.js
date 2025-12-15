
const CACHE_NAME = 'lily-cache-v1';
const urlsToCache = [
  './',
  './index.html',
  './index.tsx',
  './App.tsx',
  './hooks/useLiveSession.ts',
  './hooks/useDynamicBackground.ts',
  './components/Avatar.tsx',
  './components/Controls.tsx',
  './components/StatusIndicator.tsx',
  './components/TranscriptionDisplay.tsx',
  './components/AudioVisualizer.tsx',
  './constants.tsx',
  './types.ts',
  './utils/audio.ts',
  './assets/lily-icon.svg'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache abierto');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  // Ignoramos las solicitudes de la CDN para que el navegador las maneje
  if (event.request.url.startsWith('https://aistudiocdn.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Si está en caché, lo devolvemos
        if (response) {
          return response;
        }
        // Si no, lo buscamos en la red
        return fetch(event.request);
      })
  );
});
