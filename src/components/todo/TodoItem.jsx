import { useState, useRef } from 'react'
import { emitExplosion } from './ParticleCanvas'
import { useTodoStore } from '../../stores/todoStore'
import { useSpaceStore } from '../../stores/spaceStore'
import { useListStore } from '../../stores/listStore'
import SpaceAvatar from '../common/SpaceAvatar'
import { useUiStore } from '../../stores/uiStore'
import { formatRelativeDate } from '../../lib/utils'
import DragOrganize from './DragOrganize'
import TaskEditSheet from './TaskEditSheet'

const DOTS = {
  1: { bg: 'radial-gradient(circle at 35% 35%, #ff8a8a, #ff6b6b)', shadow: '0 0 8px rgba(255,107,107,0.5)' },
  2: { bg: 'radial-gradient(circle at 35% 35%, #fcd34d, #fbbf24)', shadow: 'none' },
  3: { bg: 'radial-gradient(circle at 35% 35%, #6ee7b7, #4ade80)', shadow: 'none' },
}

export default function TodoItem({ todo, isChecklist = false, isLast = false, onReorderStart, onReorderMove, onReorderEnd }) {
  const completeTodo = useTodoStore((s) => s.completeTodo)
  const uncompleteTodo = useTodoStore((s) => s.uncompleteTodo)
  const ghostTodo = useTodoStore((s) => s.ghostTodo)
  const deleteTodo = useTodoStore((s) => s.deleteTodo)
  const allTodos = useTodoStore((s) => s.todos)
  const showUndo = useUiStore((s) => s.showUndo)
  const spawnBall = useUiStore((s) => s.spawnBall)
  const activeView = useUiStore((s) => s.activeView)
  const multiSelectMode = useUiStore((s) => s.multiSelectMode)
  const selectedIds = useUiStore((s) => s.selectedIds)
  const enterMultiSelect = useUiStore((s) => s.enterMultiSelect)
  const toggleSelect = useUiStore((s) => s.toggleSelect)
  const clearMultiSelect = useUiStore((s) => s.clearMultiSelect)
  const focusedTodoId = useUiStore((s) => s.focusedTodoId)
  const setFocusedTodo = useUiStore((s) => s.setFocusedTodo)
  const clearFocusedTodo = useUiStore((s) => s.clearFocusedTodo)
  const spaces = useSpaceStore((s) => s.spaces)
  const lists = useListStore((s) => s.lists)
  const updateTodo = useTodoStore((s) => s.updateTodo)
  const [dragging, setDragging] = useState(null)
  const [showEditSheet, setShowEditSheet] = useState(false)
  const longPressTimer = useRef(null)
  const longPressFired = useRef(false)
  const isTouching = useRef(false)
  const [phase, setPhase] = useState(null)
  const checkboxRef = useRef(null)

  const isDone = todo.status === 'done' || todo.status === 'ghost'
  const isSelected = !!selectedIds[todo.id]
  const isFocused = focusedTodoId === todo.id && !multiSelectMode
  const taskSpace = todo.spaceId ? spaces.find(s => s.id === todo.spaceId) : null
  const spaceColor = taskSpace?.color || null
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

  const openEditSheet = () => {
    if (isDone || phase) return
    // Pre-focus a hidden input during the user gesture to claim the keyboard on mobile
    const tmp = document.createElement('input')
    tmp.style.cssText = 'position:fixed;top:-100px;left:0;opacity:0;height:0;width:0;font-size:16px'
    document.body.appendChild(tmp)
    tmp.focus()
    setTimeout(() => tmp.remove(), 600)
    setShowEditSheet(true)
  }

  // --- Touch gesture handling ---
  const touchStart = useRef(null)

  const handleTouchStart = (e) => {
    if (isDone || phase) return
    isTouching.current = true

    // Two-finger tap → edit sheet
    if (e.touches.length >= 2) {
      e.preventDefault()
      if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null }
      touchStart.current = null
      openEditSheet()
      return
    }

    const t = e.touches[0]
    touchStart.current = { x: t.clientX, y: t.clientY, time: Date.now(), maxDx: 0, maxDy: 0 }
    longPressFired.current = false

    // Long-press → multi-select
    longPressTimer.current = setTimeout(() => {
      longPressFired.current = true
      if (navigator.vibrate) navigator.vibrate(15)
      if (multiSelectMode) {
        toggleSelect(todo.id)
      } else {
        enterMultiSelect(todo.id)
      }
      touchStart.current = null
      longPressTimer.current = null
    }, 500)
  }

  const handleTouchMove = (e) => {
    if (!touchStart.current || dragging) return
    const t = e.touches[0]
    const dx = Math.abs(t.clientX - touchStart.current.x)
    const dy = Math.abs(t.clientY - touchStart.current.y)

    touchStart.current.maxDx = Math.max(touchStart.current.maxDx, dx)
    touchStart.current.maxDy = Math.max(touchStart.current.maxDy, dy)

    // Any movement cancels long-press
    if (dx > 8 || dy > 8) {
      if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null }
    }

    // Stop view swipe on horizontal
    if (dx > 10 && dx > dy) e.stopPropagation()

    // Detach into drag/fling mode
    if (dx > 30 && dx > dy * 1.5) {
      if (navigator.vibrate) navigator.vibrate(8)
      if (multiSelectMode && isSelected) {
        const selectedTodos = allTodos.filter(t => selectedIds[t.id])
        setDragging({ x: t.clientX, y: t.clientY, todos: selectedTodos })
      } else if (!multiSelectMode) {
        setDragging({ x: t.clientX, y: t.clientY })
      }
      touchStart.current = null
      if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null }
    }
  }

  const handleTouchEnd = () => {
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null }
    setTimeout(() => { isTouching.current = false }, 200)

    if (longPressFired.current) { touchStart.current = null; return }
    if (!touchStart.current) return

    const dt = Date.now() - touchStart.current.time
    const maxMove = Math.max(touchStart.current.maxDx, touchStart.current.maxDy)
    touchStart.current = null

    if (dt > 400 || maxMove > 25) return

    if (multiSelectMode) {
      toggleSelect(todo.id)
    } else {
      // Single tap → focus (show edit icon)
      setFocusedTodo(todo.id)
    }
  }

  const handleDragDone = () => {
    setDragging(null)
    clearFocusedTodo()
    if (multiSelectMode) clearMultiSelect()
  }

  const isChecked = phase === 'checked' || phase === 'collapsing'
  const isCollapsing = phase === 'collapsing'

  const taskRow = (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onContextMenu={(e) => { e.preventDefault(); if (isTouching.current) return; if (!isDone && !phase) openEditSheet() }}
      className={`flex items-center gap-3 ${isDone ? '' : 'active:scale-[0.98]'}`}
      style={{
        padding: isDone ? '10px 20px' : '14px 20px',
        WebkitUserSelect: 'none', userSelect: 'none',
        borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.025)',
        opacity: isDone ? 0.3 : isCollapsing ? 0 : 1,
        transform: isCollapsing ? 'scaleY(0)' : 'scaleY(1)',
        maxHeight: isCollapsing ? 0 : 200, overflow: 'hidden', transformOrigin: 'top',
        transition: isCollapsing ? 'opacity 200ms, max-height 200ms, transform 200ms' : 'all 200ms',
        background: isSelected ? 'rgba(244,114,182,0.10)' : isFocused ? 'rgba(255,255,255,0.03)' : 'transparent',
        borderRadius: 16,
        boxShadow: isSelected ? 'inset 0 0 0 1.5px rgba(244,114,182,0.25)' : isFocused ? 'inset 0 0 0 1px rgba(255,255,255,0.06)' : 'none',
      }}
      onMouseEnter={(e) => { if (!isDone && !phase && !isSelected) { e.currentTarget.style.background = 'var(--surface-card)'; e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.15), 0 0 0 1px rgba(255,255,255,0.05)' } }}
      onMouseLeave={(e) => { if (!isSelected) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.boxShadow = 'none' } }}
    >
      {/* Left side: multi-select indicator / drag handle / checkbox */}
      {multiSelectMode ? (
        <div className="flex items-center justify-center flex-shrink-0 rounded-full"
          style={{
            width: 22, height: 22,
            border: isSelected ? '2px solid transparent' : '2px solid rgba(255,255,255,0.22)',
            background: isSelected ? 'linear-gradient(135deg, var(--accent-rose), var(--accent-coral))' : 'transparent',
            transition: 'all 200ms',
          }}>
          {isSelected && (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
              <path d="M2 5.5l2 2L8 3" />
            </svg>
          )}
        </div>
      ) : isFocused && onReorderStart ? (
        <div
          onTouchStart={(e) => {
            e.stopPropagation()
            const t = e.touches[0]
            onReorderStart(todo.id, t.clientY)
          }}
          onTouchMove={(e) => {
            e.stopPropagation()
            e.preventDefault()
            onReorderMove?.(e.touches[0].clientY)
          }}
          onTouchEnd={(e) => {
            e.stopPropagation()
            onReorderEnd?.()
          }}
          className="flex items-center justify-center flex-shrink-0 animate-fade-in"
          style={{ width: 22, height: 22, cursor: 'grab', touchAction: 'none', color: 'var(--text-ghost)', fontSize: 14, letterSpacing: '-2px' }}
        >⋮⋮</div>
      ) : (
        <button ref={checkboxRef}
          onClick={(e) => { e.stopPropagation(); handleCheckbox() }}
          onTouchStart={(e) => e.stopPropagation()}
          className="flex items-center justify-center flex-shrink-0 rounded-full"
          style={{
            width: 22, height: 22,
            transition: 'all 250ms cubic-bezier(0.34,1.56,0.64,1)',
            border: isChecked ? '2px solid transparent' : isDone ? '2px solid transparent' : `2px solid ${spaceColor ? spaceColor + '50' : 'rgba(255,255,255,0.22)'}`,
            background: isChecked ? 'linear-gradient(135deg, var(--accent-rose), var(--accent-coral))' : isDone ? 'linear-gradient(135deg, var(--accent-rose), var(--accent-coral))' : 'transparent',
            transform: isChecked && !isCollapsing ? 'scale(1.3)' : 'scale(1)',
            boxShadow: (isChecked || isDone) ? '0 0 12px rgba(244,114,182,0.30)' : 'none',
          }}
          onMouseEnter={(e) => { if (!isDone && !phase) { e.currentTarget.style.borderColor = 'var(--accent-rose)'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(244,114,182,0.12)'; e.currentTarget.style.transform = 'scale(1.08)' } }}
          onMouseLeave={(e) => { if (!isDone && !phase) { e.currentTarget.style.borderColor = spaceColor ? spaceColor + '50' : 'rgba(255,255,255,0.22)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'scale(1)' } }}
        >
          {(isDone || isChecked) && (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"
              style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))' }}>
              <path d="M2 5.5l2 2L8 3" />
            </svg>
          )}
        </button>
      )}

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
        {!isDone && !isChecked && (showDate || todo.dueTime) && (
          <span style={{
            display: 'inline-block', marginTop: 6,
            fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.02em',
            color: isOverdue ? 'var(--color-danger)' : 'var(--accent-sky)',
            background: isOverdue ? 'rgba(255,107,107,0.10)' : 'rgba(96,165,250,0.10)',
            border: `1px solid ${isOverdue ? 'rgba(255,107,107,0.15)' : 'rgba(96,165,250,0.15)'}`,
            padding: '2px 8px', borderRadius: 10,
          }}>{showDate ? dateLabel : ''}{todo.dueTime && `${showDate ? ' ' : ''}${todo.dueTime}`}</span>
        )}
        {!isDone && !isChecked && todo.subtasks?.length > 0 && !isFocused && (
          <span style={{
            display: 'inline-block', marginTop: 6, marginLeft: showDate ? 6 : 0,
            fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.02em',
            color: 'var(--accent-rose)',
            background: 'rgba(244,114,182,0.10)',
            border: '1px solid rgba(244,114,182,0.15)',
            padding: '2px 8px', borderRadius: 10,
          }}>
            {todo.subtasks.filter(s => s.done).length}/{todo.subtasks.length}
          </span>
        )}
        {/* Inline subtasks when focused */}
        {isFocused && todo.subtasks?.length > 0 && (
          <div className="animate-slide-down" style={{ marginTop: 8 }}>
            {todo.subtasks.map(s => (
              <button key={s.id}
                onClick={(e) => {
                  e.stopPropagation()
                  const updated = todo.subtasks.map(st => st.id === s.id ? { ...st, done: !st.done } : st)
                  updateTodo(todo.id, { subtasks: updated })
                }}
                onTouchStart={(e) => e.stopPropagation()}
                className="flex items-center gap-2 w-full text-left"
                style={{ padding: '4px 0' }}
              >
                <div style={{
                  width: 14, height: 14, borderRadius: '50%', flexShrink: 0,
                  border: s.done ? '1.5px solid transparent' : '1.5px solid rgba(255,255,255,0.2)',
                  background: s.done ? 'linear-gradient(135deg, var(--accent-rose), var(--accent-coral))' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {s.done && <svg width="7" height="7" viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M2 5.5l2 2L8 3" /></svg>}
                </div>
                <span style={{
                  fontSize: 13, color: s.done ? 'var(--text-done)' : 'var(--text-secondary)',
                  textDecoration: s.done ? 'line-through' : 'none',
                }}>{s.text}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Edit icon for focused items */}
      {isFocused && !isDone && (
        <button onClick={(e) => { e.stopPropagation(); openEditSheet(); clearFocusedTodo() }}
          onTouchStart={(e) => e.stopPropagation()}
          className="flex-shrink-0 animate-fade-in"
          style={{ padding: '6px 4px', color: 'var(--accent-coral)', fontSize: 15, opacity: 0.8 }}>✎</button>
      )}

      {/* Delete button for completed items */}
      {isDone && (
        <button onClick={(e) => { e.stopPropagation(); deleteTodo(todo.id) }}
          onTouchStart={(e) => e.stopPropagation()}
          className="flex-shrink-0"
          style={{ padding: '0 4px', color: 'var(--text-ghost)', fontSize: 14, opacity: 0.4 }}>×</button>
      )}
    </div>
  )

  return (
    <>
      {taskRow}
      {dragging && (
        <DragOrganize
          todos={dragging.todos || [todo]}
          startPos={{ x: dragging.x, y: dragging.y }}
          onDone={handleDragDone}
        />
      )}
      {showEditSheet && <TaskEditSheet todo={todo} onClose={() => setShowEditSheet(false)} />}
    </>
  )
}
