import { useUiStore } from '../../stores/uiStore'

const TABS = [
  { id: 'inbox', label: 'Inbox', icon: '↓' },
  { id: 'today', label: 'Today', icon: '◉' },
  { id: 'upcoming', label: 'Upcoming', icon: '→' },
  { id: 'spaces', label: 'Spaces', icon: '◫' },
]

export default function BottomNav() {
  const { activeView, setView, toggleSidebar } = useUiStore()

  const handleTap = (id) => {
    if (id === 'spaces') toggleSidebar()
    else setView(id)
  }

  return (
    <nav className="safe-bottom" style={{
      minHeight: 64,
      background: 'rgba(6,6,8,0.85)',
      backdropFilter: 'blur(20px) saturate(1.3)',
      borderTop: '1px solid rgba(255,255,255,0.04)',
    }}>
      <div className="flex items-center justify-around h-16" style={{ padding: '0 20px' }}>
        {TABS.map((tab) => {
          const active = tab.id !== 'spaces' && activeView === tab.id
          return (
            <button key={tab.id} onClick={() => handleTap(tab.id)}
              className="flex flex-col items-center gap-1 flex-1 py-1"
              style={{ color: active ? 'var(--accent-flame)' : 'var(--color-text-secondary)' }}>
              <span style={{
                fontSize: 20, lineHeight: 1,
                textShadow: active ? '0 0 12px rgba(255,107,53,0.4)' : 'none',
              }}>{tab.icon}</span>
              <span style={{ fontSize: 10, fontWeight: 500 }}>{tab.label}</span>
              {active && (
                <div style={{
                  width: 20, height: 3, borderRadius: 9999,
                  background: 'linear-gradient(135deg, #ff6b35, #ffaa40)',
                  boxShadow: '0 0 8px rgba(255,107,53,0.4)',
                }} />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
