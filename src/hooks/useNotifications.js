import { useEffect, useRef } from 'react'
import { useTodoStore } from '../stores/todoStore'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

const NOTIFIED_KEY = 'whim_notified'
const SUB_SAVED_KEY = 'whim_push_sub_saved'
const CHECK_INTERVAL = 30000

function getNotified() {
  try { return JSON.parse(localStorage.getItem(NOTIFIED_KEY) || '[]') } catch { return [] }
}
function addNotified(id) {
  const list = getNotified()
  list.push(id)
  localStorage.setItem(NOTIFIED_KEY, JSON.stringify(list.slice(-200)))
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i)
  return outputArray
}

async function subscribeToPush(userId) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return
  if (!isSupabaseConfigured() || !userId) return

  const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY
  if (!vapidKey) return

  try {
    const registration = await navigator.serviceWorker.ready

    // Check existing subscription
    let subscription = await registration.pushManager.getSubscription()

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      })
    }

    // Save to Supabase if not already saved
    const subKey = `${SUB_SAVED_KEY}_${subscription.endpoint.slice(-20)}`
    if (localStorage.getItem(subKey)) return

    const subJson = subscription.toJSON()
    const { error } = await supabase.from('push_subscriptions').upsert({
      user_id: userId,
      endpoint: subscription.endpoint,
      keys: subJson.keys,
    }, { onConflict: 'endpoint' })

    if (!error) {
      localStorage.setItem(subKey, '1')
    } else {
      console.error('Push subscription save error:', error.message)
    }
  } catch (err) {
    console.error('Push subscribe error:', err)
  }
}

export function useNotifications(userId) {
  const asked = useRef(false)

  useEffect(() => {
    // Request permission and subscribe
    if (!asked.current && 'Notification' in window) {
      asked.current = true
      if (Notification.permission === 'granted') {
        subscribeToPush(userId)
      } else if (Notification.permission === 'default') {
        setTimeout(async () => {
          const result = await Notification.requestPermission()
          if (result === 'granted') subscribeToPush(userId)
        }, 3000)
      }
    }

    // Local fallback: check for due tasks while app is open
    const check = () => {
      if (!('Notification' in window) || Notification.permission !== 'granted') return

      const todos = useTodoStore.getState().todos
      const now = new Date()
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
      const notified = getNotified()

      for (const todo of todos) {
        if (todo.status !== 'active') continue
        if (!todo.dueDate || !todo.dueTime) continue
        if (todo.dueDate !== todayStr) continue
        if (notified.includes(todo.id)) continue

        const [dueH, dueM] = todo.dueTime.split(':').map(Number)
        const dueMinutes = dueH * 60 + dueM
        const nowMinutes = now.getHours() * 60 + now.getMinutes()

        if (nowMinutes >= dueMinutes && nowMinutes <= dueMinutes + 5) {
          addNotified(todo.id)
          new Notification('Whim', {
            body: todo.text,
            icon: '/icons/icon-192.png',
            badge: '/icons/icon-192.png',
            tag: todo.id,
            renotify: false,
          })
          if (navigator.vibrate) navigator.vibrate([100, 50, 100])
        }
      }
    }

    check()
    const interval = setInterval(check, CHECK_INTERVAL)
    return () => clearInterval(interval)
  }, [userId])
}
