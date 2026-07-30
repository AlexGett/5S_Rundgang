const CACHE_VERSION = 'v1.1.0.16'; 
const CACHE_NAME = `5s-rundgang-cache-${CACHE_VERSION}`;

// Liste der Dateien, die für die App-Shell benötigt werden
const urlsToCache = [
    './',
    './index.html',
    './manifest.json',
    './Logo.png',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
    './icons/icon-192x192.png'
];

// Installation des Service Workers
self.addEventListener('install', event => {
    // 2. FEHLER BEHOBEN: Überspringt die Warteschleife, damit das Update sofort angewendet wird
    self.skipWaiting(); 
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Cache geöffnet und Dateien werden hinzugefügt');
                // 3. LÖSUNG FÜR GITHUB PAGES: { cache: 'reload' } zwingt den Browser, 
                // die Dateien frisch vom Server zu holen und nicht aus dem HTTP-Cache.
                return cache.addAll(
                    urlsToCache.map(url => new Request(url, { cache: 'reload' }))
                );
            })
    );
});

// Aktivierung und Bereinigung alter Caches
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
    // Übernimmt sofort die Kontrolle über alle geöffneten Tabs der App
    return self.clients.claim();
});

// Abfangen von Fetch-Anfragen (Cache-First Strategie)
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
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
