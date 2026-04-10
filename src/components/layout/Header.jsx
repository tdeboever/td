import { useState } from 'react'
import { useUiStore } from '../../stores/uiStore'
import SearchBar from '../todo/SearchBar'
import { useSpaceStore } from '../../stores/spaceStore'
import { useListStore } from '../../stores/listStore'
import { useTodoStore } from '../../stores/todoStore'

const VIEW_TITLES = { today: 'Today', upcoming: 'Upcoming', notes: 'Notes' }

export default function Header() {
  const { activeView, activeSpaceId, activeListId, inputFocused } = useUiStore()
  const spaces = useSpaceStore((s) => s.spaces)
  const lists = useListStore((s) => s.lists)
  const todos = useTodoStore((s) => s.todos)
  const resetList = useTodoStore((s) => s.resetList)
  const showUndo = useUiStore((s) => s.showUndo)

  const [showSearch, setShowSearch] = useState(false)
  let title = VIEW_TITLES[activeView] || 'Today'
  // Override title when filtering by space/list
  if (activeListId) {
    const list = lists.find(l => l.id === activeListId)
    if (list) title = list.name
  } else if (activeSpaceId) {
    const space = spaces.find(s => s.id === activeSpaceId)
    if (space) title = space.name
  }
  let activeCount = 0, doneCount = 0
  const c = (fn) => { const m = todos.filter(fn); activeCount = m.filter((t) => t.status === 'active').length; doneCount = m.filter((t) => t.status === 'done' || t.status === 'ghost').length }

  // Count based on view + active filter
  let filterFn = (t) => true
  if (activeListId) filterFn = (t) => t.listId === activeListId
  else if (activeSpaceId) filterFn = (t) => t.spaceId === activeSpaceId

  if (activeView === 'today') c((t) => filterFn(t) && (!t.dueDate || new Date(t.dueDate).toDateString() === new Date().toDateString()))
  else if (activeView === 'upcoming') { const n = new Date(); n.setHours(0,0,0,0); c((t) => filterFn(t) && t.dueDate && new Date(t.dueDate) > n) }

  if (inputFocused) {
    return (
      <header className="flex items-center safe-top" style={{ padding: '6px 20px' }}>
        <span style={{ fontSize: 14, fontWeight: 600 }} className="flex-1">{title}</span>
        {activeCount > 0 && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)' }}>{activeCount}</span>}
      </header>
    )
  }

  return (
    <header className="safe-top" style={{ padding: '16px 20px 12px' }}>
      <div className="flex items-baseline justify-between">
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 34, letterSpacing: '-0.03em' }}>{title}</h1>
        <div className="flex items-center gap-4">
          <button data-search-trigger onClick={() => setShowSearch(true)} style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1 }}>⌕</button>
          {(activeCount > 0 || doneCount > 0) && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.02em', color: 'var(--text-secondary)' }}>
              {activeCount > 0 && `${activeCount}`}
              {activeCount > 0 && doneCount > 0 && <span style={{ opacity: 0.3, margin: '0 3px' }}>·</span>}
              {doneCount > 0 && <span style={{ color: 'var(--text-ghost)' }}>{doneCount} done</span>}
            </span>
          )}
        </div>
      </div>
      {showSearch && <SearchBar onClose={() => setShowSearch(false)} />}
    </header>
  )
}
