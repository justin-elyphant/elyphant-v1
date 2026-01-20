/**
 * Service Worker for aggressive caching of marketplace data
 * Version-based cache invalidation ensures fresh builds are served
 */

const CACHE_VERSION = 'v2';
const CACHE_NAME = `marketplace-cache-${CACHE_VERSION}`;
const STATIC_CACHE_NAME = `marketplace-static-${CACHE_VERSION}`;
const API_CACHE_NAME = `marketplace-api-${CACHE_VERSION}`;

// Cache duration in milliseconds
const CACHE_DURATION = {
  STATIC: 24 * 60 * 60 * 1000, // 24 hours
  API: 5 * 60 * 1000, // 5 minutes
  IMAGES: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// Resources to cache immediately
// Note: Only runtime-available paths - build artifacts handled by cache strategies
const STATIC_RESOURCES = [
  '/',
  '/marketplace'
];

// API endpoints to cache
const CACHEABLE_API_PATTERNS = [
  /\/api\/products/,
  /\/api\/search/,
  /functions\/v1\/get-products/,
  /functions\/v1\/enhanced-zinc-search/
];

// Install event - cache static resources
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static resources');
        return cache.addAll(STATIC_RESOURCES);
      })
      .then(() => {
        console.log('Service Worker: Installation complete');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Installation failed', error);
      })
  );
});

// Activate event - clean up old caches (version-based invalidation)
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              // Delete any cache that doesn't match current version
              return !cacheName.includes(CACHE_VERSION);
            })
            .map((cacheName) => {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('Service Worker: Activation complete');
        return self.clients.claim();
      })
  );
});

// Fetch event - handle requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle different resource types
  if (isStaticResource(request)) {
    event.respondWith(handleStaticResource(request));
  } else if (isAPIRequest(request)) {
    event.respondWith(handleAPIRequest(request));
  } else if (isImageRequest(request)) {
    event.respondWith(handleImageRequest(request));
  } else {
    // Default network-first strategy
    event.respondWith(handleDefaultRequest(request));
  }
});

// Check if request is for static resources
function isStaticResource(request) {
  const url = new URL(request.url);
  return url.pathname.includes('/static/') || 
         url.pathname.endsWith('.js') || 
         url.pathname.endsWith('.css') ||
         url.pathname.endsWith('.json');
}

// Check if request is for API
function isAPIRequest(request) {
  const url = new URL(request.url);
  return CACHEABLE_API_PATTERNS.some(pattern => pattern.test(url.pathname));
}

// Check if request is for images
function isImageRequest(request) {
  const url = new URL(request.url);
  return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url.pathname) ||
         url.hostname.includes('images.') ||
         url.hostname.includes('img.') ||
         url.pathname.includes('/images/');
}

// Handle static resources - cache first strategy
async function handleStaticResource(request) {
  try {
    const cache = await caches.open(STATIC_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse && !isExpired(cachedResponse, CACHE_DURATION.STATIC)) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Service Worker: Static resource fetch failed', error);
    const cache = await caches.open(STATIC_CACHE_NAME);
    return cache.match(request);
  }
}

// Handle API requests - network first with cache fallback
async function handleAPIRequest(request) {
  try {
    const cache = await caches.open(API_CACHE_NAME);
    
    // Try network first
    const networkResponse = await Promise.race([
      fetch(request),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Network timeout')), 3000)
      )
    ]);

    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    throw new Error('Network response not ok');
  } catch (error) {
    console.log('Service Worker: Network failed, trying cache', error.message);
    
    // Fallback to cache
    const cache = await caches.open(API_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse && !isExpired(cachedResponse, CACHE_DURATION.API)) {
      return cachedResponse;
    }
    
    // Return error response if no cache available
    return new Response(JSON.stringify({ error: 'Network unavailable' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle images - cache first with long TTL
async function handleImageRequest(request) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse && !isExpired(cachedResponse, CACHE_DURATION.IMAGES)) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Service Worker: Image fetch failed', error);
    
    // Return placeholder image if available
    const cache = await caches.open(CACHE_NAME);
    return cache.match('/placeholder.svg') || 
           new Response('', { status: 404 });
  }
}

// Handle default requests
async function handleDefaultRequest(request) {
  try {
    return await fetch(request);
  } catch (error) {
    console.error('Service Worker: Default request failed', error);
    return new Response('Offline', { status: 503 });
  }
}

// Check if cached response is expired
function isExpired(response, maxAge) {
  const dateHeader = response.headers.get('date');
  if (!dateHeader) return true;
  
  const cacheDate = new Date(dateHeader);
  const now = new Date();
  
  return (now.getTime() - cacheDate.getTime()) > maxAge;
}

// Background sync for prefetching
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'PREFETCH_SEARCHES') {
    const { queries } = event.data;
    prefetchSearches(queries);
  }
});

// Prefetch likely searches
async function prefetchSearches(queries) {
  console.log('Service Worker: Prefetching searches', queries);
  
  const cache = await caches.open(API_CACHE_NAME);
  
  for (const query of queries) {
    try {
      const searchUrl = `/functions/v1/enhanced-zinc-search?query=${encodeURIComponent(query)}&limit=10`;
      const request = new Request(searchUrl);
      
      // Check if already cached
      const cachedResponse = await cache.match(request);
      if (cachedResponse && !isExpired(cachedResponse, CACHE_DURATION.API)) {
        continue;
      }
      
      // Fetch and cache
      const response = await fetch(request);
      if (response.ok) {
        await cache.put(request, response.clone());
        console.log('Service Worker: Prefetched', query);
      }
    } catch (error) {
      console.warn('Service Worker: Prefetch failed for', query, error);
    }
  }
}