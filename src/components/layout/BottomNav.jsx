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
    <nav className="bg-surface safe-bottom" style={{ minHeight: 64, borderTop: '1px solid rgba(255,107,53,0.1)' }}>
      <div className="flex items-center justify-around h-16" style={{ padding: '0 20px' }}>
        {TABS.map((tab) => {
          const active = tab.id !== 'spaces' && activeView === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => handleTap(tab.id)}
              className={`flex flex-col items-center gap-1 flex-1 py-1 ${active ? 'text-accent' : 'text-text-dim'}`}
            >
              <span className="leading-none" style={{
                fontSize: 22,
                textShadow: active ? '0 0 8px rgba(255,107,53,0.3)' : 'none',
              }}>{tab.icon}</span>
              <span className="text-[11px] font-medium">{tab.label}</span>
              {active && <div className="w-1 h-1 rounded-full bg-accent animate-breathe" />}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
