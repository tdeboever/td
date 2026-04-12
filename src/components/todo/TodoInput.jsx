import { useState, useRef, useCallback, useEffect } from 'react'
import { useTodoStore } from '../../stores/todoStore'
import { useUiStore } from '../../stores/uiStore'
import { useSwipe } from '../../hooks/useSwipe'
import { useAutocomplete } from '../../hooks/useAutocomplete'
import ChipBar from './ChipBar'

function parseSmartInput(text) {
  const trimmed = text.trim()
  const colonIdx = trimmed.indexOf(':')

  // "task: sub1, sub2, sub3" → single task with subtasks
  if (colonIdx > 0) {
    const title = trimmed.slice(0, colonIdx).trim()
    const rest = trimmed.slice(colonIdx + 1).trim()
    const subs = rest.split(',').map(s => s.trim()).filter(Boolean)
    if (title && subs.length > 1) {
      return { type: 'subtasks', title, subtasks: subs }
    }
  }

  // "task1, task2, task3" → multiple separate tasks
  if (trimmed.includes(',')) {
    const items = trimmed.split(',').map(s => s.trim()).filter(Boolean)
    if (items.length > 1) {
      return { type: 'multi', items }
    }
  }

  // Single task
  return { type: 'single', title: trimmed }
}

export default function TodoInput() {
  const addTodo = useTodoStore((s) => s.addTodo)
  const { activeView, activeSpaceId, activeListId, setInputFocused } = useUiStore()
  const [text, setText] = useState('')
  const [mode, setMode] = useState(activeView === 'notes' ? 'note' : 'task')
  useEffect(() => { setMode(activeView === 'notes' ? 'note' : 'task') }, [activeView])
  const [priority, setPriority] = useState(0)
  const [dueDate, setDueDate] = useState(null)
  const [dueTime, setDueTime] = useState(null)
  const [spaceId, setSpaceId] = useState(null)
  const [listId, setListId] = useState(null)
  const [focused, _setFocused] = useState(false)
  const [sending, setSending] = useState(false)
  const [showTip, setShowTip] = useState(false)
  const setFocused = (v) => { _setFocused(v); setInputFocused(v); if (!v) setShowTip(false) }
  const inputRef = useRef(null)
  const containerRef = useRef(null)

  const effectiveSpaceId = spaceId ?? (activeView === 'space' ? activeSpaceId : null)
  const effectiveListId = listId ?? (activeView === 'list' ? activeListId : null)
  const suggestions = useAutocomplete(effectiveListId, text)

  const updateTodo = useTodoStore((s) => s.updateTodo)

  const submit = useCallback(() => {
    if (!text.trim() || sending) return
    if (navigator.vibrate) navigator.vibrate(8)
    setSending(true)
    setTimeout(() => {
      const opts = { type: mode, listId: mode === 'note' ? null : effectiveListId, spaceId: mode === 'note' ? null : effectiveSpaceId, priority: mode === 'note' ? 0 : priority, dueDate: mode === 'note' ? null : dueDate, dueTime: mode === 'note' ? null : dueTime }
      const parsed = parseSmartInput(text)

      if (parsed.type === 'multi') {
        for (const item of parsed.items) addTodo(item, opts)
      } else if (parsed.type === 'subtasks') {
        const created = addTodo(parsed.title, opts)
        if (created) {
          const subs = parsed.subtasks.map(s => ({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5), text: s, done: false }))
          updateTodo(created.id, { subtasks: subs })
        }
      } else {
        addTodo(parsed.title, opts)
      }

      setText(''); setPriority(0); setDueDate(null); setDueTime(null)
      setSending(false)
      inputRef.current?.focus()
    }, 250)
  }, [text, sending, effectiveListId, effectiveSpaceId, priority, dueDate, dueTime, mode, addTodo, updateTodo])

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

      {focused && mode === 'task' && (
        <div className="animate-slide-down" style={{ marginBottom: 12 }}>
          <ChipBar spaceId={effectiveSpaceId} listId={effectiveListId} dueDate={dueDate} dueTime={dueTime} onSpaceChange={setSpaceId} onListChange={setListId} onDueDateChange={setDueDate} onDueTimeChange={setDueTime} />
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
        <button onMouseDown={(e) => e.preventDefault()} onClick={() => setMode(mode === 'task' ? 'note' : 'task')}
          style={{
            fontSize: 14,
            color: sending ? 'var(--accent-mint)' : mode === 'note' ? 'var(--accent-lavender)' : 'var(--accent-coral)',
            transition: 'all 300ms cubic-bezier(0.16,1,0.3,1)',
            transform: focused && !hasText && mode === 'task' ? 'scale(1.15) rotate(45deg)' : 'scale(1)',
            display: 'inline-block',
          }}>{sending ? '✓' : mode === 'note' ? '✎' : focused ? '◆' : '◇'}</button>

        <div className="flex-1 relative" style={{ minHeight: 20 }}>
          <input ref={inputRef} type="search" value={text}
            onChange={(e) => setText(e.target.value)} onKeyDown={handleKeyDown}
            onFocus={() => setFocused(true)} onBlur={handleBlur}
            placeholder={mode === 'note' ? 'Capture a thought...' : 'What needs doing?'} autoComplete="off" enterKeyHint="done"
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

      {focused && !hasText && mode === 'task' && (
        <div className="animate-fade-in" style={{ marginTop: 6, textAlign: 'center' }}>
          <button onMouseDown={(e) => e.preventDefault()} onClick={() => setShowTip(!showTip)}
            style={{ fontSize: 11, color: 'var(--text-ghost)', opacity: 0.5 }}>
            {showTip ? '×' : 'tips'}
          </button>
          {showTip && (
            <div className="animate-slide-down" style={{ marginTop: 6, fontSize: 11, color: 'var(--text-ghost)', lineHeight: 1.6, opacity: 0.7 }}>
              <span style={{ color: 'var(--accent-coral)' }}>a, b, c</span> creates 3 separate tasks<br />
              <span style={{ color: 'var(--accent-coral)' }}>task: a, b, c</span> creates 1 task with subtasks
            </div>
          )}
        </div>
      )}
    </div>
  )
}
