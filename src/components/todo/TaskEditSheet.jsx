import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useTodoStore } from '../../stores/todoStore'
import { useSpaceStore } from '../../stores/spaceStore'
import { useListStore } from '../../stores/listStore'
import { useUiStore } from '../../stores/uiStore'
import { toLocalDateStr } from '../../lib/utils'
import SpaceAvatar from '../common/SpaceAvatar'

export default function TaskEditSheet({ todo, todos: todosArr, onClose }) {
  const isMulti = !!todosArr && todosArr.length > 1
  const primaryTodo = todo || todosArr?.[0]
  const updateTodo = useTodoStore((s) => s.updateTodo)
  const deleteTodo = useTodoStore((s) => s.deleteTodo)
  const showUndo = useUiStore((s) => s.showUndo)
  const spaces = useSpaceStore((s) => s.spaces)
  const lists = useListStore((s) => s.lists)

  const [text, setText] = useState(primaryTodo.text)
  const [dueDate, setDueDate] = useState(primaryTodo.dueDate || '')
  const [dueTime, setDueTime] = useState(primaryTodo.dueTime || '')
  const [spaceId, setSpaceId] = useState(primaryTodo.spaceId)
  const [listId, setListId] = useState(primaryTodo.listId)
  const [subtasks, setSubtasks] = useState(primaryTodo.subtasks || [])
  const [newSubtask, setNewSubtask] = useState('')
  const textRef = useRef(null)
  const keepFocus = (e) => e.preventDefault() // prevent blur on button tap

  const spaceLists = spaceId ? lists.filter(l => l.spaceId === spaceId) : []

  // Auto-focus text input and place cursor at end
  useEffect(() => {
    if (textRef.current) {
      textRef.current.focus()
      const len = textRef.current.value.length
      textRef.current.setSelectionRange(len, len)
    }
  }, [])

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
    if (isMulti) {
      // Apply shared changes to all selected todos
      const updates = {}
      if (dueDate !== (primaryTodo.dueDate || '')) updates.dueDate = dueDate || null
      if (dueTime !== (primaryTodo.dueTime || '')) updates.dueTime = dueTime || null
      if (spaceId !== primaryTodo.spaceId) updates.spaceId = spaceId
      if (listId !== primaryTodo.listId) updates.listId = listId
      if (Object.keys(updates).length > 0) {
        const olds = todosArr.map(t => ({ id: t.id, dueDate: t.dueDate, dueTime: t.dueTime, spaceId: t.spaceId, listId: t.listId }))
        for (const t of todosArr) updateTodo(t.id, updates)
        showUndo(`Updated ${todosArr.length} tasks`, () => { for (const o of olds) updateTodo(o.id, o) })
      }
    } else {
      const updates = {}
      if (text.trim() !== primaryTodo.text) updates.text = text.trim()
      updates.subtasks = subtasks
      if (dueDate !== (primaryTodo.dueDate || '')) updates.dueDate = dueDate || null
      if (dueTime !== (primaryTodo.dueTime || '')) updates.dueTime = dueTime || null
      if (spaceId !== primaryTodo.spaceId) updates.spaceId = spaceId
      if (listId !== primaryTodo.listId) updates.listId = listId
      if (Object.keys(updates).length > 0) updateTodo(primaryTodo.id, updates)
    }
    onClose()
  }

  const handleDelete = () => {
    if (isMulti) {
      for (const t of todosArr) deleteTodo(t.id)
    } else {
      deleteTodo(primaryTodo.id)
    }
    onClose()
  }

  const handleMakeNote = () => {
    if (isMulti) {
      const olds = todosArr.map(t => ({ id: t.id, type: t.type }))
      for (const t of todosArr) updateTodo(t.id, { type: 'note' })
      showUndo(`${todosArr.length} → Notes`, () => { for (const o of olds) updateTodo(o.id, { type: o.type }) })
    } else {
      updateTodo(primaryTodo.id, { type: 'note' })
      showUndo('→ Note', () => updateTodo(primaryTodo.id, { type: 'task' }))
    }
    onClose()
  }

  return createPortal(
    <div className="fixed inset-0 z-50" style={{ touchAction: 'none' }}>
      {/* Backdrop */}
      <div className="absolute inset-0 animate-fade-in" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }} onClick={save} />

      {/* Card — top-aligned so keyboard sits below */}
      <div className="absolute top-0 left-0 right-0 animate-slide-down" style={{
        background: 'var(--bg-mid)', borderRadius: '0 0 24px 24px',
        padding: 'calc(env(safe-area-inset-top, 16px) + 16px) 20px 24px',
        maxHeight: '70vh', overflowY: 'auto',
        boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
      }}>
        {/* Grab handle */}
        <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--border-visible)', margin: '0 auto 16px' }} />

        {/* Task text — focused by default */}
        {isMulti ? (
          <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
            {todosArr.length} tasks selected
          </p>
        ) : (
          <input ref={textRef} value={text} onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); save() } }}
            className="w-full bg-transparent outline-none"
            style={{ fontSize: 18, fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.4, borderBottom: '1px solid var(--accent-coral)', paddingBottom: 6, marginBottom: 4 }}
            enterKeyHint="done"
          />
        )}

        {/* Date & Time */}
        <div style={{ marginTop: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-ghost)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>When</p>
          <div className="flex gap-3">
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
              onMouseDown={keepFocus}
              style={{ flex: 1, background: 'var(--surface-card)', border: 'none', borderRadius: 12, padding: '10px 14px', color: 'var(--text-primary)', fontSize: 14 }} />
            <input type="time" value={dueTime} onChange={(e) => setDueTime(e.target.value)}
              onMouseDown={keepFocus}
              style={{ width: 120, background: 'var(--surface-card)', border: 'none', borderRadius: 12, padding: '10px 14px', color: 'var(--text-primary)', fontSize: 14 }} />
          </div>
          {dueDate && (
            <button onMouseDown={keepFocus} onClick={() => { setDueDate(''); setDueTime('') }}
              style={{ marginTop: 6, fontSize: 12, color: 'var(--text-ghost)' }}>Clear date</button>
          )}
        </div>

        {/* Space */}
        {spaces.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-ghost)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Space</p>
            <div className="flex gap-2 flex-wrap">
              <button onMouseDown={keepFocus} onClick={() => { setSpaceId(null); setListId(null) }}
                style={{ padding: '8px 14px', borderRadius: 12, fontSize: 13, fontWeight: 500,
                  background: !spaceId ? 'var(--surface-active)' : 'var(--surface-card)', color: !spaceId ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                None
              </button>
              {spaces.map(s => (
                <button key={s.id} onMouseDown={keepFocus} onClick={() => { setSpaceId(s.id); setListId(null) }}
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
                <button key={l.id} onMouseDown={keepFocus} onClick={() => setListId(listId === l.id ? null : l.id)}
                  style={{ padding: '6px 12px', borderRadius: 10, fontSize: 12, fontWeight: 500,
                    background: listId === l.id ? 'var(--surface-active)' : 'var(--surface-card)',
                    color: listId === l.id ? 'var(--text-primary)' : 'var(--text-ghost)' }}>
                  {l.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Subtasks — single-task only */}
        {!isMulti && (
          <div style={{ marginTop: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-ghost)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
              Subtasks {subtasks.length > 0 && `(${subtasks.filter(s => s.done).length}/${subtasks.length})`}
            </p>

            {subtasks.map(s => (
              <div key={s.id} className="flex items-center gap-3" style={{ padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <button onMouseDown={keepFocus} onClick={() => toggleSubtask(s.id)} style={{
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
                <button onMouseDown={keepFocus} onClick={() => removeSubtask(s.id)} style={{ color: 'var(--text-ghost)', fontSize: 14, padding: '0 4px' }}>×</button>
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
        )}

        {/* Actions */}
        <div className="flex gap-3" style={{ marginTop: 24 }}>
          <button onMouseDown={keepFocus} onClick={handleMakeNote} style={{ flex: 1, padding: '12px', borderRadius: 14, fontSize: 14, fontWeight: 500, background: 'var(--surface-card)', color: 'var(--accent-sky)' }}>
            ✎ Note
          </button>
          <button onMouseDown={keepFocus} onClick={handleDelete} style={{ flex: 1, padding: '12px', borderRadius: 14, fontSize: 14, fontWeight: 500, background: 'var(--surface-card)', color: 'var(--color-danger)' }}>
            Delete{isMulti ? ` (${todosArr.length})` : ''}
          </button>
        </div>

        {/* Save */}
        <button onMouseDown={keepFocus} onClick={save} style={{
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
