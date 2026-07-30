const CACHE_VERSION = 'v1.0.8';
const CACHE_NAME = `5s-rundgang-cache-${CACHE_VERSION}`;

// Liste der Dateien, die für die App-Shell benötigt werden
const urlsToCache = [
    './',
    './index.html',
    './manifest.json',
    './Logo.png',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
    './icons/icon-612x612.png'
    // Füge hier die Pfade zu deinen Icons hinzu, sobald du sie hast:
    // './icons/icon-192x192.png',
    // './icons/icon-512x512.png'
];

// Installation des Service Workers und Caching der App-Shell
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Cache geöffnet und Dateien werden hinzugefügt');
                return cache.addAll(urlsToCache);
            })
    );
});

// Aktivierung des Service Workers und Bereinigung alter Caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Alter Cache wird gelöscht:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});

// Abfangen von Fetch-Anfragen, um aus dem Cache zu bedienen
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Wenn die Anfrage im Cache ist, wird sie von dort zurückgegeben
                return response || fetch(event.request);
            })
    );
});

// Senden der Version an den Client
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'GET_VERSION') {
        event.source.postMessage({ type: 'VERSION', version: CACHE_VERSION });
    }
});
