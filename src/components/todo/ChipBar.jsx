import { useState, useRef } from 'react'
import { useSpaceStore } from '../../stores/spaceStore'
import { useListStore } from '../../stores/listStore'
import { useTodoStore } from '../../stores/todoStore'
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

  // Build smart day suggestions: skip days already covered by Today/Tmrw
  const presets = [
    { value: toLocalDateStr(today), label: 'Today' },
    { value: toLocalDateStr(tmrw), label: 'Tmrw' },
  ]

  // Add next useful days (start from day after tomorrow, pick 2 meaningful ones)
  const used = new Set([toLocalDateStr(today), toLocalDateStr(tmrw)])
  const candidates = []

  // Next Saturday (if not today/tmrw)
  const sat = new Date(today); sat.setDate(sat.getDate() + ((6 - sat.getDay() + 7) % 7 || 7))
  if (!used.has(toLocalDateStr(sat))) candidates.push({ date: sat, label: dayNames[sat.getDay()] })

  // Next Monday (if not today/tmrw)
  const mon = new Date(today); mon.setDate(mon.getDate() + ((1 - mon.getDay() + 7) % 7 || 7))
  if (!used.has(toLocalDateStr(mon))) candidates.push({ date: mon, label: dayNames[mon.getDay()] })

  // If we don't have 2 candidates yet, fill with next sequential days
  if (candidates.length < 2) {
    for (let i = 2; i <= 7 && candidates.length < 2; i++) {
      const d = new Date(today); d.setDate(d.getDate() + i)
      const ds = toLocalDateStr(d)
      if (!used.has(ds) && !candidates.some(c => toLocalDateStr(c.date) === ds)) {
        candidates.push({ date: d, label: dayNames[d.getDay()] })
      }
    }
  }

  // Sort by date and take first 2
  candidates.sort((a, b) => a.date - b.date)
  for (const c of candidates.slice(0, 2)) {
    presets.push({ value: toLocalDateStr(c.date), label: c.label })
  }

  return presets
}

const TIMES = [
  { label: '9am', value: '09:00', icon: '☀' },
  { label: '12pm', value: '12:00', icon: '☀' },
  { label: '3pm', value: '15:00', icon: '⛅' },
  { label: '6pm', value: '18:00', icon: '🌙' },
]

function nextFreeTime(baseTime, date, todos) {
  if (!date) return baseTime
  const taken = new Set(todos.filter(t => t.status === 'active' && t.dueDate === date).map(t => t.dueTime).filter(Boolean))
  let [h, m] = baseTime.split(':').map(Number)
  while (taken.has(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`)) {
    m += 15; if (m >= 60) { h++; m = 0 }; if (h > 23) return baseTime
  }
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`
}

function formatTimeLabel(timeStr) {
  const [h, m] = timeStr.split(':').map(Number)
  const suffix = h >= 12 ? 'pm' : 'am'
  const h12 = h % 12 || 12
  return m === 0 ? `${h12}${suffix}` : `${h12}:${String(m).padStart(2,'0')}${suffix}`
}

export default function ChipBar({ spaceId, listId, dueDate, dueTime, onSpaceChange, onListChange, onDueDateChange, onDueTimeChange }) {
  const spaces = useSpaceStore((s) => s.spaces)
  const lists = useListStore((s) => s.lists)
  const todos = useTodoStore((s) => s.todos)
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
      onListChange?.(null)
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

      {/* Time — smart: bumps by 15min if slot is taken */}
      {showTime && dueDate && (
        <div style={{ display: 'flex', gap: 6 }} className="animate-slide-down">
          {TIMES.map((t) => {
            const smart = nextFreeTime(t.value, dueDate, todos)
            return (
              <Opt key={t.value} active={dueTime === smart} small onClick={() => onDueTimeChange?.(dueTime === smart ? null : smart)}>
                <span style={{ fontSize: 10 }}>{t.icon}</span> {formatTimeLabel(smart)}
              </Opt>
            )
          })}
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

      {/* Lists within selected space */}
      {spaceLists.length > 0 && (
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
