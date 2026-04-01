
const VERSION = 'v2.0';
const CACHE_NAME = `vocab-${VERSION}`;
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  'https://unpkg.com/dexie/dist/dexie.js'  // Dexie wird jetzt auch offline gecached
];

// Installation: Cache befüllen
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Aktivierung: Alten Cache löschen
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim(); // Sofort alle Tabs übernehmen
});

// Fetch: Network-first Strategie
// Versucht zuerst das Netzwerk. Nur wenn offline, wird der Cache genutzt.
// So bekommst du Updates sofort, hast aber trotzdem Offline-Support.
self.addEventListener('fetch', (e) => {
  // API-Calls (GitHub etc.) nie cachen
  if (e.request.url.includes('api.github.com')) return;

  e.respondWith(
    fetch(e.request)
      .then(response => {
        // Erfolgreiche Antwort in den Cache legen
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, copy));
        return response;
      })
      .catch(() => {
        // Offline: Aus dem Cache holen
        return caches.match(e.request);
      })
  );
});
