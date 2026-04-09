import { useState } from 'react'
import { useTodoStore } from '../../stores/todoStore'
import { useUiStore } from '../../stores/uiStore'
import EmptyState from '../common/EmptyState'

const TINTS = [
  'rgba(255,123,84,0.06)',   // coral
  'rgba(244,114,182,0.06)',  // rose
  'rgba(96,165,250,0.06)',   // sky
  'rgba(74,222,128,0.06)',   // mint
  'rgba(251,191,36,0.06)',   // amber
  'rgba(167,139,250,0.06)',  // lavender
]

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en', { month: 'short', day: 'numeric' })
}

export default function NotesList({ notes }) {
  const [expandedId, setExpandedId] = useState(null)
  const updateTodo = useTodoStore((s) => s.updateTodo)
  const deleteTodo = useTodoStore((s) => s.deleteTodo)
  const showUndo = useUiStore((s) => s.showUndo)
  const [editText, setEditText] = useState('')

  if (notes.length === 0) {
    return <EmptyState title="No notes yet" subtitle="Tap ✎ to capture a thought" />
  }

  // Full-screen note viewer
  if (expandedId) {
    const note = notes.find((n) => n.id === expandedId)
    if (!note) { setExpandedId(null); return null }

    return (
      <div className="animate-fade-in" style={{ padding: '20px', minHeight: '50vh' }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
          <button onClick={() => setExpandedId(null)} style={{ fontSize: 14, color: 'var(--text-secondary)' }}>← Back</button>
          <div className="flex gap-4">
            <button onClick={() => {
              updateTodo(note.id, { type: 'task' })
              setExpandedId(null)
              showUndo('Moved to tasks', () => updateTodo(note.id, { type: 'note' }))
            }} style={{ fontSize: 13, color: 'var(--accent-coral)' }}>Make task</button>
            <button onClick={() => {
              deleteTodo(note.id)
              setExpandedId(null)
            }} style={{ fontSize: 13, color: 'var(--color-danger)', opacity: 0.6 }}>Delete</button>
          </div>
        </div>
        <textarea
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onBlur={() => { if (editText.trim() && editText !== note.text) updateTodo(note.id, { text: editText.trim() }) }}
          className="w-full bg-transparent outline-none resize-none"
          style={{
            fontSize: 16, fontWeight: 400, lineHeight: 1.6, color: 'var(--text-primary)',
            minHeight: 200, border: 'none',
          }}
        />
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-ghost)', marginTop: 16 }}>
          {timeAgo(note.createdAt)}
        </p>
      </div>
    )
  }

  return (
    <div style={{ padding: '8px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      {notes.map((note, i) => (
        <button
          key={note.id}
          onClick={() => { setExpandedId(note.id); setEditText(note.text) }}
          className="text-left animate-task-enter"
          style={{
            animationDelay: `${i * 50}ms`,
            padding: '16px 18px',
            borderRadius: 16,
            background: TINTS[i % TINTS.length],
            boxShadow: '0 0 0 1px var(--border-subtle)',
            transition: 'all 200ms',
          }}
        >
          <p style={{
            fontSize: 14, fontWeight: 400, lineHeight: 1.5, color: 'var(--text-primary)',
            display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {note.text}
          </p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-ghost)', marginTop: 8 }}>
            {timeAgo(note.createdAt)}
          </p>
        </button>
      ))}
    </div>
  )
}
