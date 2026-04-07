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
    if (navigator.vibrate) navigator.vibrate(8)
    setSending(true)
    setTimeout(() => {
      addTodo(text.trim(), { listId: effectiveListId, spaceId: effectiveSpaceId, priority, dueDate })
      setText(''); setPriority(0); setDueDate(null); setSpaceId(null)
      setSending(false); setFocused(false); inputRef.current?.blur()
    }, 250)
  }, [text, sending, effectiveListId, effectiveSpaceId, priority, dueDate, addTodo])

  const swipeHandlers = useSwipe({ onSwipeUp: submit })

  const handleKeyDown = (e) => { if (e.key === 'Enter') { e.preventDefault(); submit() } }

  const handleBlur = () => {
    requestAnimationFrame(() => {
      if (containerRef.current && !containerRef.current.contains(document.activeElement) && !text.trim()) setFocused(false)
    })
  }

  const hasText = text.trim().length > 0

  return (
    <div ref={containerRef} style={{ padding: '12px 20px 12px' }} {...swipeHandlers}>
      {/* Autocomplete */}
      {suggestions.length > 0 && focused && (
        <div className="mb-3 flex gap-2 overflow-x-auto no-scrollbar animate-slide-down">
          {suggestions.map((s) => (
            <button key={s} onMouseDown={(e) => e.preventDefault()} onClick={() => { setText(s); inputRef.current?.focus() }}
              style={{ padding: '6px 14px', borderRadius: 9999, border: '1px solid rgba(255,255,255,0.08)', fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap', flexShrink: 0, background: 'transparent' }}>
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Chip bar — glassmorphism */}
      {focused && (
        <div className="mb-2 animate-slide-down" style={{
          background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(16px) saturate(1.2)', WebkitBackdropFilter: 'blur(16px) saturate(1.2)',
          borderTop: '1px solid rgba(255,255,255,0.06)', padding: '10px 0', borderRadius: 14,
        }}>
          <ChipBar spaceId={effectiveSpaceId} dueDate={dueDate} onSpaceChange={setSpaceId} onDueDateChange={setDueDate} />
        </div>
      )}

      {/* Input field */}
      <div ref={inputBoxRef} className="flex items-center gap-3 transition-all duration-250" style={{
        borderRadius: 14, padding: '14px 16px',
        background: 'rgba(255,255,255,0.06)',
        boxShadow: focused
          ? '0 0 0 1px rgba(255,140,90,0.4), 0 0 0 4px rgba(255,107,53,0.1), 0 4px 24px rgba(255,107,53,0.08)'
          : '0 0 0 1px rgba(255,255,255,0.06)',
      }}>
        {/* Diamond icon */}
        <span style={{
          fontSize: 14, color: sending ? 'var(--accent-gold)' : 'var(--accent-flame)',
          transition: 'all 300ms cubic-bezier(0.16,1,0.3,1)',
          transform: focused && !hasText ? 'scale(1.15) rotate(45deg)' : 'scale(1) rotate(0deg)',
          display: 'inline-block',
        }}>
          {sending ? '✓' : '◆'}
        </span>

        <div className="flex-1 relative" style={{ minHeight: 20 }}>
          <input ref={inputRef} type="search" value={text}
            onChange={(e) => setText(e.target.value)} onKeyDown={handleKeyDown}
            onFocus={() => setFocused(true)} onBlur={handleBlur}
            placeholder="What needs doing?" autoComplete="off" enterKeyHint="done"
            className="w-full bg-transparent outline-none"
            style={{ fontSize: 15, color: 'var(--color-text)', transition: 'all 200ms', ...(sending ? { transform: 'translateY(-20px)', opacity: 0 } : {}) }}
          />
        </div>

        {hasText && !sending ? (
          <button onClick={submit} className="animate-slide-up" style={{ color: 'var(--accent-flame)', fontSize: 20, lineHeight: 1, flexShrink: 0 }}>↑</button>
        ) : focused && !sending ? (
          <span style={{ color: 'var(--color-text-ghost)', fontSize: 16, lineHeight: 1 }}>↑</span>
        ) : null}
      </div>

      {hasText && (
        <p className="text-center animate-fade-in" style={{ fontSize: 11, color: 'var(--color-text-ghost)', marginTop: 8, opacity: 0.6 }}>
          swipe up to send
        </p>
      )}
    </div>
  )
}
