import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './pages/App'
import './styles/globals.css'

// Prevent browser back gesture from leaving the app
window.history.pushState(null, '', window.location.href)
window.addEventListener('popstate', () => {
  window.history.pushState(null, '', window.location.href)
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
