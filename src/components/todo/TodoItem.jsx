import { useState } from 'react'
import { useTodoStore } from '../../stores/todoStore'
import { useUiStore } from '../../stores/uiStore'
import { formatRelativeDate, getSnoozeLaterToday, getSnoozeTomorrow } from '../../lib/utils'
import SwipeHandler from './SwipeHandler'

const PRIORITY_INDICATORS = {
  1: { label: '●', color: 'text-urgent' },
  2: { label: '↑', color: 'text-high' },
  3: { label: '—', color: 'text-normal' },
}

export default function TodoItem({ todo, isChecklist = false }) {
  const completeTodo = useTodoStore((s) => s.completeTodo)
  const uncompleteTodo = useTodoStore((s) => s.uncompleteTodo)
  const ghostTodo = useTodoStore((s) => s.ghostTodo)
  const snoozeTodo = useTodoStore((s) => s.snoozeTodo)
  const showUndo = useUiStore((s) => s.showUndo)
  const [showSnooze, setShowSnooze] = useState(false)

  const isDone = todo.status === 'done' || todo.status === 'ghost'
  const priority = PRIORITY_INDICATORS[todo.priority]
  const dateLabel = formatRelativeDate(todo.dueDate)

  const handleComplete = () => {
    if (isDone) return
    if (isChecklist) {
      ghostTodo(todo.id)
      showUndo('Task completed', () => uncompleteTodo(todo.id))
    } else {
      completeTodo(todo.id)
      showUndo('Task completed', () => uncompleteTodo(todo.id))
    }
  }

  const handleCheckbox = () => {
    if (isDone) {
      uncompleteTodo(todo.id)
    } else {
      handleComplete()
    }
  }

  const handleSnoozeReveal = () => {
    setShowSnooze(true)
  }

  const handleSnooze = (until) => {
    snoozeTodo(todo.id, until)
    setShowSnooze(false)
    showUndo('Snoozed', () => snoozeTodo(todo.id, null))
  }

  if (showSnooze) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-surface animate-in">
        <button onClick={() => handleSnooze(getSnoozeLaterToday())} className="flex-1 text-xs py-2 rounded-lg bg-surface-hover text-text-dim hover:text-text">
          Later today
        </button>
        <button onClick={() => handleSnooze(getSnoozeTomorrow())} className="flex-1 text-xs py-2 rounded-lg bg-surface-hover text-text-dim hover:text-text">
          Tomorrow
        </button>
        <button onClick={() => setShowSnooze(false)} className="px-3 py-2 text-xs text-text-dim hover:text-text">
          ✕
        </button>
      </div>
    )
  }

  return (
    <SwipeHandler onSwipeRight={isDone ? undefined : handleComplete} onSwipeLeft={isDone ? undefined : handleSnoozeReveal}>
      <div
        className={`
          flex items-center gap-3 px-4 py-3 border-b border-border
          ${isDone ? 'opacity-40' : ''}
        `}
      >
        {/* Checkbox */}
        <button
          onClick={handleCheckbox}
          className={`
            w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
            transition-colors
            ${isDone
              ? 'border-done-text bg-done text-done-text'
              : 'border-border-light hover:border-accent'
            }
          `}
        >
          {isDone && (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 5l2.5 2.5L8 3" />
            </svg>
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm ${isDone ? 'line-through text-done-text' : 'text-text'}`}>
            {todo.text}
          </p>
          {(priority || dateLabel) && !isDone && (
            <div className="flex items-center gap-2 mt-0.5">
              {priority && (
                <span className={`text-[10px] ${priority.color}`}>{priority.label}</span>
              )}
              {dateLabel && (
                <span className="text-[10px] text-text-dim">{dateLabel}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </SwipeHandler>
  )
}
