import { useUiStore } from '../../stores/uiStore'
import { useSpaceStore } from '../../stores/spaceStore'
import { useListStore } from '../../stores/listStore'
import { useTodoStore } from '../../stores/todoStore'

const VIEW_TITLES = {
  inbox: 'Inbox',
  today: 'Today',
  upcoming: 'Upcoming',
}

export default function Header() {
  const { activeView, activeSpaceId, activeListId, toggleSidebar } = useUiStore()
  const spaces = useSpaceStore((s) => s.spaces)
  const lists = useListStore((s) => s.lists)
  const todos = useTodoStore((s) => s.todos)

  let title = VIEW_TITLES[activeView] || ''
  let icon = null
  let count = 0

  if (activeView === 'inbox') {
    count = todos.filter((t) => !t.listId && !t.spaceId && t.status === 'active').length
  } else if (activeView === 'today') {
    const today = new Date().toDateString()
    count = todos.filter((t) => t.status === 'active' && t.dueDate && new Date(t.dueDate).toDateString() === today).length
  } else if (activeView === 'upcoming') {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    count = todos.filter((t) => t.status === 'active' && t.dueDate && new Date(t.dueDate) > today).length
  } else if (activeView === 'space') {
    const space = spaces.find((s) => s.id === activeSpaceId)
    if (space) {
      title = space.name
      icon = space.icon
      count = todos.filter((t) => t.spaceId === activeSpaceId && t.status === 'active').length
    }
  } else if (activeView === 'list') {
    const list = lists.find((l) => l.id === activeListId)
    if (list) {
      title = list.name
      count = todos.filter((t) => t.listId === activeListId && t.status === 'active').length
    }
  }

  return (
    <header className="flex items-center justify-between px-4 py-3 safe-top">
      <button onClick={toggleSidebar} className="p-2 -ml-2 text-text-dim hover:text-text">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 5h14M3 10h14M3 15h14" />
        </svg>
      </button>
      <div className="flex items-center gap-2">
        {icon && <span className="text-lg">{icon}</span>}
        <h1 className="text-base font-semibold">{title}</h1>
        {count > 0 && (
          <span className="text-xs text-text-dim bg-surface px-2 py-0.5 rounded-full">
            {count}
          </span>
        )}
      </div>
      <div className="w-9" /> {/* spacer for balance */}
    </header>
  )
}
