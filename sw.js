/**
 * Sergi Vos Bosch - Service Workers file
 *
 * This is a service worker that I use in many of my projects
 * to cache assets or responses.
 */

// Name & version of the cache, useful for cleaning it up
const CACHE_NAME = 'v2'

// List of URLs that will be prefetched (offline page, assets, ...)
const PRE_CACHE = [
  'style.css',
  'index-offline.html'
]

// Allowed domains to cache
const CACHE_URL = [
  'sergivb01.me',
  'cdnjs.com',
  '127.0.0.1'
]

// Hostname list that should be blocked
const BLOCK_HOSTS = [
  'google',
  'facebook'
]

/**
 * Called once the Service Worker has been "initialized"
 */
self.addEventListener('activate', () => {
  caches.keys().then(cacheNames => {
    return Promise.all(
      cacheNames.filter(cacheName => {
        return cacheName != CACHE_NAME
      }).map(cacheName => {
        console.log(`WORKER: Cleared ${cacheName} from Cache!`)
        return caches.delete(cacheName)
      })
    )
  })
})

/**
 * Called once the Service Worker has been installed
 */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(PRE_CACHE).then(() => {
        console.log('WORKER: Install completed')
      })
    })
  )
})

/**
 * Called when a resource is fetched
 */
self.addEventListener('fetch', event => {
  if (requestBlackListed(event.request)) return

  event.respondWith(
    caches.match(event.request).then(cached => {
      // Check if can be cached & return from cache (if cached)
      if (cached && shouldCache(event.request.url))
        return cached


      return fetch(event.request)
        .then(fetchedFromNetwork)
        .catch(() => {
          // Return the offline page
          return cached || caches.match('/index-offline.html')
        })
    })
  )

  // Fetch the resource
  const fetchedFromNetwork = response => {
    var cacheCopy = response.clone()
    caches
      .open(CACHE_NAME)
      .then(cache => {
        // If can be cached, add to cache
        if (shouldCache(event.request.url))
          cache.put(event.request, cacheCopy)
      })
    return response
  }
})

// Uncomment if socket is available
/* self.addEventListener('push', (event) => {
  var title = '🔔 Notification! 🔔'
  var body = event.data.text()
  var icon = 'logo.png'
  var tag = 'default-tag' + body
  event.waitUntil(
    self.registration.showNotification(title, {
      body: body,
      icon: icon,
      tag: tag,
      data: {
        url: 'https://sergivb01.me'
      }
    })
  )
})*/

// Filter request method and path
const requestBlackListed = request => {
  const url = new URL(request.url)
  return request.method !== 'GET' ||
    request.url.match(/\/notifications(\?|\/)/) ||
    request.url.match(/\/alerts(\?|\/)/) ||
    BLOCK_HOSTS.indexOf(url.host) != -1
}

// Check if URL is in allowed domains
const shouldCache = url => {
  return CACHE_URL.indexOf(new URL(url).host) != -1
}