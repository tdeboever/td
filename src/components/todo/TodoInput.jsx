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
  const handleBlur = () => { requestAnimationFrame(() => { if (containerRef.current && !containerRef.current.contains(document.activeElement) && !text.trim()) setFocused(false) }) }
  const hasText = text.trim().length > 0

  return (
    <div ref={containerRef} style={{ padding: '12px 20px 12px' }} {...swipeHandlers}>
      {suggestions.length > 0 && focused && (
        <div className="mb-3 flex gap-2 overflow-x-auto no-scrollbar animate-slide-down">
          {suggestions.map((s) => (
            <button key={s} onMouseDown={(e) => e.preventDefault()} onClick={() => { setText(s); inputRef.current?.focus() }}
              style={{ padding: '6px 14px', borderRadius: 9999, border: '1px solid var(--border-visible)', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', whiteSpace: 'nowrap', flexShrink: 0, background: 'transparent' }}>
              {s}
            </button>
          ))}
        </div>
      )}

      {focused && (
        <div className="mb-2 animate-slide-down" style={{
          background: 'var(--surface-glass)', backdropFilter: 'blur(20px) saturate(1.3)', WebkitBackdropFilter: 'blur(20px) saturate(1.3)',
          borderTop: '1px solid var(--border-subtle)', padding: '10px 0', borderRadius: 16,
        }}>
          <ChipBar spaceId={effectiveSpaceId} dueDate={dueDate} onSpaceChange={setSpaceId} onDueDateChange={setDueDate} />
        </div>
      )}

      <div className="flex items-center gap-3" style={{
        borderRadius: 16, padding: '14px 16px', border: 'none',
        background: focused ? 'var(--bg-float)' : 'var(--bg-raised)',
        boxShadow: focused
          ? '0 0 12px rgba(255,123,84,0.15), 0 0 30px rgba(255,123,84,0.06)'
          : '0 0 0 1px var(--border-visible), 0 1px 2px rgba(0,0,0,0.15)',
        transition: 'all 250ms cubic-bezier(0.4,0,0.2,1)',
      }}>
        <span style={{
          fontSize: 14, color: sending ? 'var(--accent-mint)' : 'var(--accent-coral)',
          transition: 'all 300ms cubic-bezier(0.16,1,0.3,1)',
          transform: focused && !hasText ? 'scale(1.15) rotate(45deg)' : 'scale(1)',
          display: 'inline-block',
        }}>{sending ? '✓' : focused ? '◆' : '◇'}</span>

        <div className="flex-1 relative" style={{ minHeight: 20 }}>
          <input ref={inputRef} type="search" value={text}
            onChange={(e) => setText(e.target.value)} onKeyDown={handleKeyDown}
            onFocus={() => setFocused(true)} onBlur={handleBlur}
            placeholder="What needs doing?" autoComplete="off" enterKeyHint="done"
            className="w-full bg-transparent"
            style={{ fontSize: 15, fontWeight: 500, letterSpacing: '-0.01em', color: 'var(--text-primary)', outline: 'none', border: 'none', boxShadow: 'none', WebkitAppearance: 'none', ...(sending ? { transform: 'translateY(-20px)', opacity: 0, transition: 'all 200ms' } : {}) }}
          />
        </div>

        {hasText && !sending ? (
          <button onClick={submit} className="animate-slide-up" style={{ color: 'var(--accent-coral)', fontSize: 20, lineHeight: 1, flexShrink: 0 }}>↑</button>
        ) : focused && !sending ? (
          <span style={{ color: 'var(--text-ghost)', fontSize: 16, lineHeight: 1 }}>↑</span>
        ) : null}
      </div>

      {hasText && (
        <p className="text-center animate-fade-in" style={{ fontSize: 11, color: 'var(--text-ghost)', marginTop: 8, opacity: 0.6 }}>swipe up to send</p>
      )}
    </div>
  )
}
