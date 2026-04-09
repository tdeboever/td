import { useState, useRef } from 'react'
import { emitExplosion } from './ParticleCanvas'
import { useTodoStore } from '../../stores/todoStore'
import { useSpaceStore } from '../../stores/spaceStore'
import SpaceAvatar from '../common/SpaceAvatar'
import { useUiStore } from '../../stores/uiStore'
import { formatRelativeDate, getSnoozeLaterToday, getSnoozeTomorrow } from '../../lib/utils'

const DOTS = {
  1: { bg: 'radial-gradient(circle at 35% 35%, #ff8a8a, #ff6b6b)', shadow: '0 0 8px rgba(255,107,107,0.5)' },
  2: { bg: 'radial-gradient(circle at 35% 35%, #fcd34d, #fbbf24)', shadow: 'none' },
  3: { bg: 'radial-gradient(circle at 35% 35%, #6ee7b7, #4ade80)', shadow: 'none' },
}

export default function TodoItem({ todo, isChecklist = false, isLast = false }) {
  const completeTodo = useTodoStore((s) => s.completeTodo)
  const uncompleteTodo = useTodoStore((s) => s.uncompleteTodo)
  const ghostTodo = useTodoStore((s) => s.ghostTodo)
  const snoozeTodo = useTodoStore((s) => s.snoozeTodo)
  const deleteTodo = useTodoStore((s) => s.deleteTodo)
  const showUndo = useUiStore((s) => s.showUndo)
  const spawnBall = useUiStore((s) => s.spawnBall)
  const activeView = useUiStore((s) => s.activeView)
  const spaces = useSpaceStore((s) => s.spaces)
  const updateTodo = useTodoStore((s) => s.updateTodo)
  const [showActions, setShowActions] = useState(false)
  const [showMoveMenu, setShowMoveMenu] = useState(false)
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
  const handleSnooze = (until) => { snoozeTodo(todo.id, until); setShowActions(false); showUndo('Snoozed', () => snoozeTodo(todo.id, null)) }

  if (showActions) {
    return (
      <div className="animate-slide-up" style={{
        margin: '4px 20px', padding: '12px 16px', borderRadius: 16,
        background: 'var(--surface-glass)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        boxShadow: '0 0 0 1px var(--border-subtle)',
      }}>
        <p style={{ fontSize: 12, color: 'var(--text-ghost)', marginBottom: 10 }} className="truncate">{todo.text}</p>

        {/* Move to space */}
        {showMoveMenu ? (
          <div className="animate-slide-down" style={{ marginBottom: 10 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-ghost)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Move to</p>
            <div className="flex gap-2 flex-wrap">
              {todo.spaceId && (
                <button onClick={() => { updateTodo(todo.id, { spaceId: null, listId: null }); setShowActions(false); showUndo('Moved to Today', () => updateTodo(todo.id, { spaceId: todo.spaceId })) }}
                  style={{ padding: '6px 12px', borderRadius: 10, fontSize: 12, fontWeight: 500, background: 'var(--surface-card)', color: 'var(--text-secondary)' }}>
                  No space
                </button>
              )}
              {spaces.filter((s) => s.id !== todo.spaceId).map((s) => (
                <button key={s.id} onClick={() => { updateTodo(todo.id, { spaceId: s.id }); setShowActions(false); showUndo(`Moved to ${s.name}`, () => updateTodo(todo.id, { spaceId: todo.spaceId })) }}
                  className="flex items-center gap-2"
                  style={{ padding: '6px 12px', borderRadius: 10, fontSize: 12, fontWeight: 500, background: 'var(--surface-card)', color: 'var(--text-secondary)' }}>
                  <SpaceAvatar space={s} size={16} /> {s.name}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="flex gap-5">
          {!isDone && <button onClick={() => handleSnooze(getSnoozeLaterToday())} style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Later</button>}
          {!isDone && <button onClick={() => handleSnooze(getSnoozeTomorrow())} style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Tmrw</button>}
          {spaces.length > 0 && <button onClick={() => setShowMoveMenu(!showMoveMenu)} style={{ fontSize: 13, color: 'var(--accent-lavender)' }}>Move</button>}
          <button onClick={() => { deleteTodo(todo.id); setShowActions(false) }} style={{ fontSize: 13, color: 'var(--color-danger)', opacity: 0.6 }}>Delete</button>
          <button onClick={() => { setShowActions(false); setShowMoveMenu(false) }} style={{ fontSize: 13, color: 'var(--text-ghost)', marginLeft: 'auto' }}>✕</button>
        </div>
      </div>
    )
  }

  const isChecked = phase === 'checked' || phase === 'collapsing'
  const isCollapsing = phase === 'collapsing'

  return (
    <div
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
      onMouseEnter={(e) => { if (!isDone && !phase) { e.currentTarget.style.background = 'var(--surface-card)'; e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.15), 0 0 0 1px rgba(255,255,255,0.05)' } }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.boxShadow = 'none' }}
      onContextMenu={(e) => { e.preventDefault(); setShowActions(true) }}
    >
      {/* Checkbox — celebration on check */}
      <button ref={checkboxRef} onClick={handleCheckbox}
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
}
