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
    if (id === 'spaces') {
      toggleSidebar()
    } else {
      setView(id)
    }
  }

  return (
    <nav className="bg-surface border-t border-border safe-bottom" style={{ minHeight: 64 }}>
      <div className="flex items-center justify-around h-14" style={{ padding: '0 20px' }}>
        {TABS.map((tab) => {
          const active = tab.id !== 'spaces' && activeView === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => handleTap(tab.id)}
              className={`flex flex-col items-center gap-0.5 flex-1 py-1 ${active ? 'text-accent' : 'text-text-dim'}`}
            >
              <span className="text-[17px] leading-none">{tab.icon}</span>
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
