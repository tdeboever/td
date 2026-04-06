import TodoItem from './TodoItem'
import GhostItem from './GhostItem'
import EmptyState from '../common/EmptyState'

export default function TodoList({ todos, isChecklist = false, emptyIcon, emptyTitle, emptySubtitle }) {
  const active = todos.filter((t) => t.status === 'active')
  const done = todos.filter((t) => t.status === 'done')
  const ghost = todos.filter((t) => t.status === 'ghost')
    .sort((a, b) => b.completionCount - a.completionCount)

  if (todos.length === 0) {
    return (
      <EmptyState
        icon={emptyIcon || '✨'}
        title={emptyTitle || 'No tasks yet'}
        subtitle={emptySubtitle || 'Add one below'}
      />
    )
  }

  return (
    <div>
      {/* Active items */}
      {active
        .sort((a, b) => a.position - b.position)
        .map((todo) => (
          <TodoItem key={todo.id} todo={todo} isChecklist={isChecklist} />
        ))}

      {/* Done section */}
      {done.length > 0 && (
        <div className="mt-2">
          <div className="px-4 py-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-text-dim/40">
              Completed ({done.length})
            </span>
          </div>
          {done.map((todo) => (
            <TodoItem key={todo.id} todo={todo} isChecklist={isChecklist} />
          ))}
        </div>
      )}

      {/* Ghost section (checklist mode) */}
      {ghost.length > 0 && (
        <div className="mt-2">
          <div className="px-4 py-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-text-dim/40">
              Previous items
            </span>
          </div>
          {ghost.map((todo) => (
            <GhostItem key={todo.id} todo={todo} />
          ))}
        </div>
      )}
    </div>
  )
}
