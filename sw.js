
const CACHE_NAME = 'lily-cache-v2-store-ready';
const urlsToCache = [
  './',
  './index.html',
  './index.tsx',
  './App.tsx',
  './manifest.json',
  './hooks/useLiveSession.ts',
  './hooks/useDynamicBackground.ts',
  './components/Avatar.tsx',
  './components/Controls.tsx',
  './components/StatusIndicator.tsx',
  './components/TranscriptionDisplay.tsx',
  './components/AudioVisualizer.tsx',
  './components/ChatInput.tsx',
  './components/MemoryJournal.tsx',
  './components/WelcomeGuide.tsx',
  './components/WelcomeBack.tsx',
  './components/MediaPlayer.tsx',
  './constants.tsx',
  './types.ts',
  './utils/audio.ts',
  './utils/memory.ts',
  './utils/history.ts',
  './utils/personality.ts',
  './utils/lif.ts',
  './utils/creative.ts',
  './assets/lily-icon.svg',
  './assets/icon-192.png',
  './assets/icon-512.png'
];

// Install: Cache core assets
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache opened for Store assets');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activate: Clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch: Stale-while-revalidate strategy for a balance of speed and freshness
self.addEventListener('fetch', event => {
  // Ignoramos las solicitudes de la CDN o cross-origin para que el navegador las maneje
  if (event.request.url.startsWith('https://aistudiocdn.com') || event.request.url.startsWith('https://unpkg.com')) {
    return;
  }

  // Navigation requests (HTML) should try network first, fallback to cache (offline mode)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match('./index.html');
        })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request).then(
          response => {
            // Check if we received a valid response
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
  );
});
