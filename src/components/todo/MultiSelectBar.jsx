import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useUiStore } from '../../stores/uiStore'
import { useTodoStore } from '../../stores/todoStore'
import TaskEditSheet from './TaskEditSheet'
import DragOrganize from './DragOrganize'

export default function MultiSelectBar() {
  const selectedIds = useUiStore((s) => s.selectedIds)
  const clearMultiSelect = useUiStore((s) => s.clearMultiSelect)
  const allTodos = useTodoStore((s) => s.todos)
  const [editOpen, setEditOpen] = useState(false)
  const [flingOpen, setFlingOpen] = useState(false)

  const ids = Object.keys(selectedIds)
  if (ids.length === 0) return null

  const selectedTodos = allTodos.filter(t => selectedIds[t.id])
  const count = selectedTodos.length

  const handleEdit = () => setEditOpen(true)

  const handleFling = () => setFlingOpen(true)

  const handleCloseEdit = () => {
    setEditOpen(false)
    clearMultiSelect()
  }

  const handleCloseFling = () => {
    setFlingOpen(false)
    clearMultiSelect()
  }

  return createPortal(
    <>
      {/* Bar */}
      <div className="fixed left-0 right-0 z-40 flex justify-center animate-slide-up" style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}>
        <div className="flex items-center gap-3" style={{
          background: 'rgba(26,22,37,0.95)',
          backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
          borderRadius: 20, padding: '10px 6px 10px 18px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.08)',
        }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
            {count} selected
          </span>

          <button onMouseDown={(e) => e.preventDefault()} onClick={handleEdit}
            style={{
              padding: '8px 16px', borderRadius: 12, fontSize: 13, fontWeight: 600,
              background: 'linear-gradient(135deg, var(--accent-coral), var(--accent-rose))',
              color: 'white',
            }}>
            Edit
          </button>

          <button onMouseDown={(e) => e.preventDefault()} onClick={handleFling}
            style={{
              padding: '8px 16px', borderRadius: 12, fontSize: 13, fontWeight: 600,
              background: 'var(--surface-card)', color: 'var(--accent-lavender)',
            }}>
            Organize
          </button>

          <button onMouseDown={(e) => e.preventDefault()} onClick={clearMultiSelect}
            style={{ padding: '8px 12px', fontSize: 16, color: 'var(--text-ghost)' }}>
            ×
          </button>
        </div>
      </div>

      {/* Edit sheet for multi-task */}
      {editOpen && <TaskEditSheet todos={selectedTodos} onClose={handleCloseEdit} />}

      {/* Fling for multi-task */}
      {flingOpen && (
        <DragOrganize
          todos={selectedTodos}
          startPos={{ x: window.innerWidth / 2, y: window.innerHeight / 2 }}
          onDone={handleCloseFling}
        />
      )}
    </>,
    document.body
  )
}
