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

// On activate: clean up old caches from previous versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names
          .filter((name) => !name.startsWith('workbox-') && name !== 'google-fonts-cache' && name !== 'gstatic-fonts-cache')
          .map((name) => caches.delete(name))
      )
    })
  )
})

// Push notification handler
self.addEventListener('push', (event) => {
  let data = { title: 'Whim', body: 'You have a task due' }
  try {
    if (event.data) data = event.data.json()
  } catch {
    if (event.data) data.body = event.data.text()
  }

  const actions = []
  if (data.todoId) {
    actions.push(
      { action: 'complete', title: '✓ Done' },
      { action: 'snooze', title: '⏰ 1hr' },
    )
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'Whim', {
      body: data.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: data.tag || 'whim-reminder',
      renotify: true,
      vibrate: [100, 50, 100],
      actions,
      data,
    })
  )
})

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''

// Helper: perform a todo action via edge function (uses service role key server-side)
async function todoAction(todoId, action) {
  if (!SUPABASE_URL) return false
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/todo-action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ todoId, action }),
    })
    return res.ok
  } catch {
    return false
  }
}

// Notification click — handle actions or focus app
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const data = event.notification.data || {}
  const action = event.action

  if (action === 'complete' && data.todoId) {
    event.waitUntil(
      todoAction(data.todoId, 'complete').then(() => {
        return self.clients.matchAll({ type: 'window' }).then(clients => {
          clients.forEach(c => c.postMessage({ type: 'TODO_UPDATED' }))
        })
      })
    )
    return
  }

  if (action === 'snooze' && data.todoId) {
    event.waitUntil(
      todoAction(data.todoId, 'snooze').then(() => {
        return self.clients.matchAll({ type: 'window' }).then(clients => {
          clients.forEach(c => c.postMessage({ type: 'TODO_UPDATED' }))
        })
      })
    )
    return
  }

  // Default: focus or open app
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      if (clients.length > 0) {
        return clients[0].focus()
      }
      return self.clients.openWindow('/')
    })
  )
})
