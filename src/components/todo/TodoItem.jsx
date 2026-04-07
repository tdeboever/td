import { useState } from 'react'
import { useTodoStore } from '../../stores/todoStore'
import { useUiStore } from '../../stores/uiStore'
import { formatRelativeDate, getSnoozeLaterToday, getSnoozeTomorrow } from '../../lib/utils'
import FlingHandler from './FlingHandler'

const DOTS = {
  1: { bg: 'var(--color-urgent)', shadow: '0 0 6px rgba(255,59,48,0.4)' },
  2: { bg: 'var(--color-high)', shadow: 'none' },
  3: { bg: 'var(--color-normal)', shadow: 'none' },
}

export default function TodoItem({ todo, isChecklist = false, isLast = false }) {
  const completeTodo = useTodoStore((s) => s.completeTodo)
  const uncompleteTodo = useTodoStore((s) => s.uncompleteTodo)
  const ghostTodo = useTodoStore((s) => s.ghostTodo)
  const snoozeTodo = useTodoStore((s) => s.snoozeTodo)
  const deleteTodo = useTodoStore((s) => s.deleteTodo)
  const showUndo = useUiStore((s) => s.showUndo)
  const activeView = useUiStore((s) => s.activeView)
  const [showActions, setShowActions] = useState(false)

  const isDone = todo.status === 'done' || todo.status === 'ghost'
  const dot = DOTS[todo.priority]
  const dateLabel = formatRelativeDate(todo.dueDate)
  const isOverdue = todo.dueDate && !isDone && new Date(todo.dueDate) < new Date(new Date().toDateString())
  const showDate = dateLabel && !(activeView === 'today' && dateLabel === 'Today')

  const handleComplete = () => {
    if (isDone) return
    isChecklist ? ghostTodo(todo.id) : completeTodo(todo.id)
    showUndo('Task completed', () => uncompleteTodo(todo.id))
  }

  const handleCheckbox = () => isDone ? uncompleteTodo(todo.id) : handleComplete()

  const handleSnooze = (until) => {
    snoozeTodo(todo.id, until)
    setShowActions(false)
    showUndo('Snoozed', () => snoozeTodo(todo.id, null))
  }

  // Actions panel (long press or tap on completed items)
  if (showActions) {
    return (
      <div className="animate-slide-up" style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
        <p className="text-[11px] text-text-dim mb-3 truncate">{todo.text}</p>
        <div className="flex gap-5">
          {!isDone && <button onClick={() => handleSnooze(getSnoozeLaterToday())} className="text-[13px] text-text-dim hover:text-text">Later today</button>}
          {!isDone && <button onClick={() => handleSnooze(getSnoozeTomorrow())} className="text-[13px] text-text-dim hover:text-text">Tomorrow</button>}
          <button onClick={() => { deleteTodo(todo.id); setShowActions(false) }} className="text-[13px] text-danger/60 hover:text-danger">Delete</button>
          <button onClick={() => setShowActions(false)} className="text-[13px] text-text-faint hover:text-text-dim ml-auto">Cancel</button>
        </div>
      </div>
    )
  }

  const taskContent = (
    <div
      className={`flex items-center gap-3 ${isDone ? 'opacity-50' : ''}`}
      style={{ padding: isDone ? '10px 20px' : '14px 20px', borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.03)' }}
      onContextMenu={(e) => { e.preventDefault(); setShowActions(true) }}
    >
      {/* Checkbox */}
      <button
        onClick={handleCheckbox}
        className={`
          flex items-center justify-center flex-shrink-0 rounded-full
          transition-all duration-200
          ${isDone
            ? 'bg-border-light border-[2px] border-border-light'
            : 'border-[2px] border-border-light hover:border-accent hover:shadow-[0_0_0_3px_var(--color-accent-glow)]'
          }
        `}
        style={{ width: 22, height: 22 }}
      >
        {isDone && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round">
            <path d="M2 5.5l2 2L8 3" />
          </svg>
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-[15px] leading-snug ${isDone ? 'line-through text-done-text' : 'text-text'}`}>
          {todo.text}
        </p>
        {!isDone && (dot || showDate) && (
          <div className="flex items-center gap-2 mt-1">
            {dot && <span className="inline-block rounded-full" style={{ width: 6, height: 6, backgroundColor: dot.bg, boxShadow: dot.shadow }} />}
            {showDate && <span className={`text-[11px] ${isOverdue ? 'text-danger' : 'text-text-dim'}`}>{dateLabel}</span>}
          </div>
        )}
      </div>
    </div>
  )

  // Active tasks get the fling handler
  if (!isDone) {
    return (
      <FlingHandler onComplete={handleComplete} onSwipeLeft={() => setShowActions(true)}>
        {taskContent}
      </FlingHandler>
    )
  }

  // Done tasks are just tappable (checkbox to uncomplete, long press for actions)
  return taskContent
}
