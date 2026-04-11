import { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import App from './pages/App'
import './styles/globals.css'

// Prevent browser back gesture from leaving the app
window.history.pushState(null, '', window.location.href)
window.addEventListener('popstate', () => {
  window.history.pushState(null, '', window.location.href)
})

// Auto-update: check for new version on load and tab focus
const APP_VERSION_KEY = 'whim_app_version'
async function checkForUpdate() {
  try {
    const res = await fetch('/version.json?t=' + Date.now())
    if (!res.ok) return
    const { v } = await res.json()
    const stored = localStorage.getItem(APP_VERSION_KEY)
    if (stored && stored !== String(v)) {
      // New version detected — clear caches and reload
      localStorage.setItem(APP_VERSION_KEY, String(v))
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations()
        await Promise.all(regs.map(r => r.unregister()))
      }
      const keys = await caches.keys()
      await Promise.all(keys.map(k => caches.delete(k)))
      window.location.reload()
    } else if (!stored) {
      localStorage.setItem(APP_VERSION_KEY, String(v))
    }
  } catch { /* offline, skip */ }
}
checkForUpdate()
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') checkForUpdate()
})

class ErrorBoundary extends Component {
  state = { error: null }
  static getDerivedStateFromError(e) { return { error: e } }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, textAlign: 'center', color: '#f4f0ed', background: '#1a1625', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Something went wrong</p>
          <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 24 }}>{this.state.error?.message}</p>
          <button onClick={() => window.location.reload()} style={{ padding: '10px 24px', borderRadius: 12, background: 'linear-gradient(135deg, #ff7b54, #f472b6)', color: 'white', fontSize: 14, fontWeight: 600 }}>Reload</button>
        </div>
      )
    }
    return this.props.children
  }
}

createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <StrictMode>
      <App />
    </StrictMode>
  </ErrorBoundary>,
)
