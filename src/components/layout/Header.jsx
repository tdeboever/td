import { useUiStore } from '../../stores/uiStore'
import { useSpaceStore } from '../../stores/spaceStore'
import { useListStore } from '../../stores/listStore'
import { useTodoStore } from '../../stores/todoStore'

const VIEW_TITLES = { inbox: 'Inbox', today: 'Today', upcoming: 'Upcoming' }

export default function Header() {
  const { activeView, activeSpaceId, activeListId, inputFocused } = useUiStore()
  const spaces = useSpaceStore((s) => s.spaces)
  const lists = useListStore((s) => s.lists)
  const todos = useTodoStore((s) => s.todos)
  const resetList = useTodoStore((s) => s.resetList)
  const showUndo = useUiStore((s) => s.showUndo)

  let title = VIEW_TITLES[activeView] || ''
  let activeCount = 0, doneCount = 0, isChecklist = false
  const c = (fn) => { const m = todos.filter(fn); activeCount = m.filter((t) => t.status === 'active').length; doneCount = m.filter((t) => t.status === 'done' || t.status === 'ghost').length }
  if (activeView === 'inbox') c((t) => !t.listId && !t.spaceId)
  else if (activeView === 'today') { const d = new Date().toDateString(); c((t) => t.dueDate && new Date(t.dueDate).toDateString() === d) }
  else if (activeView === 'upcoming') { const n = new Date(); n.setHours(0,0,0,0); c((t) => t.dueDate && new Date(t.dueDate) > n) }
  else if (activeView === 'space') { const s = spaces.find((s) => s.id === activeSpaceId); if (s) title = s.name; c((t) => t.spaceId === activeSpaceId) }
  else if (activeView === 'list') { const l = lists.find((l) => l.id === activeListId); if (l) { title = l.name; isChecklist = l.type === 'checklist' }; c((t) => t.listId === activeListId) }

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
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 28, letterSpacing: '-0.02em', fontVariationSettings: "'opsz' 144" }}>{title}</h1>
        <div className="flex items-center gap-3">
          {(activeCount > 0 || doneCount > 0) && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.02em', color: 'var(--text-secondary)' }}>
              {activeCount > 0 && `${activeCount}`}
              {activeCount > 0 && doneCount > 0 && <span style={{ opacity: 0.3, margin: '0 3px' }}>·</span>}
              {doneCount > 0 && <span style={{ color: 'var(--text-ghost)' }}>{doneCount} done</span>}
            </span>
          )}
          {isChecklist && doneCount > 0 && (
            <button onClick={() => { resetList(activeListId); showUndo('List reset', () => {}) }} style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Reset</button>
          )}
        </div>
      </div>
    </header>
  )
}
