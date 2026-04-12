import { useState, useRef, useCallback } from 'react'
import TodoItem from './TodoItem'
import GhostItem from './GhostItem'
import EmptyState from '../common/EmptyState'
import { useUiStore } from '../../stores/uiStore'
import { useTodoStore } from '../../stores/todoStore'

export default function TodoList({ todos, isChecklist = false, emptyTitle, emptySubtitle }) {
  const active = todos.filter((t) => t.status === 'active')
  const done = todos.filter((t) => t.status === 'done')
  const ghost = todos.filter((t) => t.status === 'ghost').sort((a, b) => b.completionCount - a.completionCount)
  const [showDone, setShowDone] = useState(false)
  const reorderTodos = useTodoStore((s) => s.reorderTodos)
  const focusedTodoId = useUiStore((s) => s.focusedTodoId)

  // Drag reorder state
  const [dragId, setDragId] = useState(null)
  const [dragOffset, setDragOffset] = useState(0)
  const [overIndex, setOverIndex] = useState(null)
  const itemRects = useRef([])
  const dragStartY = useRef(0)
  const sorted = active.sort((a, b) => a.position - b.position)

  const handleReorderStart = useCallback((todoId, touchY) => {
    // Capture all item rects at drag start
    const els = document.querySelectorAll('[data-reorder-id]')
    const rects = []
    els.forEach(el => {
      const id = el.getAttribute('data-reorder-id')
      const rect = el.getBoundingClientRect()
      rects.push({ id, top: rect.top, bottom: rect.bottom, mid: rect.top + rect.height / 2 })
    })
    itemRects.current = rects
    dragStartY.current = touchY
    setDragId(todoId)
    setDragOffset(0)
    setOverIndex(sorted.findIndex(t => t.id === todoId))
  }, [sorted])

  const handleReorderMove = useCallback((touchY) => {
    if (!dragId) return
    const offset = touchY - dragStartY.current
    setDragOffset(offset)

    // Find which slot the dragged item is over
    const rects = itemRects.current
    const dragIdx = rects.findIndex(r => r.id === dragId)
    if (dragIdx === -1) return
    const dragMid = rects[dragIdx].mid + offset

    let newOver = dragIdx
    for (let i = 0; i < rects.length; i++) {
      if (dragMid < rects[i].mid) { newOver = i; break }
      newOver = i
    }
    setOverIndex(newOver)
  }, [dragId])

  const handleReorderEnd = useCallback(() => {
    if (!dragId || overIndex === null) { setDragId(null); return }

    const currentIdx = sorted.findIndex(t => t.id === dragId)
    if (currentIdx !== -1 && currentIdx !== overIndex) {
      const reordered = [...sorted]
      const [moved] = reordered.splice(currentIdx, 1)
      reordered.splice(overIndex, 0, moved)
      reorderTodos(reordered.map(t => t.id))
    }
    setDragId(null)
    setDragOffset(0)
    setOverIndex(null)
  }, [dragId, overIndex, sorted, reorderTodos])

  const initialSynced = useUiStore((s) => s.initialSynced)
  if (todos.length === 0 && !initialSynced) return null
  if (todos.length === 0) return <EmptyState title={emptyTitle} subtitle={emptySubtitle} />

  const showAllClear = active.length === 0 && done.length > 0
  const visibleDone = showDone ? done : done.slice(0, 3)
  const hasMoreDone = done.length > 3 && !showDone

  const dragIdx = dragId ? sorted.findIndex(t => t.id === dragId) : -1

  return (
    <div className="animate-view-enter">
      {showAllClear && <EmptyState title="All clear" subtitle="Everything's done" />}

      {sorted.map((todo, i) => {
        const isDragging = todo.id === dragId
        // Shift other items to make room for dragged item
        let shift = 0
        if (dragId && !isDragging && overIndex !== null && dragIdx !== -1) {
          if (dragIdx < overIndex && i > dragIdx && i <= overIndex) shift = -52
          else if (dragIdx > overIndex && i < dragIdx && i >= overIndex) shift = 52
        }

        return (
          <div
            key={todo.id}
            data-reorder-id={todo.id}
            className={i < 5 ? 'animate-task-enter' : ''}
            style={{
              animationDelay: i < 5 ? `${i * 50}ms` : undefined,
              position: 'relative',
              zIndex: isDragging ? 10 : 1,
              transform: isDragging ? `translateY(${dragOffset}px)` : shift ? `translateY(${shift}px)` : undefined,
              transition: isDragging ? 'none' : shift ? 'transform 200ms cubic-bezier(0.2,1,0.3,1)' : undefined,
              opacity: isDragging ? 0.85 : 1,
              boxShadow: isDragging ? '0 8px 24px rgba(0,0,0,0.3)' : undefined,
              borderRadius: isDragging ? 16 : undefined,
            }}
          >
            <TodoItem
              todo={todo}
              isChecklist={isChecklist}
              isLast={i === sorted.length - 1}
              onReorderStart={focusedTodoId === todo.id ? handleReorderStart : undefined}
              onReorderMove={dragId ? handleReorderMove : undefined}
              onReorderEnd={dragId ? handleReorderEnd : undefined}
            />
          </div>
        )
      })}

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
