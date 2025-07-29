// Service Worker for SkyWatch Weather App
const CACHE_NAME = 'skywatch-v1.0.2';

// Handle GitHub Pages deployment
const isGitHubPages = self.location.hostname === 'nikhil-partap.github.io';
const basePath = isGitHubPages ? '/Skywatch' : '';

const localFiles = [
    `${basePath}/index.html`,
    `${basePath}/style.css`,
    `${basePath}/script.js`,
    `${basePath}/manifest.json`
];

const externalFiles = [
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Install event - cache resources
self.addEventListener('install', event => {
    console.log('Service Worker installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Caching local files:', localFiles);
                return cache.addAll(localFiles)
                    .then(() => {
                        console.log('Local files cached successfully');
                        // Try caching externals, but don't crash if they fail
                        return Promise.allSettled(
                            externalFiles.map(url => 
                                fetch(url)
                                    .then(res => {
                                        if (res.ok) {
                                            cache.put(url, res.clone());
                                            console.log('Cached external file:', url);
                                        }
                                    })
                                    .catch(err => {
                                        console.log('Failed to cache external file:', url, err);
                                    })
                            )
                        );
                    })
                    .catch(err => {
                        console.error('Failed to cache local files:', err);
                    });
            })
    );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', event => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    // Skip chrome-extension and other non-http requests
    if (!event.request.url.startsWith('http')) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Return cached version or fetch from network
                if (response) {
                    console.log('Serving from cache:', event.request.url);
                    return response;
                }
                
                // Clone the request because it's a stream
                const fetchRequest = event.request.clone();
                
                return fetch(fetchRequest)
                    .then(response => {
                        // Check if we received a valid response
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        
                        // Clone the response because it's a stream
                        const responseToCache = response.clone();
                        
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                                console.log('Cached new resource:', event.request.url);
                            })
                            .catch(err => {
                                console.log('Failed to cache resource:', event.request.url, err);
                            });
                        
                        return response;
                    })
                    .catch(err => {
                        console.log('Fetch failed, trying offline fallback:', event.request.url, err);
                        // Return offline page or cached content
                        if (event.request.destination === 'document') {
                            return caches.match(`${basePath}/index.html`);
                        }
                        return new Response('Offline content not available', {
                            status: 503,
                            statusText: 'Service Unavailable'
                        });
                    });
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    console.log('Service Worker activating...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Background sync for weather data (if supported)
self.addEventListener('sync', event => {
    if (event.tag === 'background-sync') {
        event.waitUntil(doBackgroundSync());
    }
});

// Background sync function
function doBackgroundSync() {
    // This would typically update weather data in the background
    // For now, we'll just log the sync event
    console.log('Background sync triggered');
    return Promise.resolve();
}

// Push notification handling (if implemented)
self.addEventListener('push', event => {
    if (event.data) {
        const data = event.data.json();
        const options = {
            body: data.body,
            vibrate: [100, 50, 100],
            data: {
                dateOfArrival: Date.now(),
                primaryKey: 1
            },
            actions: [
                {
                    action: 'explore',
                    title: 'View Weather'
                },
                {
                    action: 'close',
                    title: 'Close'
                }
            ]
        };
        
        event.waitUntil(
            self.registration.showNotification(data.title, options)
        );
    }
});

// Notification click handling
self.addEventListener('notificationclick', event => {
    event.notification.close();
    
    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow(`${basePath}/`)
        );
    }
});