import { useState, useRef, useCallback } from 'react'
import { useTodoStore } from '../../stores/todoStore'
import { useUiStore } from '../../stores/uiStore'
import { useSwipe } from '../../hooks/useSwipe'
import { useAutocomplete } from '../../hooks/useAutocomplete'
import ChipBar from './ChipBar'

export default function TodoInput() {
  const addTodo = useTodoStore((s) => s.addTodo)
  const { activeView, activeSpaceId, activeListId, setInputFocused } = useUiStore()

  const [text, setText] = useState('')
  const [priority, setPriority] = useState(0)
  const [dueDate, setDueDate] = useState(null)
  const [spaceId, setSpaceId] = useState(null)
  const [focused, _setFocused] = useState(false)
  const [sending, setSending] = useState(false)
  const setFocused = (v) => { _setFocused(v); setInputFocused(v) }
  const inputRef = useRef(null)
  const containerRef = useRef(null)
  const inputBoxRef = useRef(null)

  const effectiveSpaceId = spaceId ?? (activeView === 'space' ? activeSpaceId : null)
  const effectiveListId = activeView === 'list' ? activeListId : null
  const suggestions = useAutocomplete(effectiveListId, text)

  const submit = useCallback(() => {
    if (!text.trim() || sending) return

    // Haptic
    if (navigator.vibrate) navigator.vibrate(8)

    // Animate: text flies up, input flashes
    setSending(true)

    // Flash the input border accent
    if (inputBoxRef.current) {
      inputBoxRef.current.style.borderColor = 'var(--color-accent)'
      inputBoxRef.current.style.boxShadow = '0 0 0 3px var(--color-accent-glow)'
    }

    // Add the task after a brief moment so animation is visible
    setTimeout(() => {
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
      setSending(false)
      setFocused(false)
      inputRef.current?.blur()

      if (inputBoxRef.current) {
        inputBoxRef.current.style.borderColor = ''
        inputBoxRef.current.style.boxShadow = ''
      }
    }, 250)
  }, [text, sending, effectiveListId, effectiveSpaceId, priority, dueDate, addTodo])

  const swipeHandlers = useSwipe({ onSwipeUp: submit })

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      submit()
    }
  }

  const handleBlur = () => {
    requestAnimationFrame(() => {
      if (containerRef.current && !containerRef.current.contains(document.activeElement) && !text.trim()) {
        setFocused(false)
      }
    })
  }

  const hasText = text.trim().length > 0

  return (
    <div ref={containerRef} style={{ padding: '12px 20px 12px' }} {...swipeHandlers}>
      {/* Autocomplete */}
      {suggestions.length > 0 && focused && (
        <div className="mb-3 flex gap-1.5 overflow-x-auto no-scrollbar animate-slide-down">
          {suggestions.map((s) => (
            <button key={s} onMouseDown={(e) => e.preventDefault()} onClick={() => { setText(s); inputRef.current?.focus() }}
              className="rounded-full border border-border text-[12px] font-medium text-text-dim whitespace-nowrap hover:text-text hover:border-border-light transition-colors"
              style={{ padding: '6px 14px' }}>
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Chip bar */}
      {focused && (
        <div className="mb-3 animate-slide-down">
          <ChipBar
            spaceId={effectiveSpaceId}
            dueDate={dueDate}
            onSpaceChange={setSpaceId}
            onDueDateChange={setDueDate}
          />
        </div>
      )}

      {/* Input field */}
      <div
        ref={inputBoxRef}
        className={`
          flex items-center gap-3 bg-surface transition-all duration-200 overflow-hidden
          ${focused
            ? 'border border-accent shadow-[0_0_0_3px_var(--color-accent-glow)]'
            : 'border border-border'
          }
        `}
        style={{ borderRadius: 12, padding: '14px 16px' }}
      >
        {/* + symbol */}
        <span className={`text-[20px] leading-none font-medium select-none transition-all duration-200 ${sending ? 'text-accent scale-110' : 'text-accent'}`}>
          {sending ? '✓' : '+'}
        </span>

        {/* Input text — flies up when sending */}
        <div className="flex-1 relative" style={{ minHeight: 20 }}>
          <input
            ref={inputRef}
            type="search"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={handleBlur}
            placeholder="What needs doing?"
            autoComplete="off"
            enterKeyHint="done"
            className="w-full bg-transparent text-[15px] text-text placeholder:text-text-dim outline-none transition-all duration-200"
            style={sending ? { transform: 'translateY(-20px)', opacity: 0 } : {}}
          />
        </div>

        {/* Send arrow */}
        {hasText && !sending ? (
          <button onClick={submit} className="text-accent text-[20px] leading-none flex-shrink-0 hover:opacity-70 transition-opacity">
            ↑
          </button>
        ) : focused && !sending ? (
          <span className="text-text-dim text-[16px] leading-none select-none">↑</span>
        ) : null}
      </div>

      {/* Swipe hint */}
      {hasText && (
        <p className="text-center text-[11px] text-text-faint mt-2 animate-fade-in">
          swipe up to send
        </p>
      )}
    </div>
  )
}
