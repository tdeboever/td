import { useUiStore } from '../../stores/uiStore'

const TABS = [
  { id: 'inbox', label: 'Inbox', icon: '📥' },
  { id: 'today', label: 'Today', icon: '📅' },
  { id: 'upcoming', label: 'Upcoming', icon: '🗓️' },
]

export default function BottomNav() {
  const { activeView, setView } = useUiStore()

  return (
    <nav className="flex items-center justify-around border-t border-border safe-bottom bg-bg pt-2 pb-1">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setView(tab.id)}
          className={`
            flex flex-col items-center gap-0.5 px-4 py-1 text-xs
            ${activeView === tab.id ? 'text-accent' : 'text-text-dim'}
          `}
        >
          <span className="text-lg">{tab.icon}</span>
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  )
}
