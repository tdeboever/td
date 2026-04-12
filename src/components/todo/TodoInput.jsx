import { useState, useRef, useCallback, useEffect } from 'react'
import { useTodoStore } from '../../stores/todoStore'
import { useUiStore } from '../../stores/uiStore'
import { useSwipe } from '../../hooks/useSwipe'
import { useAutocomplete } from '../../hooks/useAutocomplete'
import { toLocalDateStr } from '../../lib/utils'
import ChipBar from './ChipBar'

function parseSmartInput(text) {
  const trimmed = text.trim()
  const colonIdx = trimmed.indexOf(':')

  // "task: sub1, sub2, sub3" → single task with subtasks
  // Skip if the colon is part of a time pattern like "6:00"
  if (colonIdx > 0) {
    const charBefore = trimmed[colonIdx - 1]
    const charAfter = trimmed[colonIdx + 1]
    const isTimeLike = /\d/.test(charBefore) && charAfter && /\d/.test(charAfter)
    if (!isTimeLike) {
      const title = trimmed.slice(0, colonIdx).trim()
      const rest = trimmed.slice(colonIdx + 1).trim()
      const subs = rest.split(',').map(s => s.trim()).filter(Boolean)
      if (title && subs.length > 1) {
        return { type: 'subtasks', title, subtasks: subs }
      }
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

function parseNaturalDateTime(text) {
  let title = text
  let dueDate = null
  let dueTime = null
  const today = new Date()

  // --- TIME ---
  // "at 6pm", "6:30pm", "at 6:30 pm", "6:30 p.m.", "at 6 pm"
  const timeAmPm = /\b(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)\b/i
  // "at 18:00" (24h, requires "at")
  const time24 = /\bat\s+(\d{1,2}):(\d{2})\b/
  // "at noon", "at midnight"
  const timeWord = /\b(?:at\s+)?(noon|midnight)\b/i

  let m = title.match(timeAmPm)
  if (m) {
    let h = parseInt(m[1])
    const min = m[2] ? parseInt(m[2]) : 0
    const p = m[3].toLowerCase().replace(/\./g, '')
    if (p === 'pm' && h < 12) h += 12
    if (p === 'am' && h === 12) h = 0
    dueTime = `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
    title = title.replace(m[0], ' ')
  } else if ((m = title.match(time24))) {
    dueTime = `${String(parseInt(m[1])).padStart(2, '0')}:${m[2]}`
    title = title.replace(m[0], ' ')
  } else if ((m = title.match(timeWord))) {
    dueTime = m[1].toLowerCase() === 'noon' ? '12:00' : '00:00'
    title = title.replace(m[0], ' ')
  }

  // --- DAY ---
  const dayNames = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6,
    sun: 0, mon: 1, tue: 2, tues: 2, wed: 3, thu: 4, thur: 4, thurs: 4, fri: 5, sat: 6 }

  if ((m = title.match(/\b(tomorrow|tmrw|tmw)\b/i))) {
    const d = new Date(today); d.setDate(d.getDate() + 1)
    dueDate = toLocalDateStr(d)
    title = title.replace(m[0], ' ')
  } else if ((m = title.match(/\btoday\b/i))) {
    dueDate = toLocalDateStr(today)
    title = title.replace(m[0], ' ')
  } else if ((m = title.match(/\bnext\s+week\b/i))) {
    const d = new Date(today); d.setDate(d.getDate() + 7)
    dueDate = toLocalDateStr(d)
    title = title.replace(m[0], ' ')
  } else if ((m = title.match(/\b(next\s+|this\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|tues|wed|thu|thur|thurs|fri|sat|sun)\b/i))) {
    const isNext = m[1] && /next/i.test(m[1])
    const dayKey = m[2].toLowerCase()
    const target = dayNames[dayKey]
    if (target !== undefined) {
      const current = today.getDay()
      let ahead = (target - current + 7) % 7
      if (ahead === 0) ahead = 7
      if (isNext && ahead <= 7) ahead += 7
      const d = new Date(today); d.setDate(d.getDate() + ahead)
      dueDate = toLocalDateStr(d)
      title = title.replace(m[0], ' ')
    }
  }

  // If we found a time but no day, default to today
  if (dueTime && !dueDate) {
    dueDate = toLocalDateStr(today)
  }

  // Clean up: trailing prepositions, double spaces
  title = title.replace(/\s+(at|on|by)\s*$/i, '')
  title = title.replace(/\s{2,}/g, ' ').trim()

  return { title, dueDate, dueTime }
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
      const baseOpts = { type: mode, listId: mode === 'note' ? null : effectiveListId, spaceId: mode === 'note' ? null : effectiveSpaceId, priority: mode === 'note' ? 0 : priority, dueDate: mode === 'note' ? null : dueDate, dueTime: mode === 'note' ? null : dueTime }
      const parsed = parseSmartInput(text)

      // Apply NLP date/time extraction to a task title, merging with chip selections
      const addWithNlp = (rawTitle, opts) => {
        const { title, dueDate: nlpDate, dueTime: nlpTime } = parseNaturalDateTime(rawTitle)
        return addTodo(title, { ...opts, dueDate: opts.dueDate || nlpDate, dueTime: opts.dueTime || nlpTime })
      }

      if (parsed.type === 'multi') {
        for (const item of parsed.items) addWithNlp(item, baseOpts)
      } else if (parsed.type === 'subtasks') {
        const created = addWithNlp(parsed.title, baseOpts)
        if (created) {
          const subs = parsed.subtasks.map(s => ({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5), text: s, done: false }))
          updateTodo(created.id, { subtasks: subs })
        }
      } else {
        addWithNlp(parsed.title, baseOpts)
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
            <div className="animate-slide-down" style={{ marginTop: 6, fontSize: 11, color: 'var(--text-ghost)', lineHeight: 1.8, opacity: 0.7 }}>
              <span style={{ color: 'var(--accent-coral)' }}>a, b, c</span> creates 3 separate tasks<br />
              <span style={{ color: 'var(--accent-coral)' }}>task: a, b, c</span> creates 1 task with subtasks<br />
              <span style={{ color: 'var(--accent-coral)' }}>...at 3pm tomorrow</span> auto-sets date & time
            </div>
          )}
        </div>
      )}
    </div>
  )
}
