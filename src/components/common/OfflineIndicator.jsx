import { useState, useEffect } from 'react'

export default function OfflineIndicator() {
  const [offline, setOffline] = useState(!navigator.onLine)
  const [syncError, setSyncError] = useState(false)

  useEffect(() => {
    const on = () => { setOffline(false); setSyncError(false) }
    const off = () => setOffline(true)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)

    // Listen for sync errors from useSync
    const handleSyncError = () => setSyncError(true)
    const handleSyncOk = () => setSyncError(false)
    window.addEventListener('whim-sync-error', handleSyncError)
    window.addEventListener('whim-sync-ok', handleSyncOk)

    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
      window.removeEventListener('whim-sync-error', handleSyncError)
      window.removeEventListener('whim-sync-ok', handleSyncOk)
    }
  }, [])

  if (!offline && !syncError) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 safe-top" style={{
      background: 'var(--bg-float)', borderBottom: '1px solid var(--border-subtle)',
      padding: '6px 20px', textAlign: 'center', fontSize: 12, fontWeight: 500,
      color: 'var(--accent-amber)',
    }}>
      {offline ? 'Offline — changes saved locally' : 'Sync issue — retrying...'}
    </div>
  )
}
