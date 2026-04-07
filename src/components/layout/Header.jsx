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
  let activeCount = 0
  let doneCount = 0
  let isChecklist = false

  const c = (fn) => { const m = todos.filter(fn); activeCount = m.filter((t) => t.status === 'active').length; doneCount = m.filter((t) => t.status === 'done' || t.status === 'ghost').length }
  if (activeView === 'inbox') c((t) => !t.listId && !t.spaceId)
  else if (activeView === 'today') { const d = new Date().toDateString(); c((t) => t.dueDate && new Date(t.dueDate).toDateString() === d) }
  else if (activeView === 'upcoming') { const n = new Date(); n.setHours(0,0,0,0); c((t) => t.dueDate && new Date(t.dueDate) > n) }
  else if (activeView === 'space') { const s = spaces.find((s) => s.id === activeSpaceId); if (s) title = s.name; c((t) => t.spaceId === activeSpaceId) }
  else if (activeView === 'list') {
    const l = lists.find((l) => l.id === activeListId)
    if (l) { title = l.name; isChecklist = l.type === 'checklist' }
    c((t) => t.listId === activeListId)
  }

  if (inputFocused) {
    return (
      <header className="flex items-center safe-top" style={{ padding: '8px 20px' }}>
        <span style={{ fontSize: 14, fontWeight: 600 }} className="flex-1">{title}</span>
        {activeCount > 0 && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-text-secondary)' }}>{activeCount}</span>}
      </header>
    )
  }

  return (
    <header className="safe-top" style={{ padding: '48px 20px 0' }}>
      {/* Greeting */}
      <p className="animate-task-enter" style={{
        fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.14em',
        color: 'var(--color-text-secondary)', marginBottom: 8, animationDelay: '0ms',
      }}>
        {getGreeting()}
      </p>

      {/* Title with gradient text */}
      <div className="flex items-center justify-between animate-task-enter" style={{ animationDelay: '60ms' }}>
        <div style={{ position: 'relative' }}>
          {/* Shadow layer (can't apply text-shadow to clipped text) */}
          <h1 aria-hidden="true" style={{
            position: 'absolute', fontSize: 36, fontWeight: 900, letterSpacing: '-0.03em',
            color: 'transparent', textShadow: '0 0 60px rgba(255,107,53,0.12), 0 0 120px rgba(255,107,53,0.04)',
          }}>{title}</h1>
          {/* Gradient text layer */}
          <h1 style={{
            fontSize: 36, fontWeight: 900, letterSpacing: '-0.03em',
            background: 'linear-gradient(180deg, var(--color-text) 0%, rgba(240,236,230,0.7) 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>{title}</h1>
        </div>
        {isChecklist && doneCount > 0 && (
          <button onClick={() => { resetList(activeListId); showUndo('List reset', () => {}) }}
            style={{ fontSize: 12, color: 'var(--color-text-secondary)' }} className="hover:text-accent-flame">
            Reset
          </button>
        )}
      </div>

      {/* Stats */}
      {(activeCount > 0 || doneCount > 0) && (
        <p className="animate-task-enter" style={{
          fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.02em',
          color: 'var(--color-text-secondary)', marginTop: 8, animationDelay: '120ms',
        }}>
          {activeCount > 0 && <span>{activeCount} remaining</span>}
          {activeCount > 0 && doneCount > 0 && <span style={{ margin: '0 6px', opacity: 0.3 }}>·</span>}
          {doneCount > 0 && <span>{doneCount} done</span>}
        </p>
      )}

      {/* Glowing accent line */}
      <div className="animate-task-enter" style={{
        height: 1, marginTop: 20, animationDelay: '180ms',
        background: 'linear-gradient(90deg, transparent 0%, var(--accent-flame) 20%, var(--accent-sun) 50%, var(--accent-flame) 80%, transparent 100%)',
        boxShadow: '0 0 12px rgba(255,107,53,0.3)',
      }} />
    </header>
  )
}
