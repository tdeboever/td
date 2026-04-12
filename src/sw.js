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

// Helper: update a todo via Supabase REST API
async function updateTodoViaApi(todoId, updates) {
  // Try to get Supabase config from an open client
  const clients = await self.clients.matchAll({ type: 'window' })
  let supabaseUrl, supabaseKey

  for (const client of clients) {
    try {
      const msg = await new Promise((resolve) => {
        const ch = new MessageChannel()
        ch.port1.onmessage = (e) => resolve(e.data)
        client.postMessage({ type: 'GET_SUPABASE_CONFIG' }, [ch.port2])
        setTimeout(() => resolve(null), 1000)
      })
      if (msg?.supabaseUrl) { supabaseUrl = msg.supabaseUrl; supabaseKey = msg.supabaseKey; break }
    } catch {}
  }

  if (!supabaseUrl) {
    // Fallback: read from a cached config file
    try {
      const res = await fetch('/supabase-config.json')
      if (res.ok) {
        const config = await res.json()
        supabaseUrl = config.url
        supabaseKey = config.key
      }
    } catch {}
  }

  if (!supabaseUrl) return false

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/todos?id=eq.${todoId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify(updates),
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
      updateTodoViaApi(data.todoId, {
        status: 'done',
        updated_at: new Date().toISOString(),
      }).then(() => {
        // Notify open clients to refresh
        return self.clients.matchAll({ type: 'window' }).then(clients => {
          clients.forEach(c => c.postMessage({ type: 'TODO_UPDATED', todoId: data.todoId, status: 'done' }))
        })
      })
    )
    return
  }

  if (action === 'snooze' && data.todoId) {
    // Snooze 1 hour from now
    const snoozeTime = new Date()
    snoozeTime.setHours(snoozeTime.getHours() + 1)
    const h = String(snoozeTime.getHours()).padStart(2, '0')
    const m = String(snoozeTime.getMinutes()).padStart(2, '0')

    event.waitUntil(
      updateTodoViaApi(data.todoId, {
        due_time: `${h}:${m}`,
        updated_at: new Date().toISOString(),
      }).then(() => {
        return self.clients.matchAll({ type: 'window' }).then(clients => {
          clients.forEach(c => c.postMessage({ type: 'TODO_UPDATED', todoId: data.todoId, dueTime: `${h}:${m}` }))
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
