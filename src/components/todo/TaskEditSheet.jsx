import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useTodoStore } from '../../stores/todoStore'
import { useSpaceStore } from '../../stores/spaceStore'
import { useListStore } from '../../stores/listStore'
import { useUiStore } from '../../stores/uiStore'
import { toLocalDateStr } from '../../lib/utils'
import SpaceAvatar from '../common/SpaceAvatar'

export default function TaskEditSheet({ todo, onClose }) {
  const updateTodo = useTodoStore((s) => s.updateTodo)
  const deleteTodo = useTodoStore((s) => s.deleteTodo)
  const showUndo = useUiStore((s) => s.showUndo)
  const spaces = useSpaceStore((s) => s.spaces)
  const lists = useListStore((s) => s.lists)

  const [text, setText] = useState(todo.text)
  const [dueDate, setDueDate] = useState(todo.dueDate || '')
  const [dueTime, setDueTime] = useState(todo.dueTime || '')
  const [spaceId, setSpaceId] = useState(todo.spaceId)
  const [listId, setListId] = useState(todo.listId)
  const [subtasks, setSubtasks] = useState(todo.subtasks || [])
  const [newSubtask, setNewSubtask] = useState('')

  const spaceLists = spaceId ? lists.filter(l => l.spaceId === spaceId) : []

  const addSubtask = () => {
    if (!newSubtask.trim()) return
    setSubtasks([...subtasks, { id: Date.now().toString(36), text: newSubtask.trim(), done: false }])
    setNewSubtask('')
  }

  const toggleSubtask = (id) => {
    setSubtasks(subtasks.map(s => s.id === id ? { ...s, done: !s.done } : s))
  }

  const removeSubtask = (id) => {
    setSubtasks(subtasks.filter(s => s.id !== id))
  }

  const save = () => {
    const updates = {}
    if (text.trim() !== todo.text) updates.text = text.trim()
    updates.subtasks = subtasks
    if (dueDate !== (todo.dueDate || '')) updates.dueDate = dueDate || null
    if (dueTime !== (todo.dueTime || '')) updates.dueTime = dueTime || null
    if (spaceId !== todo.spaceId) updates.spaceId = spaceId
    if (listId !== todo.listId) updates.listId = listId
    if (Object.keys(updates).length > 0) updateTodo(todo.id, updates)
    onClose()
  }

  const handleDelete = () => {
    deleteTodo(todo.id)
    onClose()
  }

  const handleMakeNote = () => {
    updateTodo(todo.id, { type: 'note' })
    showUndo('→ Note', () => updateTodo(todo.id, { type: 'task' }))
    onClose()
  }

  return createPortal(
    <div className="fixed inset-0 z-50" style={{ touchAction: 'none' }}>
      {/* Backdrop */}
      <div className="absolute inset-0 animate-fade-in" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }} onClick={save} />

      {/* Sheet */}
      <div className="absolute bottom-0 left-0 right-0 animate-slide-up" style={{
        background: 'var(--bg-mid)', borderRadius: '24px 24px 0 0',
        padding: '24px 20px 40px', maxHeight: '80vh', overflowY: 'auto',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.3)',
      }}>
        {/* Grab handle */}
        <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--border-visible)', margin: '0 auto 20px' }} />

        {/* Task text */}
        <textarea value={text} onChange={(e) => setText(e.target.value)}
          className="w-full bg-transparent outline-none resize-none"
          style={{ fontSize: 18, fontWeight: 500, color: 'var(--text-primary)', minHeight: 60, lineHeight: 1.4 }}
          autoFocus
        />

        {/* Date & Time */}
        <div style={{ marginTop: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-ghost)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>When</p>
          <div className="flex gap-3">
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
              style={{ flex: 1, background: 'var(--surface-card)', border: 'none', borderRadius: 12, padding: '10px 14px', color: 'var(--text-primary)', fontSize: 14 }} />
            <input type="time" value={dueTime} onChange={(e) => setDueTime(e.target.value)}
              style={{ width: 120, background: 'var(--surface-card)', border: 'none', borderRadius: 12, padding: '10px 14px', color: 'var(--text-primary)', fontSize: 14 }} />
          </div>
        </div>

        {/* Space */}
        {spaces.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-ghost)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Space</p>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => { setSpaceId(null); setListId(null) }}
                style={{ padding: '8px 14px', borderRadius: 12, fontSize: 13, fontWeight: 500,
                  background: !spaceId ? 'var(--surface-active)' : 'var(--surface-card)', color: !spaceId ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                None
              </button>
              {spaces.map(s => (
                <button key={s.id} onClick={() => { setSpaceId(s.id); setListId(null) }}
                  className="flex items-center gap-2"
                  style={{ padding: '8px 14px', borderRadius: 12, fontSize: 13, fontWeight: 500,
                    background: spaceId === s.id ? s.color : 'var(--surface-card)',
                    color: spaceId === s.id ? 'white' : 'var(--text-secondary)' }}>
                  <SpaceAvatar space={s} size={18} /> {s.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Lists */}
        {spaceLists.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div className="flex gap-2 flex-wrap">
              {spaceLists.map(l => (
                <button key={l.id} onClick={() => setListId(listId === l.id ? null : l.id)}
                  style={{ padding: '6px 12px', borderRadius: 10, fontSize: 12, fontWeight: 500,
                    background: listId === l.id ? 'var(--surface-active)' : 'var(--surface-card)',
                    color: listId === l.id ? 'var(--text-primary)' : 'var(--text-ghost)' }}>
                  {l.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Subtasks */}
        <div style={{ marginTop: 20 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-ghost)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
            Subtasks {subtasks.length > 0 && `(${subtasks.filter(s => s.done).length}/${subtasks.length})`}
          </p>

          {subtasks.map(s => (
            <div key={s.id} className="flex items-center gap-3" style={{ padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <button onClick={() => toggleSubtask(s.id)} style={{
                width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                border: s.done ? '2px solid transparent' : '2px solid var(--border-visible)',
                background: s.done ? 'linear-gradient(135deg, var(--accent-rose), var(--accent-coral))' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {s.done && <svg width="8" height="8" viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M2 5.5l2 2L8 3" /></svg>}
              </button>
              <span style={{
                flex: 1, fontSize: 14, color: s.done ? 'var(--text-done)' : 'var(--text-primary)',
                textDecoration: s.done ? 'line-through' : 'none',
              }}>{s.text}</span>
              <button onClick={() => removeSubtask(s.id)} style={{ color: 'var(--text-ghost)', fontSize: 14, padding: '0 4px' }}>×</button>
            </div>
          ))}

          <form onSubmit={(e) => { e.preventDefault(); addSubtask() }} className="flex items-center gap-3" style={{ marginTop: 8 }}>
            <span style={{ color: 'var(--accent-coral)', fontSize: 14 }}>+</span>
            <input value={newSubtask} onChange={(e) => setNewSubtask(e.target.value)}
              placeholder="Add subtask..."
              className="flex-1 bg-transparent outline-none"
              style={{ fontSize: 14, color: 'var(--text-primary)', border: 'none' }} />
          </form>
        </div>

        {/* Actions */}
        <div className="flex gap-3" style={{ marginTop: 24 }}>
          <button onClick={handleMakeNote} style={{ flex: 1, padding: '12px', borderRadius: 14, fontSize: 14, fontWeight: 500, background: 'var(--surface-card)', color: 'var(--accent-sky)' }}>
            ✎ Note
          </button>
          <button onClick={handleDelete} style={{ flex: 1, padding: '12px', borderRadius: 14, fontSize: 14, fontWeight: 500, background: 'var(--surface-card)', color: 'var(--color-danger)' }}>
            Delete
          </button>
        </div>

        {/* Save */}
        <button onClick={save} style={{
          width: '100%', marginTop: 12, padding: '14px', borderRadius: 14, fontSize: 15, fontWeight: 600,
          background: 'linear-gradient(135deg, var(--accent-coral), var(--accent-rose))',
          color: 'white', boxShadow: '0 2px 12px rgba(255,123,84,0.25)',
        }}>
          Save
        </button>
      </div>
    </div>,
    document.body
  )
}
