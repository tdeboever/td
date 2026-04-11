import { useUiStore } from '../../stores/uiStore'

const TABS = [
  { id: 'today', label: 'Today', icon: '◉' },
  { id: 'upcoming', label: 'Upcoming', icon: '→' },
  { id: 'notes', label: 'Notes', icon: '✎' },
]

export default function BottomNav() {
  const { activeView, setView } = useUiStore()

  return (
    <nav className="safe-bottom" style={{
      minHeight: 64,
      background: 'var(--surface-glass)',
      backdropFilter: 'blur(24px) saturate(1.3)',
      WebkitBackdropFilter: 'blur(24px) saturate(1.3)',
      borderTop: '1px solid var(--border-subtle)',
    }}>
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
    </nav>
  )
}
