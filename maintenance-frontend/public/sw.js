/* eslint-disable no-restricted-globals */
/**
 * Service Worker for Maintenance Platform PWA
 *
 * Features:
 * - Static asset caching (cache-first strategy)
 * - API response caching (network-first with cache fallback)
 * - Background sync support for offline changes
 * - Push notification handling
 * - Offline page fallback
 */

const CACHE_VERSION = 'v2';
const STATIC_CACHE = `maintenance-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `maintenance-runtime-${CACHE_VERSION}`;
const API_CACHE = `maintenance-api-${CACHE_VERSION}`;
const IMAGE_CACHE = `maintenance-images-${CACHE_VERSION}`;

// Static assets to precache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png',
];

// API endpoints to cache
const CACHEABLE_API_PATTERNS = [
  '/api/v1/work-orders',
  '/api/v1/assets',
  '/api/v1/inventory',
  '/api/v1/preventive-maintenance',
  '/api/v1/users',
  '/api/v1/settings',
  '/api/v1/analytics',
];

// API cache TTL in milliseconds (5 minutes)
const API_CACHE_TTL = 5 * 60 * 1000;

// Maximum age for cached API responses (1 hour)
const API_MAX_AGE = 60 * 60 * 1000;

// ============= INSTALL EVENT =============

self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Install event');

  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('[ServiceWorker] Precaching static assets');
        return cache.addAll(PRECACHE_ASSETS.map((url) => new Request(url, { cache: 'reload' })));
      }),
      // Skip waiting to activate immediately
      self.skipWaiting(),
    ])
  );
});

// ============= ACTIVATE EVENT =============

self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activate event');

  const currentCaches = [STATIC_CACHE, RUNTIME_CACHE, API_CACHE, IMAGE_CACHE];

  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!currentCaches.includes(cacheName)) {
              console.log('[ServiceWorker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Claim all clients immediately
      self.clients.claim(),
    ])
  );
});

// ============= FETCH EVENT =============

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests for caching
  if (request.method !== 'GET') {
    // For mutation requests, store them for background sync if offline
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
      event.respondWith(handleMutationRequest(request));
    }
    return;
  }

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // Route to appropriate handler
  if (isApiRequest(url)) {
    event.respondWith(handleApiRequest(request));
  } else if (isStaticAsset(url)) {
    event.respondWith(handleStaticRequest(request));
  } else if (isImageRequest(url)) {
    event.respondWith(handleImageRequest(request));
  } else {
    event.respondWith(handleNavigationRequest(request));
  }
});

// ============= REQUEST HANDLERS =============

/**
 * Handle API requests - Network first with cache fallback
 */
async function handleApiRequest(request) {
  const cache = await caches.open(API_CACHE);

  try {
    // Try network first
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      // Clone and cache the response with timestamp
      const responseToCache = networkResponse.clone();
      const headers = new Headers(responseToCache.headers);
      headers.set('sw-cached-at', Date.now().toString());

      const cachedResponse = new Response(await responseToCache.blob(), {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers,
      });

      await cache.put(request, cachedResponse);
    }

    return networkResponse;
  } catch (error) {
    console.log('[ServiceWorker] Network request failed, trying cache:', request.url);

    // Network failed, try cache
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      // Check if cache is not too old
      const cachedAt = cachedResponse.headers.get('sw-cached-at');
      if (cachedAt) {
        const age = Date.now() - parseInt(cachedAt, 10);
        if (age < API_MAX_AGE) {
          console.log('[ServiceWorker] Serving from cache:', request.url);
          return cachedResponse;
        }
      }
      // Return stale cache anyway if nothing else available
      return cachedResponse;
    }

    // Return error response
    return new Response(
      JSON.stringify({
        error: 'Network unavailable',
        offline: true,
        cachedAt: null,
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * Handle static asset requests - Cache first with network fallback
 */
async function handleStaticRequest(request) {
  const cache = await caches.open(STATIC_CACHE);

  // Check cache first
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    // Return cached version, update in background
    updateCacheInBackground(request, cache);
    return cachedResponse;
  }

  // Not in cache, fetch from network
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[ServiceWorker] Static asset fetch failed:', request.url);
    return new Response('Not found', { status: 404 });
  }
}

/**
 * Handle image requests - Cache first with network fallback
 */
async function handleImageRequest(request) {
  const cache = await caches.open(IMAGE_CACHE);

  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // Return placeholder for failed images
    return new Response('', { status: 404 });
  }
}

/**
 * Handle navigation requests - Network first with offline fallback
 */
async function handleNavigationRequest(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      await cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // Check cache
    const cache = await caches.open(RUNTIME_CACHE);
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const offlinePage = await caches.match('/offline.html');
      if (offlinePage) {
        return offlinePage;
      }
    }

    return new Response('Offline', { status: 503 });
  }
}

/**
 * Handle mutation requests - Queue for background sync if offline
 */
async function handleMutationRequest(request) {
  try {
    return await fetch(request);
  } catch (error) {
    // Store request for background sync
    await storeForSync(request);

    return new Response(
      JSON.stringify({
        success: true,
        offline: true,
        message: 'Request queued for sync when online',
      }),
      {
        status: 202,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// ============= HELPER FUNCTIONS =============

function isApiRequest(url) {
  return url.pathname.startsWith('/api/');
}

function isStaticAsset(url) {
  return /\.(js|css|woff2?|ttf|eot)$/i.test(url.pathname);
}

function isImageRequest(url) {
  return /\.(png|jpg|jpeg|gif|svg|webp|ico)$/i.test(url.pathname);
}

function isCacheableApiEndpoint(url) {
  return CACHEABLE_API_PATTERNS.some((pattern) => url.pathname.includes(pattern));
}

async function updateCacheInBackground(request, cache) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      await cache.put(request, networkResponse);
    }
  } catch (error) {
    // Silently fail background updates
  }
}

async function storeForSync(request) {
  // Store request details in IndexedDB via message to client
  const clients = await self.clients.matchAll();
  const requestData = {
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    body: request.method !== 'GET' ? await request.clone().text() : null,
    timestamp: Date.now(),
  };

  clients.forEach((client) => {
    client.postMessage({
      type: 'QUEUE_FOR_SYNC',
      payload: requestData,
    });
  });
}

// ============= BACKGROUND SYNC =============

self.addEventListener('sync', (event) => {
  console.log('[ServiceWorker] Background sync event:', event.tag);

  if (event.tag === 'sync-pending-changes') {
    event.waitUntil(syncPendingChanges());
  }
});

async function syncPendingChanges() {
  // Notify clients to perform sync
  const clients = await self.clients.matchAll();
  clients.forEach((client) => {
    client.postMessage({
      type: 'PERFORM_SYNC',
      timestamp: Date.now(),
    });
  });
}

// ============= PUSH NOTIFICATIONS =============

self.addEventListener('push', (event) => {
  console.log('[ServiceWorker] Push received');

  let data = {
    title: 'Maintenance Platform',
    body: 'New notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: 'maintenance-notification',
    data: {},
  };

  if (event.data) {
    try {
      const pushData = event.data.json();
      data = { ...data, ...pushData };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    vibrate: [200, 100, 200],
    tag: data.tag,
    requireInteraction: data.data?.requireInteraction || false,
    actions: [
      { action: 'view', title: 'View', icon: '/icons/icon-72x72.png' },
      { action: 'dismiss', title: 'Dismiss', icon: '/icons/icon-72x72.png' },
    ],
    data: data.data,
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', (event) => {
  console.log('[ServiceWorker] Notification click:', event.action);

  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  // Handle notification click
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there's already a window open
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.navigate(urlToOpen);
          return;
        }
      }
      // Open new window
      return clients.openWindow(urlToOpen);
    })
  );
});

// ============= MESSAGE HANDLING =============

self.addEventListener('message', (event) => {
  console.log('[ServiceWorker] Message received:', event.data?.type);

  const { type, payload } = event.data || {};

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'CACHE_URLS':
      event.waitUntil(cacheUrls(payload));
      break;

    case 'CLEAR_CACHE':
      event.waitUntil(clearCache(payload));
      break;

    case 'GET_CACHE_STATUS':
      event.waitUntil(getCacheStatus().then((status) => {
        event.source?.postMessage({ type: 'CACHE_STATUS', payload: status });
      }));
      break;

    case 'PRECACHE_API':
      event.waitUntil(precacheApiData(payload));
      break;
  }
});

async function cacheUrls(urls) {
  if (!Array.isArray(urls)) return;

  const cache = await caches.open(RUNTIME_CACHE);
  await cache.addAll(urls);
}

async function clearCache(cacheNames) {
  if (!cacheNames) {
    // Clear all caches
    const names = await caches.keys();
    await Promise.all(names.map((name) => caches.delete(name)));
  } else if (Array.isArray(cacheNames)) {
    await Promise.all(cacheNames.map((name) => caches.delete(name)));
  }
}

async function getCacheStatus() {
  const cacheNames = await caches.keys();
  const status = {};

  for (const name of cacheNames) {
    const cache = await caches.open(name);
    const keys = await cache.keys();
    status[name] = {
      count: keys.length,
      urls: keys.slice(0, 10).map((r) => r.url),
    };
  }

  return status;
}

async function precacheApiData(endpoints) {
  if (!Array.isArray(endpoints)) return;

  const cache = await caches.open(API_CACHE);

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint);
      if (response.ok) {
        const headers = new Headers(response.headers);
        headers.set('sw-cached-at', Date.now().toString());

        const cachedResponse = new Response(await response.blob(), {
          status: response.status,
          statusText: response.statusText,
          headers,
        });

        await cache.put(endpoint, cachedResponse);
      }
    } catch (error) {
      console.log('[ServiceWorker] Failed to precache:', endpoint);
    }
  }
}

// ============= PERIODIC BACKGROUND SYNC =============

self.addEventListener('periodicsync', (event) => {
  console.log('[ServiceWorker] Periodic sync:', event.tag);

  if (event.tag === 'sync-data') {
    event.waitUntil(syncPendingChanges());
  }
});

console.log('[ServiceWorker] Service Worker loaded - Version:', CACHE_VERSION);
