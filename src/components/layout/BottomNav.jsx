import { useCallback } from 'react'
import { useUiStore } from '../../stores/uiStore'
import { useSwipe } from '../../hooks/useSwipe'

const TABS = [
  { id: 'today', label: 'Today', icon: '◉' },
  { id: 'upcoming', label: 'Upcoming', icon: '→' },
  { id: 'notes', label: 'Notes', icon: '✎' },
]

const VIEW_ORDER = ['today', 'upcoming', 'notes']

export default function BottomNav({ hidden = false }) {
  const { activeView, setView, toggleSidebar } = useUiStore()

  const swipeToView = useCallback((direction) => {
    const idx = VIEW_ORDER.indexOf(activeView)
    const current = idx === -1 ? 0 : idx
    const next = current + direction
    // Swipe right past Today → open sidebar
    if (next < 0) { toggleSidebar(); return }
    if (next >= 0 && next < VIEW_ORDER.length) setView(VIEW_ORDER[next])
  }, [activeView, setView, toggleSidebar])

  const swipeHandlers = useSwipe({
    onSwipeLeft: () => swipeToView(1),
    onSwipeRight: () => swipeToView(-1),
  })

  return (
    <nav {...swipeHandlers} className="safe-bottom" style={{
      minHeight: hidden ? 20 : 64,
      background: hidden ? 'transparent' : 'var(--surface-glass)',
      backdropFilter: hidden ? 'none' : 'blur(24px) saturate(1.3)',
      WebkitBackdropFilter: hidden ? 'none' : 'blur(24px) saturate(1.3)',
      borderTop: hidden ? 'none' : '1px solid var(--border-subtle)',
      transition: 'min-height 200ms',
    }}>
      {!hidden && (
        <div className="flex items-center justify-around h-16" style={{ padding: '0 16px' }}>
          {TABS.map((tab) => {
            const active = activeView === tab.id
            return (
              <button key={tab.id} onClick={() => setView(tab.id)}
                className="flex flex-col items-center gap-1 flex-1 py-1"
                style={{ color: active ? 'var(--accent-coral)' : 'var(--text-secondary)' }}>
                <span style={{ fontSize: 18, lineHeight: 1, textShadow: active ? '0 0 14px rgba(255,123,84,0.35)' : 'none' }}>{tab.icon}</span>
                <span style={{ fontSize: 9, fontWeight: 500 }}>{tab.label}</span>
                {active && <div style={{ width: 20, height: 3, borderRadius: 9999, background: 'linear-gradient(135deg, #ff7b54, #f472b6)', boxShadow: '0 0 10px rgba(255,123,84,0.35)' }} />}
              </button>
            )
          })}
        </div>
      )}
    </nav>
  )
}
