const CACHE_NAME = 'v2'
const PRE_CACHE = [
  'style.css',
  'index-offline.html'
]
const CACHE_URL = [
  'sergivb01.me',
  'cdnjs.com',
  '127.0.0.1'
]
const BLOCK_HOSTS = [
  'google',
  'facebook'
]

const requestBlackListed = request => {
  const url = new URL(request.url)
  return request.method !== 'GET' ||
    request.url.match(/\/notifications(\?|\/)/) ||
    BLOCK_HOSTS.indexOf(url.host) != -1
}

const shouldCache = url => {
  return CACHE_URL.indexOf(new URL(url).host) != -1
}

const fetchedFromNetwork = response => {
  var cacheCopy = response.clone()
  caches
    .open(CACHE_NAME)
    .then(cache => {
      if (shouldCache(event.request.url)) {
        cache.put(event.request, cacheCopy)
      }

    })
  return response
}

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

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(PRE_CACHE).then(() => {
        console.log('WORKER: Install completed')
      })
    })
  )
})

self.addEventListener('fetch', event => {
  if (requestBlackListed(event.request)) {
    return
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached && shouldCache(event.request.url)) {
        return cached
      }
      return fetch(event.request)
        .then(fetchedFromNetwork)
        .catch(() => {
          return cached || caches.match('/index-offline.html')
        })
    })
  )
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