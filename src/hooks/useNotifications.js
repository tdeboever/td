import { useEffect, useRef } from 'react'
import { useTodoStore } from '../stores/todoStore'

const NOTIFIED_KEY = 'whim_notified'
const CHECK_INTERVAL = 30000 // 30 seconds

function getNotified() {
  try { return JSON.parse(localStorage.getItem(NOTIFIED_KEY) || '[]') } catch { return [] }
}
function addNotified(id) {
  const list = getNotified()
  list.push(id)
  // Keep only last 200
  localStorage.setItem(NOTIFIED_KEY, JSON.stringify(list.slice(-200)))
}

export function useNotifications() {
  const asked = useRef(false)

  useEffect(() => {
    // Request permission once
    if (!asked.current && 'Notification' in window && Notification.permission === 'default') {
      asked.current = true
      // Delay so it doesn't feel aggressive
      setTimeout(() => Notification.requestPermission(), 5000)
    }

    const check = () => {
      if (!('Notification' in window) || Notification.permission !== 'granted') return

      const todos = useTodoStore.getState().todos
      const now = new Date()
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
      const currentHour = String(now.getHours()).padStart(2, '0')
      const currentMin = String(now.getMinutes()).padStart(2, '0')
      const currentTime = `${currentHour}:${currentMin}`
      const notified = getNotified()

      for (const todo of todos) {
        if (todo.status !== 'active') continue
        if (!todo.dueDate || !todo.dueTime) continue
        if (todo.dueDate !== todayStr) continue
        if (notified.includes(todo.id)) continue

        // Check if time has passed (within the last 5 minutes)
        const [dueH, dueM] = todo.dueTime.split(':').map(Number)
        const dueMinutes = dueH * 60 + dueM
        const nowMinutes = now.getHours() * 60 + now.getMinutes()

        if (nowMinutes >= dueMinutes && nowMinutes <= dueMinutes + 5) {
          // Due now!
          addNotified(todo.id)

          const timeLabel = todo.dueTime.replace(':00', '').replace('09:', '9:')
          new Notification('Whim', {
            body: `${todo.text}`,
            icon: '/icons/icon-192.png',
            badge: '/icons/icon-192.png',
            tag: todo.id,
            renotify: false,
          })

          // Also vibrate if available
          if (navigator.vibrate) navigator.vibrate([100, 50, 100])
        }
      }
    }

    // Check immediately then every 30s
    check()
    const interval = setInterval(check, CHECK_INTERVAL)
    return () => clearInterval(interval)
  }, [])
}
