import { precacheAndRoute } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { CacheFirst } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'

// Precache all assets built by Vite
precacheAndRoute(self.__WB_MANIFEST)

// Cache Google Fonts
registerRoute(
  /^https:\/\/fonts\.googleapis\.com\/.*/i,
  new CacheFirst({ cacheName: 'google-fonts-cache', plugins: [new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 365 * 24 * 60 * 60 })] })
)
registerRoute(
  /^https:\/\/fonts\.gstatic\.com\/.*/i,
  new CacheFirst({ cacheName: 'gstatic-fonts-cache', plugins: [new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 365 * 24 * 60 * 60 })] })
)

// Skip waiting and claim clients immediately
self.skipWaiting()
self.clients.claim()

// Push notification handler
self.addEventListener('push', (event) => {
  let data = { title: 'Whim', body: 'You have a task due' }
  try {
    if (event.data) data = event.data.json()
  } catch {
    if (event.data) data.body = event.data.text()
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'Whim', {
      body: data.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: data.tag || 'whim-reminder',
      renotify: true,
      vibrate: [100, 50, 100],
      data: data,
    })
  )
})

// Notification click — focus or open the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      if (clients.length > 0) {
        return clients[0].focus()
      }
      return self.clients.openWindow('/')
    })
  )
})
