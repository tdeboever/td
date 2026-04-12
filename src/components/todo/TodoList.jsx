import { useState } from 'react'
import TodoItem from './TodoItem'
import GhostItem from './GhostItem'
import EmptyState from '../common/EmptyState'
import { useUiStore } from '../../stores/uiStore'

export default function TodoList({ todos, isChecklist = false, emptyTitle, emptySubtitle }) {
  const active = todos.filter((t) => t.status === 'active')
  const done = todos.filter((t) => t.status === 'done')
  const ghost = todos.filter((t) => t.status === 'ghost').sort((a, b) => b.completionCount - a.completionCount)
  const [showDone, setShowDone] = useState(false)

  const sorted = active.sort((a, b) => a.position - b.position)

  const initialSynced = useUiStore((s) => s.initialSynced)
  if (todos.length === 0 && !initialSynced) return null
  if (todos.length === 0) return <EmptyState title={emptyTitle} subtitle={emptySubtitle} />

  const showAllClear = active.length === 0 && done.length > 0
  const visibleDone = showDone ? done : done.slice(0, 3)
  const hasMoreDone = done.length > 3 && !showDone

  return (
    <div className="animate-view-enter">
      {showAllClear && <EmptyState title="All clear" subtitle="Everything's done" />}

      {sorted.map((todo, i) => (
        <div
          key={todo.id}
          className="animate-task-enter"
          style={{ animationDelay: `${i * 50}ms` }}
        >
          <TodoItem todo={todo} isChecklist={isChecklist} isLast={i === sorted.length - 1} />
        </div>
      ))}

      {ghost.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <p className="text-[11px] font-medium uppercase" style={{ padding: '0 20px 8px', letterSpacing: '0.1em', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Previous
          </p>
          {ghost.map((todo) => <GhostItem key={todo.id} todo={todo} />)}
        </div>
      )}

      {done.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <button onClick={() => setShowDone(!showDone)}
            className="w-full flex items-center gap-3"
            style={{ padding: '8px 20px', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>
            <div className="flex-1 h-px" style={{ background: 'var(--border-subtle)' }} />
            <span style={{ letterSpacing: '0.08em' }}>Completed · {done.length} {showDone ? '▴' : '▾'}</span>
            <div className="flex-1 h-px" style={{ background: 'var(--border-subtle)' }} />
          </button>

          {visibleDone.map((todo, i) => (
            <TodoItem key={todo.id} todo={todo} isChecklist={isChecklist} isLast={i === visibleDone.length - 1} />
          ))}

          {hasMoreDone && (
            <button onClick={() => setShowDone(true)} className="w-full"
              style={{ padding: '8px 20px', fontSize: 12, color: 'var(--text-secondary)' }}>
              Show all {done.length}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
