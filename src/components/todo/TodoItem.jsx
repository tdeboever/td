import { useState, useRef } from 'react'
import { useTodoStore } from '../../stores/todoStore'
import { useUiStore } from '../../stores/uiStore'
import { formatRelativeDate, getSnoozeLaterToday, getSnoozeTomorrow } from '../../lib/utils'

const DOTS = {
  1: { bg: 'radial-gradient(circle at 35% 35%, #ff7a7a, #ff4545)', shadow: '0 0 8px rgba(255,69,69,0.5)' },
  2: { bg: 'radial-gradient(circle at 35% 35%, #ffc966, #ffb340)', shadow: 'none' },
  3: { bg: 'radial-gradient(circle at 35% 35%, #7aecbe, #45dea0)', shadow: 'none' },
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

  const [showActions, setShowActions] = useState(false)
  const [completing, setCompleting] = useState(false)
  const checkboxRef = useRef(null)

  const isDone = todo.status === 'done' || todo.status === 'ghost'
  const dot = DOTS[todo.priority]
  const dateLabel = formatRelativeDate(todo.dueDate)
  const isOverdue = todo.dueDate && !isDone && new Date(todo.dueDate) < new Date(new Date().toDateString())
  const showDate = dateLabel && !(activeView === 'today' && dateLabel === 'Today')

  const handleComplete = () => {
    if (isDone || completing) return

    // Get checkbox position for ball spawn
    const rect = checkboxRef.current?.getBoundingClientRect()
    const cx = rect ? rect.left + rect.width / 2 : 30
    const cy = rect ? rect.top + rect.height / 2 : 100

    // Haptic
    if (navigator.vibrate) navigator.vibrate(10)

    // Start animation
    setCompleting(true)

    // After text flies off, complete the task and spawn the ball
    setTimeout(() => {
      if (isChecklist) ghostTodo(todo.id)
      else completeTodo(todo.id)
      showUndo('Task completed', () => uncompleteTodo(todo.id))
      spawnBall(cx, cy)
      setCompleting(false)
    }, 400)
  }

  const handleCheckbox = () => isDone ? uncompleteTodo(todo.id) : handleComplete()

  const handleSnooze = (until) => {
    snoozeTodo(todo.id, until)
    setShowActions(false)
    showUndo('Snoozed', () => snoozeTodo(todo.id, null))
  }

  // Action panel (long press)
  if (showActions) {
    return (
      <div className="animate-slide-up" style={{
        margin: '4px 20px', padding: '12px 16px', borderRadius: 14,
        background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        boxShadow: '0 0 0 1px rgba(255,255,255,0.06)',
      }}>
        <p style={{ fontSize: 12, color: 'var(--color-text-ghost)', marginBottom: 10 }} className="truncate">{todo.text}</p>
        <div className="flex gap-5">
          {!isDone && <button onClick={() => handleSnooze(getSnoozeLaterToday())} style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Later today</button>}
          {!isDone && <button onClick={() => handleSnooze(getSnoozeTomorrow())} style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Tomorrow</button>}
          <button onClick={() => { deleteTodo(todo.id); setShowActions(false) }} style={{ fontSize: 13, color: 'var(--color-danger)', opacity: 0.6 }}>Delete</button>
          <button onClick={() => setShowActions(false)} style={{ fontSize: 13, color: 'var(--color-text-ghost)', marginLeft: 'auto' }}>Cancel</button>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`flex items-center gap-3 transition-all duration-200 ${isDone ? '' : 'hover:rounded-[14px] active:scale-[0.985]'}`}
      style={{
        padding: isDone ? '10px 20px' : '14px 20px',
        borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.03)',
        opacity: isDone ? 0.3 : completing ? 0 : 1,
        transform: completing ? 'translateX(60px)' : 'translateX(0)',
        transition: completing ? 'all 350ms cubic-bezier(0.16, 1, 0.3, 1)' : undefined,
        background: 'transparent',
      }}
      onMouseEnter={(e) => { if (!isDone && !completing) { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.boxShadow = '0 0 0 1px rgba(255,255,255,0.04)' } }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.boxShadow = 'none' }}
      onContextMenu={(e) => { e.preventDefault(); setShowActions(true) }}
    >
      {/* Checkbox */}
      <button
        ref={checkboxRef}
        onClick={handleCheckbox}
        className="flex items-center justify-center flex-shrink-0 rounded-full"
        style={{
          width: 22, height: 22, transition: 'all 200ms cubic-bezier(0.16,1,0.3,1)',
          border: isDone ? '2px solid rgba(255,255,255,0.08)' : '2px solid rgba(255,255,255,0.12)',
          background: isDone ? 'rgba(255,255,255,0.08)' : completing ? 'var(--accent-flame)' : 'transparent',
          transform: completing ? 'scale(1.2)' : 'scale(1)',
        }}
        onMouseEnter={(e) => { if (!isDone) { e.currentTarget.style.borderColor = 'var(--accent-flame)'; e.currentTarget.style.boxShadow = '0 0 0 4px var(--accent-ember)' } }}
        onMouseLeave={(e) => { if (!isDone) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.boxShadow = 'none' } }}
      >
        {isDone && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeLinecap="round">
            <path d="M2 5.5l2 2L8 3" />
          </svg>
        )}
        {completing && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" className="animate-check-pop">
            <path d="M2 5.5l2 2L8 3" />
          </svg>
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {!isDone && dot && (
            <span className="inline-block rounded-full flex-shrink-0" style={{ width: 6, height: 6, background: dot.bg, boxShadow: dot.shadow }} />
          )}
          <p style={{
            fontSize: 15, fontWeight: 500, letterSpacing: '-0.01em', lineHeight: 1.4,
            color: isDone ? 'var(--color-text-done)' : 'var(--color-text)',
            textDecoration: isDone ? 'line-through' : 'none',
            textDecorationColor: isDone ? 'rgba(240,236,230,0.1)' : undefined,
          }}>
            {todo.text}
          </p>
        </div>
        {!isDone && showDate && (
          <span style={{
            display: 'inline-block', marginTop: 6,
            fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.02em',
            color: isOverdue ? 'var(--color-danger)' : 'var(--accent-blush)',
            background: isOverdue ? 'rgba(255,69,69,0.08)' : 'rgba(255,143,107,0.08)',
            border: `1px solid ${isOverdue ? 'rgba(255,69,69,0.1)' : 'rgba(255,143,107,0.1)'}`,
            padding: '2px 8px', borderRadius: 8,
          }}>
            {dateLabel}
          </span>
        )}
      </div>
    </div>
  )
}
