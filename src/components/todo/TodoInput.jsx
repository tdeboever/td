import { useState, useRef, useCallback } from 'react'
import { useTodoStore } from '../../stores/todoStore'
import { useUiStore } from '../../stores/uiStore'
import { useSwipe } from '../../hooks/useSwipe'
import ChipBar from './ChipBar'

export default function TodoInput() {
  const addTodo = useTodoStore((s) => s.addTodo)
  const { activeView, activeSpaceId, activeListId } = useUiStore()

  const [text, setText] = useState('')
  const [priority, setPriority] = useState(0)
  const [dueDate, setDueDate] = useState(null)
  const [spaceId, setSpaceId] = useState(null)
  const [showChips, setShowChips] = useState(false)
  const inputRef = useRef(null)

  // Default space based on current view
  const effectiveSpaceId = spaceId ?? (activeView === 'space' ? activeSpaceId : null)
  const effectiveListId = activeView === 'list' ? activeListId : null

  const submit = useCallback(() => {
    if (!text.trim()) return
    addTodo(text.trim(), {
      listId: effectiveListId,
      spaceId: effectiveSpaceId,
      priority,
      dueDate,
    })
    setText('')
    setPriority(0)
    setDueDate(null)
    setSpaceId(null)
  }, [text, effectiveListId, effectiveSpaceId, priority, dueDate, addTodo])

  const swipeHandlers = useSwipe({
    onSwipeUp: submit,
  })

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div className="border-t border-border bg-bg safe-bottom">
      {/* Chip bar */}
      {showChips && (
        <ChipBar
          spaceId={effectiveSpaceId}
          priority={priority}
          dueDate={dueDate}
          onSpaceChange={setSpaceId}
          onPriorityChange={setPriority}
          onDueDateChange={setDueDate}
        />
      )}

      {/* Input area */}
      <div className="px-4 py-3" {...swipeHandlers}>
        <div className="flex items-center gap-3 bg-surface rounded-xl px-4 py-3">
          <button
            onClick={() => setShowChips((s) => !s)}
            className={`text-lg flex-shrink-0 transition-transform ${showChips ? 'rotate-45' : ''}`}
          >
            <span className={showChips ? 'text-accent' : 'text-text-dim'}>+</span>
          </button>

          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowChips(true)}
            placeholder="Add a task..."
            className="flex-1 bg-transparent text-sm text-text placeholder:text-text-dim/40 outline-none"
          />

          {text.trim() && (
            <button onClick={submit} className="text-accent text-sm font-medium flex-shrink-0">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path d="M3.5 10a.75.75 0 01.75-.75h8.94L9.72 5.78a.75.75 0 011.06-1.06l5 5a.75.75 0 010 1.06l-5 5a.75.75 0 11-1.06-1.06l3.47-3.47H4.25A.75.75 0 013.5 10z" />
              </svg>
            </button>
          )}
        </div>

        {/* Swipe hint */}
        {text.trim() && (
          <div className="flex justify-center mt-2">
            <span className="text-[10px] text-text-dim/30">↑ swipe up to send</span>
          </div>
        )}
      </div>
    </div>
  )
}
