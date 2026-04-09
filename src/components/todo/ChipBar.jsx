import { useState, useRef } from 'react'
import { useSpaceStore } from '../../stores/spaceStore'
import { useListStore } from '../../stores/listStore'
import { toLocalDateStr } from '../../lib/utils'

function Opt({ children, active, onClick, small }) {
  return (
    <button onMouseDown={(e) => e.preventDefault()} onClick={onClick}
      className="flex-1 flex items-center justify-center gap-1.5 select-none"
      style={{
        height: small ? 36 : 42,
        borderRadius: 12, fontSize: small ? 11 : 13, fontWeight: active ? 600 : 500,
        transition: 'all 150ms',
        background: active ? 'linear-gradient(135deg, #ff7b54, #f472b6)' : 'var(--surface-card)',
        color: active ? 'white' : 'var(--text-secondary)',
        boxShadow: active ? '0 2px 10px rgba(255,123,84,0.2)' : 'none',
        minWidth: 0,
      }}>
      {children}
    </button>
  )
}

function datePresets() {
  const today = new Date()
  const tmrw = new Date(today); tmrw.setDate(tmrw.getDate() + 1)
  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
  const sat = new Date(today); sat.setDate(sat.getDate() + ((6 - sat.getDay() + 7) % 7 || 7))
  const mon = new Date(today); mon.setDate(mon.getDate() + ((1 - mon.getDay() + 7) % 7 || 7))
  return [
    { value: toLocalDateStr(today), label: 'Today' },
    { value: toLocalDateStr(tmrw), label: 'Tmrw' },
    { value: toLocalDateStr(sat), label: dayNames[sat.getDay()] },
    { value: toLocalDateStr(mon), label: dayNames[mon.getDay()] },
  ]
}

const TIMES = [
  { label: '9am', value: '09:00', icon: '☀' },
  { label: '12pm', value: '12:00', icon: '☀' },
  { label: '3pm', value: '15:00', icon: '⛅' },
  { label: '6pm', value: '18:00', icon: '🌙' },
]

export default function ChipBar({ spaceId, listId, dueDate, dueTime, onSpaceChange, onListChange, onDueDateChange, onDueTimeChange }) {
  const spaces = useSpaceStore((s) => s.spaces)
  const lists = useListStore((s) => s.lists)
  const dateInputRef = useRef(null)
  const [showTime, setShowTime] = useState(false)
  const dates = datePresets()
  const customActive = dueDate && !dates.some((d) => d.value === dueDate)

  // Lists for the selected space
  const spaceLists = spaceId ? lists.filter((l) => l.spaceId === spaceId).sort((a, b) => a.position - b.position) : []

  const handleDateTap = (value) => {
    if (dueDate === value) { onDueDateChange(null); setShowTime(false) }
    else { onDueDateChange(value); setShowTime(true) }
  }

  const handleSpaceTap = (id) => {
    if (spaceId === id) {
      onSpaceChange(null)
      onListChange?.(null)
    } else {
      onSpaceChange(id)
      // Auto-assign if space has exactly one list
      const spLists = lists.filter((l) => l.spaceId === id)
      onListChange?.(spLists.length === 1 ? spLists[0].id : null)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* When */}
      <div style={{ display: 'flex', gap: 6 }}>
        {dates.map((d) => (
          <Opt key={d.value} active={dueDate === d.value} onClick={() => handleDateTap(d.value)}>
            {d.label}
          </Opt>
        ))}
        <Opt active={customActive} onClick={() => dateInputRef.current?.showPicker()}>
          {customActive ? new Date(dueDate + 'T00:00').toLocaleDateString('en', { month: 'short', day: 'numeric' }) : '···'}
          <input ref={dateInputRef} type="date" className="absolute opacity-0 w-0 h-0"
            value={dueDate || ''} onChange={(e) => { onDueDateChange(e.target.value || null); if (e.target.value) setShowTime(true) }} />
        </Opt>
      </div>

      {/* Time */}
      {showTime && dueDate && (
        <div style={{ display: 'flex', gap: 6 }} className="animate-slide-down">
          {TIMES.map((t) => (
            <Opt key={t.value} active={dueTime === t.value} small onClick={() => onDueTimeChange?.(dueTime === t.value ? null : t.value)}>
              <span style={{ fontSize: 10 }}>{t.icon}</span> {t.label}
            </Opt>
          ))}
        </div>
      )}

      {/* Spaces */}
      {spaces.length > 0 && (
        <div style={{ display: 'flex', gap: 6 }}>
          {spaces.map((s) => (
            <Opt key={s.id} active={spaceId === s.id} small onClick={() => handleSpaceTap(s.id)}>
              {s.name}
            </Opt>
          ))}
        </div>
      )}

      {/* Lists within selected space — only show if more than one */}
      {spaceLists.length > 1 && (
        <div style={{ display: 'flex', gap: 6 }} className="animate-slide-down">
          {spaceLists.map((l) => (
            <Opt key={l.id} active={listId === l.id} small onClick={() => onListChange?.(listId === l.id ? null : l.id)}>
              {l.name}
            </Opt>
          ))}
        </div>
      )}
    </div>
  )
}
