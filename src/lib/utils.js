export const uid = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
      })

// Parse a YYYY-MM-DD date string as local (not UTC)
export const parseLocalDate = (dateStr) => {
  if (!dateStr) return null
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const toLocalDateStr = (date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export const formatRelativeDate = (dateStr) => {
  if (!dateStr) return null
  const date = parseLocalDate(dateStr)
  if (!date) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  date.setHours(0, 0, 0, 0)

  if (date.getTime() === today.getTime()) return 'Today'
  if (date.getTime() === tomorrow.getTime()) return 'Tomorrow'
  if (date.getTime() === yesterday.getTime()) return 'Yesterday'
  return date.toLocaleDateString('en', { month: 'short', day: 'numeric' })
}

export const getGreeting = () => {
  const h = new Date().getHours()
  if (h < 5) return 'Late night'
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export const isToday = (dateStr) => {
  if (!dateStr) return false
  const d = parseLocalDate(dateStr)
  if (!d) return false
  const today = new Date()
  return d.toDateString() === today.toDateString()
}

export const isFuture = (dateStr) => {
  if (!dateStr) return false
  const d = parseLocalDate(dateStr)
  if (!d) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return d >= today && !isToday(dateStr)
}

export const getSnoozeLaterToday = () => {
  const d = new Date()
  d.setHours(d.getHours() + 3)
  // If it'd be past 9 PM, snooze to 9 AM tomorrow
  if (d.getHours() >= 21) {
    d.setDate(d.getDate() + 1)
    d.setHours(9, 0, 0, 0)
  }
  return d.toISOString()
}

export const getSnoozeTomorrow = () => {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  d.setHours(9, 0, 0, 0)
  return d.toISOString()
}
