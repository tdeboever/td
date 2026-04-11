import { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import App from './pages/App'
import './styles/globals.css'

// Prevent browser back gesture from leaving the app
window.history.pushState(null, '', window.location.href)
window.addEventListener('popstate', () => {
  window.history.pushState(null, '', window.location.href)
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
