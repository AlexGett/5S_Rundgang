const CACHE_VERSION = 'v1.1.0.17'; // Neue Versionsnummer
const CACHE_NAME = `5s-rundgang-cache-${CACHE_VERSION}`;

const urlsToCache = [
    './',
    './index.html',
    './manifest.json',
    './Logo.png',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
    './icons/icon-192x192.png'
];

self.addEventListener('install', event => {
    self.skipWaiting(); // Erzwingt das sofortige Installieren
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            // Holt die Dateien garantiert neu vom Server und nicht aus dem HTTP-Cache
            return cache.addAll(urlsToCache.map(url => new Request(url, { cache: 'reload' })));
        })
    );
});

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
    return self.clients.claim(); // Übernimmt sofort die Kontrolle
});

self.addEventListener('fetch', event => {
    // NETWORK FIRST STRATEGIE FÜR HTML-DATEIEN
    if (event.request.mode === 'navigate' || (event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html'))) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    // Wenn wir online sind und die Datei laden konnten, aktualisieren wir den Cache im Hintergrund
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
                    return response;
                })
                .catch(() => {
                    // Nur wenn wir offline sind, laden wir aus dem Cache
                    return caches.match(event.request);
                })
        );
        return;
    }

    // CACHE FIRST STRATEGIE FÜR DEN REST (Bilder, JS, CSS) für schnelle Ladezeiten
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request);
        })
    );
});

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'GET_VERSION') {
        event.source.postMessage({ type: 'VERSION', version: CACHE_VERSION });
    }
});
