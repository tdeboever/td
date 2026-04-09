import { useState, useEffect } from 'react'

export default function OfflineIndicator() {
  const [offline, setOffline] = useState(!navigator.onLine)

  useEffect(() => {
    const on = () => setOffline(false)
    const off = () => setOffline(true)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  if (!offline) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 safe-top" style={{
      background: 'var(--bg-float)', borderBottom: '1px solid var(--border-subtle)',
      padding: '6px 20px', textAlign: 'center', fontSize: 12, fontWeight: 500,
      color: 'var(--accent-amber)',
    }}>
      Offline — changes saved locally
    </div>
  )
}
