import { useSpaceStore } from '../../stores/spaceStore'
import Chip from '../common/Chip'

const PRIORITIES = [
  { value: 1, label: '● Urgent', color: 'var(--color-urgent)' },
  { value: 2, label: '↑ High', color: 'var(--color-high)' },
  { value: 3, label: '— Normal', color: 'var(--color-normal)' },
]

const DATE_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: 'tomorrow', label: 'Tomorrow' },
  { value: 'none', label: 'No date' },
]

export default function ChipBar({ spaceId, priority, dueDate, onSpaceChange, onPriorityChange, onDueDateChange }) {
  const spaces = useSpaceStore((s) => s.spaces)

  const getDateValue = () => {
    if (!dueDate) return 'none'
    const d = new Date(dueDate)
    const today = new Date()
    if (d.toDateString() === today.toDateString()) return 'today'
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    if (d.toDateString() === tomorrow.toDateString()) return 'tomorrow'
    return null
  }

  const handleDateChip = (value) => {
    const current = getDateValue()
    if (current === value) {
      onDueDateChange(null)
      return
    }
    if (value === 'today') {
      onDueDateChange(new Date().toISOString().split('T')[0])
    } else if (value === 'tomorrow') {
      const d = new Date()
      d.setDate(d.getDate() + 1)
      onDueDateChange(d.toISOString().split('T')[0])
    } else {
      onDueDateChange(null)
    }
  }

  const dateValue = getDateValue()

  return (
    <div className="flex flex-col gap-2 px-4 py-2">
      {/* Space chips */}
      {spaces.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {spaces.map((s) => (
            <Chip
              key={s.id}
              label={`${s.icon} ${s.name}`}
              active={spaceId === s.id}
              onClick={() => onSpaceChange(spaceId === s.id ? null : s.id)}
            />
          ))}
        </div>
      )}

      {/* Priority + Date chips */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
        {PRIORITIES.map((p) => (
          <Chip
            key={p.value}
            label={p.label}
            active={priority === p.value}
            color={priority === p.value ? p.color : undefined}
            onClick={() => onPriorityChange(priority === p.value ? 0 : p.value)}
          />
        ))}
        <div className="w-px bg-border mx-1" />
        {DATE_OPTIONS.map((d) => (
          <Chip
            key={d.value}
            label={d.label}
            active={dateValue === d.value}
            onClick={() => handleDateChip(d.value)}
          />
        ))}
      </div>
    </div>
  )
}
