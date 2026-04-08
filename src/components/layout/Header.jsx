import { useUiStore } from '../../stores/uiStore'
import { useSpaceStore } from '../../stores/spaceStore'
import { useListStore } from '../../stores/listStore'
import { useTodoStore } from '../../stores/todoStore'
import { getGreeting } from '../../lib/utils'

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
      <header className="flex items-center safe-top" style={{ padding: '8px 20px' }}>
        <span style={{ fontSize: 14, fontWeight: 600 }} className="flex-1">{title}</span>
        {activeCount > 0 && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)' }}>{activeCount}</span>}
      </header>
    )
  }

  return (
    <header className="safe-top" style={{ padding: '48px 20px 0' }}>
      <p className="animate-task-enter" style={{ fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-secondary)', marginBottom: 8, animationDelay: '0ms' }}>
        {getGreeting()}
      </p>
      <div className="flex items-center justify-between animate-task-enter" style={{ animationDelay: '50ms' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 34, letterSpacing: '-0.02em', fontVariationSettings: "'opsz' 144" }}>{title}</h1>
        {isChecklist && doneCount > 0 && (
          <button onClick={() => { resetList(activeListId); showUndo('List reset', () => {}) }} style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Reset</button>
        )}
      </div>
      {(activeCount > 0 || doneCount > 0) && (
        <p className="animate-task-enter" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.02em', color: 'var(--text-secondary)', marginTop: 8, animationDelay: '100ms' }}>
          {activeCount > 0 && <span>{activeCount} remaining</span>}
          {activeCount > 0 && doneCount > 0 && <span style={{ margin: '0 6px', opacity: 0.3 }}>·</span>}
          {doneCount > 0 && <span>{doneCount} done</span>}
        </p>
      )}
      {/* Rainbow divider */}
      <div className="animate-task-enter" style={{
        height: 2, borderRadius: 1, marginTop: 16, animationDelay: '150ms', opacity: 0.5,
        background: 'linear-gradient(90deg, transparent 0%, #ff7b54 15%, #f472b6 40%, #a78bfa 65%, #60a5fa 85%, transparent 100%)',
      }} />
    </header>
  )
}
