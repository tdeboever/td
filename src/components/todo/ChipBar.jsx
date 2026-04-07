import { useRef } from 'react'
import { useSpaceStore } from '../../stores/spaceStore'
import { toLocalDateStr } from '../../lib/utils'

function Chip({ children, active, onClick }) {
  const handleClick = (e) => {
    e.currentTarget.style.transform = 'scale(1.08)'
    setTimeout(() => { if (e.currentTarget) e.currentTarget.style.transform = '' }, 150)
    onClick()
  }
  return (
    <button onMouseDown={(e) => e.preventDefault()} onClick={handleClick}
      className="inline-flex items-center gap-1.5 whitespace-nowrap select-none flex-shrink-0"
      style={{
        padding: '6px 14px', borderRadius: 9999, fontSize: 12, fontWeight: active ? 700 : 500,
        transition: 'all 150ms',
        background: active ? 'linear-gradient(135deg, #ff6b35, #ffaa40)' : 'transparent',
        border: active ? '1px solid transparent' : '1px solid rgba(255,255,255,0.08)',
        color: active ? '#060608' : 'var(--color-text-secondary)',
        boxShadow: active ? '0 0 12px rgba(255,107,53,0.3)' : 'none',
      }}>
      {children}
    </button>
  )
}

function datePresets() {
  const today = new Date()
  const tmrw = new Date(today); tmrw.setDate(tmrw.getDate() + 1)
  const sat = new Date(today); sat.setDate(sat.getDate() + ((6 - sat.getDay() + 7) % 7 || 7))
  const mon = new Date(today); mon.setDate(mon.getDate() + ((1 - mon.getDay() + 7) % 7 || 7))
  return [
    { value: toLocalDateStr(today), label: 'Today' },
    { value: toLocalDateStr(tmrw), label: 'Tomorrow' },
    { value: toLocalDateStr(sat), label: 'Saturday' },
    { value: toLocalDateStr(mon), label: 'Monday' },
  ]
}

export default function ChipBar({ spaceId, dueDate, onSpaceChange, onDueDateChange }) {
  const spaces = useSpaceStore((s) => s.spaces)
  const dateInputRef = useRef(null)
  const dates = datePresets()
  const customActive = dueDate && !dates.some((d) => d.value === dueDate)

  return (
    <div className="flex gap-1.5 overflow-x-auto no-scrollbar" style={{ padding: '0 4px' }}>
      {spaces.map((s) => (
        <Chip key={s.id} active={spaceId === s.id} onClick={() => onSpaceChange(spaceId === s.id ? null : s.id)}>
          {s.name}
        </Chip>
      ))}
      {spaces.length > 0 && <div style={{ width: 8, flexShrink: 0 }} />}
      {dates.map((d) => (
        <Chip key={d.value} active={dueDate === d.value} onClick={() => onDueDateChange(dueDate === d.value ? null : d.value)}>
          {d.label}
        </Chip>
      ))}
      <Chip active={customActive} onClick={() => dateInputRef.current?.showPicker()}>
        {customActive ? new Date(dueDate + 'T00:00').toLocaleDateString('en', { month: 'short', day: 'numeric' }) : 'Pick date'}
        <input ref={dateInputRef} type="date" className="absolute opacity-0 w-0 h-0" value={dueDate || ''} onChange={(e) => onDueDateChange(e.target.value || null)} />
      </Chip>
    </div>
  )
}
