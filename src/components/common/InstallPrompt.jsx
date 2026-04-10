import { useState, useEffect } from 'react'

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Don't show if already installed or dismissed
    if (window.matchMedia('(display-mode: standalone)').matches) return
    if (localStorage.getItem('whim_install_dismissed')) return

    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      // Small delay so the app loads first
      setTimeout(() => setShow(true), 2000)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    setDeferredPrompt(null)
    setShow(false)
    if (outcome === 'dismissed') {
      localStorage.setItem('whim_install_dismissed', '1')
    }
  }

  const handleDismiss = () => {
    setShow(false)
    localStorage.setItem('whim_install_dismissed', '1')
  }

  if (!show) return null

  return (
    <div className="fixed bottom-24 left-4 right-4 z-50 animate-slide-up" style={{ maxWidth: 480, margin: '0 auto' }}>
      <div style={{
        background: 'var(--bg-float)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 0 0 1px var(--border-visible), 0 12px 40px rgba(0,0,0,0.3)',
        borderRadius: 20, padding: '20px',
      }}>
        <div className="flex items-start gap-4">
          <div style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            background: 'linear-gradient(135deg, var(--accent-rose), var(--accent-coral))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
              <path d="M11 3v12M6 10l5 5 5-5" />
              <path d="M4 17h14" />
            </svg>
          </div>
          <div className="flex-1">
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 }}>Add Whim to your home screen</p>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>Quick access, works offline, feels like a real app</p>
          </div>
        </div>
        <div className="flex gap-3 mt-4">
          <button onClick={handleDismiss} className="flex-1" style={{
            padding: '10px 0', borderRadius: 12, fontSize: 14, fontWeight: 500,
            color: 'var(--text-secondary)', background: 'var(--surface-card)',
          }}>Not now</button>
          <button onClick={handleInstall} className="flex-1" style={{
            padding: '10px 0', borderRadius: 12, fontSize: 14, fontWeight: 600,
            color: 'white', background: 'linear-gradient(135deg, var(--accent-coral), var(--accent-rose))',
            boxShadow: '0 2px 12px rgba(255,123,84,0.25)',
          }}>Install</button>
        </div>
      </div>
    </div>
  )
}
