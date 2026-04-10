import { useState, useRef } from 'react'
import { emitExplosion } from './ParticleCanvas'
import { useTodoStore } from '../../stores/todoStore'
import { useSpaceStore } from '../../stores/spaceStore'
import { useListStore } from '../../stores/listStore'
import SpaceAvatar from '../common/SpaceAvatar'
import { useUiStore } from '../../stores/uiStore'
import { formatRelativeDate, toLocalDateStr } from '../../lib/utils'
import DragOrganize from './DragOrganize'

const DOTS = {
  1: { bg: 'radial-gradient(circle at 35% 35%, #ff8a8a, #ff6b6b)', shadow: '0 0 8px rgba(255,107,107,0.5)' },
  2: { bg: 'radial-gradient(circle at 35% 35%, #fcd34d, #fbbf24)', shadow: 'none' },
  3: { bg: 'radial-gradient(circle at 35% 35%, #6ee7b7, #4ade80)', shadow: 'none' },
}

export default function TodoItem({ todo, isChecklist = false, isLast = false }) {
  const completeTodo = useTodoStore((s) => s.completeTodo)
  const uncompleteTodo = useTodoStore((s) => s.uncompleteTodo)
  const ghostTodo = useTodoStore((s) => s.ghostTodo)
  const deleteTodo = useTodoStore((s) => s.deleteTodo)
  const showUndo = useUiStore((s) => s.showUndo)
  const spawnBall = useUiStore((s) => s.spawnBall)
  const activeView = useUiStore((s) => s.activeView)
  const spaces = useSpaceStore((s) => s.spaces)
  const lists = useListStore((s) => s.lists)
  const updateTodo = useTodoStore((s) => s.updateTodo)
  const [showActions, setShowActions] = useState(false)
  const [showMoveMenu, setShowMoveMenu] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState('')
  const [dragging, setDragging] = useState(null)
  const [phase, setPhase] = useState(null)
  const checkboxRef = useRef(null)

  const isDone = todo.status === 'done' || todo.status === 'ghost'
  const dot = DOTS[todo.priority]
  const dateLabel = formatRelativeDate(todo.dueDate)
  const isOverdue = todo.dueDate && !isDone && new Date(todo.dueDate) < new Date(new Date().toDateString())
  const showDate = dateLabel && !(activeView === 'today' && dateLabel === 'Today')

  const handleComplete = () => {
    if (isDone || phase) return
    const rect = checkboxRef.current?.getBoundingClientRect()
    const cx = rect ? rect.left + rect.width / 2 : 30
    const cy = rect ? rect.top + rect.height / 2 : 100
    if (navigator.vibrate) navigator.vibrate(10)
    // Particle burst from checkbox
    emitExplosion(cx, cy, 300, 10)
    setPhase('checked')
    setTimeout(() => { setPhase('collapsing'); spawnBall(cx, cy) }, 150)
    setTimeout(() => {
      if (isChecklist) ghostTodo(todo.id); else completeTodo(todo.id)
      showUndo('Task completed', () => uncompleteTodo(todo.id))
      setPhase(null)
    }, 350)
  }

  const handleCheckbox = () => isDone ? uncompleteTodo(todo.id) : handleComplete()

  const handleLater = () => {
    const now = new Date()
    const laterHour = Math.min(now.getHours() + 3, 21)
    const time = `${String(laterHour).padStart(2, '0')}:00`
    const oldDate = todo.dueDate
    const oldTime = todo.dueTime
    updateTodo(todo.id, { dueDate: toLocalDateStr(now), dueTime: time })
    setShowActions(false)
    showUndo(`Set to ${time}`, () => updateTodo(todo.id, { dueDate: oldDate, dueTime: oldTime }))
  }

  const handleTomorrow = () => {
    const tmrw = new Date(); tmrw.setDate(tmrw.getDate() + 1)
    const oldDate = todo.dueDate
    const oldTime = todo.dueTime
    updateTodo(todo.id, { dueDate: toLocalDateStr(tmrw), dueTime: null })
    setShowActions(false)
    showUndo('Moved to tomorrow', () => updateTodo(todo.id, { dueDate: oldDate, dueTime: oldTime }))
  }

  if (showActions) {
    return (
      <div className="animate-slide-up" style={{
        margin: '4px 20px', padding: '12px 16px', borderRadius: 16,
        background: 'var(--surface-glass)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        boxShadow: '0 0 0 1px var(--border-subtle)',
      }}>
        {editing ? (
          <form onSubmit={(e) => { e.preventDefault(); if (editText.trim()) { updateTodo(todo.id, { text: editText.trim() }); setEditing(false) } }} style={{ marginBottom: 10 }}>
            <input autoFocus value={editText} onChange={(e) => setEditText(e.target.value)}
              onBlur={() => { if (editText.trim() && editText !== todo.text) updateTodo(todo.id, { text: editText.trim() }); setEditing(false) }}
              className="w-full bg-transparent outline-none"
              style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-visible)', paddingBottom: 4 }} />
          </form>
        ) : (
          <p onClick={() => { setEditText(todo.text); setEditing(true) }}
            style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10, cursor: 'text' }} className="truncate">{todo.text}</p>
        )}

        {/* Move to space/list */}
        {showMoveMenu ? (
          <div className="animate-slide-down" style={{ marginBottom: 10 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-ghost)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Move to</p>
            <div className="flex gap-2 flex-wrap">
              {todo.spaceId && (
                <button onClick={() => { updateTodo(todo.id, { spaceId: null, listId: null }); setShowActions(false); showUndo('Removed from space', () => updateTodo(todo.id, { spaceId: todo.spaceId, listId: todo.listId })) }}
                  style={{ padding: '6px 12px', borderRadius: 10, fontSize: 12, fontWeight: 500, background: 'var(--surface-card)', color: 'var(--text-secondary)' }}>
                  No space
                </button>
              )}
              {spaces.map((s) => {
                const spaceLists = lists.filter((l) => l.spaceId === s.id)
                const isCurrentSpace = todo.spaceId === s.id
                return (
                  <div key={s.id} className="flex gap-1.5 flex-wrap">
                    <button onClick={() => { updateTodo(todo.id, { spaceId: s.id, listId: null }); setShowActions(false); showUndo(`Moved to ${s.name}`, () => updateTodo(todo.id, { spaceId: todo.spaceId, listId: todo.listId })) }}
                      className="flex items-center gap-2"
                      style={{ padding: '6px 12px', borderRadius: 10, fontSize: 12, fontWeight: 500, background: isCurrentSpace && !todo.listId ? 'var(--surface-active)' : 'var(--surface-card)', color: 'var(--text-secondary)' }}>
                      <SpaceAvatar space={s} size={16} /> {s.name}
                    </button>
                    {spaceLists.map((l) => (
                      <button key={l.id} onClick={() => { updateTodo(todo.id, { spaceId: s.id, listId: l.id }); setShowActions(false); showUndo(`Moved to ${l.name}`, () => updateTodo(todo.id, { spaceId: todo.spaceId, listId: todo.listId })) }}
                        style={{ padding: '6px 12px', borderRadius: 10, fontSize: 11, fontWeight: 500, background: todo.listId === l.id ? 'var(--surface-active)' : 'var(--surface-card)', color: 'var(--text-ghost)' }}>
                        {l.name}
                      </button>
                    ))}
                  </div>
                )
              })}
            </div>
          </div>
        ) : null}

        <div className="flex gap-5">
          {!isDone && <button onClick={handleLater} style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Later</button>}
          {!isDone && <button onClick={handleTomorrow} style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Tmrw</button>}
          {spaces.length > 0 && <button onClick={() => setShowMoveMenu(!showMoveMenu)} style={{ fontSize: 13, color: 'var(--accent-lavender)' }}>Move</button>}
          <button onClick={() => { updateTodo(todo.id, { type: 'note' }); setShowActions(false); showUndo('Made a note', () => updateTodo(todo.id, { type: 'task' })) }} style={{ fontSize: 13, color: 'var(--accent-sky)' }}>Note</button>
          <button onClick={() => { deleteTodo(todo.id); setShowActions(false) }} style={{ fontSize: 13, color: 'var(--color-danger)', opacity: 0.6 }}>Delete</button>
          <button onClick={() => { setShowActions(false); setShowMoveMenu(false) }} style={{ fontSize: 13, color: 'var(--text-ghost)', marginLeft: 'auto' }}>✕</button>
        </div>
      </div>
    )
  }

  const isChecked = phase === 'checked' || phase === 'collapsing'
  const isCollapsing = phase === 'collapsing'

  // Horizontal swipe detection — detaches task into drag mode
  const touchStart = useRef(null)
  const handleTouchStart2 = (e) => {
    if (isDone || phase) return
    const t = e.touches[0]
    touchStart.current = { x: t.clientX, y: t.clientY, scrolled: false }
  }
  const handleTouchMove2 = (e) => {
    if (!touchStart.current || dragging) return
    const t = e.touches[0]
    const dx = Math.abs(t.clientX - touchStart.current.x)
    const dy = Math.abs(t.clientY - touchStart.current.y)
    // If vertical > horizontal, it's a scroll — ignore
    if (dy > 15 && dy > dx) { touchStart.current = null; return }
    // Any horizontal movement > 10px — stop it from reaching the view swipe
    if (dx > 10 && dx > dy) { e.stopPropagation() }
    // Horizontal threshold to detach into drag mode
    if (dx > 30 && dx > dy * 1.5) {
      if (navigator.vibrate) navigator.vibrate(8)
      setDragging({ x: t.clientX, y: t.clientY })
      touchStart.current = null
    }
  }

  const taskRow = (
    <div
      onTouchStart={handleTouchStart2}
      onTouchMove={handleTouchMove2}
      className={`flex items-center gap-3 ${isDone ? '' : 'active:scale-[0.98]'}`}
      style={{
        padding: isDone ? '10px 20px' : '14px 20px',
        borderBottom: isLast ? 'none' : '1px solid var(--border-subtle)',
        opacity: isDone ? 0.3 : isCollapsing ? 0 : 1,
        transform: isCollapsing ? 'scaleY(0)' : 'scaleY(1)',
        maxHeight: isCollapsing ? 0 : 200, overflow: 'hidden', transformOrigin: 'top',
        transition: isCollapsing ? 'opacity 200ms, max-height 200ms, transform 200ms' : 'all 200ms',
        background: 'transparent', borderRadius: 16,
      }}
      onTouchEnd={() => { touchStart.current = null }}
      onMouseEnter={(e) => { if (!isDone && !phase) { e.currentTarget.style.background = 'var(--surface-card)'; e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.15), 0 0 0 1px rgba(255,255,255,0.05)' } }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.boxShadow = 'none' }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Checkbox — celebration on check */}
      <button ref={checkboxRef} onClick={(e) => { e.stopPropagation(); handleCheckbox() }}
        className="flex items-center justify-center flex-shrink-0 rounded-full"
        style={{
          width: 22, height: 22,
          transition: 'all 250ms cubic-bezier(0.34,1.56,0.64,1)',
          border: isChecked ? '2px solid transparent' : isDone ? '2px solid transparent' : '2px solid rgba(255,255,255,0.15)',
          background: isChecked ? 'linear-gradient(135deg, var(--accent-rose), var(--accent-coral))' : isDone ? 'linear-gradient(135deg, var(--accent-rose), var(--accent-coral))' : 'transparent',
          transform: isChecked && !isCollapsing ? 'scale(1.3)' : 'scale(1)',
          boxShadow: (isChecked || isDone) ? '0 0 12px rgba(244,114,182,0.30)' : 'none',
        }}
        onMouseEnter={(e) => { if (!isDone && !phase) { e.currentTarget.style.borderColor = 'var(--accent-rose)'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(244,114,182,0.12)'; e.currentTarget.style.transform = 'scale(1.08)' } }}
        onMouseLeave={(e) => { if (!isDone && !phase) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'scale(1)' } }}
      >
        {(isDone || isChecked) && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"
            style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))' }}>
            <path d="M2 5.5l2 2L8 3" />
          </svg>
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0" style={{
        transition: isChecked ? 'opacity 200ms, transform 150ms' : undefined,
        opacity: isChecked ? 0.4 : 1,
        transform: isChecked ? 'translateX(-8px)' : 'translateX(0)',
      }}>
        <div className="flex items-center gap-2">
          {!isDone && !isChecked && dot && (
            <span className="inline-block rounded-full flex-shrink-0" style={{ width: 6, height: 6, background: dot.bg, boxShadow: dot.shadow }} />
          )}
          <p style={{
            fontSize: 15, fontWeight: 500, letterSpacing: '-0.01em', lineHeight: 1.4,
            color: isDone ? 'var(--text-done)' : 'var(--text-primary)',
            textDecoration: (isDone || isChecked) ? 'line-through' : 'none',
            textDecorationColor: 'rgba(244,240,237,0.1)',
          }}>{todo.text}</p>
        </div>
        {!isDone && !isChecked && showDate && (
          <span style={{
            display: 'inline-block', marginTop: 6,
            fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.02em',
            color: isOverdue ? 'var(--color-danger)' : 'var(--accent-sky)',
            background: isOverdue ? 'rgba(255,107,107,0.10)' : 'rgba(96,165,250,0.10)',
            border: `1px solid ${isOverdue ? 'rgba(255,107,107,0.15)' : 'rgba(96,165,250,0.15)'}`,
            padding: '2px 8px', borderRadius: 10,
          }}>{dateLabel}{todo.dueTime && ` ${todo.dueTime}`}</span>
        )}
      </div>
    </div>
  )

  return (
    <>
      {taskRow}
      {dragging && (
        <DragOrganize todo={todo} startPos={dragging} onDone={() => setDragging(null)} />
      )}
    </>
  )
}
