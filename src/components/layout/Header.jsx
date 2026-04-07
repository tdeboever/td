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

  // Hidden when input focused
  if (inputFocused) {
    return (
      <header className="flex items-center safe-top" style={{ padding: '8px 20px' }}>
        <span className="text-[14px] font-semibold flex-1">{title}</span>
        {activeCount > 0 && <span className="text-[12px] text-text-dim">{activeCount}</span>}
      </header>
    )
  }

  return (
    <header className="safe-top" style={{ padding: '48px 20px 0' }}>
      <p className="animate-task-enter text-[12px] font-medium text-text-dim uppercase" style={{ letterSpacing: '0.12em', marginBottom: 6, animationDelay: '0ms' }}>
        {getGreeting()}
      </p>
      <div className="flex items-center justify-between animate-task-enter" style={{ animationDelay: '80ms' }}>
        <h1 className="text-[32px] font-bold text-text" style={{ textShadow: '0 0 40px rgba(255,107,53,0.1)' }}>{title}</h1>
        {isChecklist && doneCount > 0 && (
          <button onClick={() => { resetList(activeListId); showUndo('List reset', () => {}) }}
            className="text-[12px] text-text-dim hover:text-accent transition-colors">
            Reset
          </button>
        )}
      </div>
      {(activeCount > 0 || doneCount > 0) && (
        <p className="text-[13px] text-text-dim animate-task-enter" style={{ marginTop: 8, animationDelay: '160ms' }}>
          {activeCount > 0 && <span>{activeCount} remaining</span>}
          {activeCount > 0 && doneCount > 0 && <span className="mx-1.5 opacity-30">·</span>}
          {doneCount > 0 && <span>{doneCount} done</span>}
        </p>
      )}
      {/* Accent gradient line */}
      <div style={{ height: 1, marginTop: 20, background: 'linear-gradient(to right, var(--color-accent), transparent)' }} />
    </header>
  )
}
