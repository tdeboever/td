import { useState, useRef, useMemo } from 'react'
import { useTodoStore } from '../../stores/todoStore'
import { useSpaceStore } from '../../stores/spaceStore'
import { useListStore } from '../../stores/listStore'
import { useUiStore } from '../../stores/uiStore'

export default function SearchBar({ onClose }) {
  const [query, setQuery] = useState('')
  const inputRef = useRef(null)
  const todos = useTodoStore((s) => s.todos)
  const spaces = useSpaceStore((s) => s.spaces)
  const lists = useListStore((s) => s.lists)
  const setView = useUiStore((s) => s.setView)

  const handleTap = (todo) => {
    if (todo.listId) {
      setView('list', { spaceId: todo.spaceId, listId: todo.listId })
    } else if (todo.spaceId) {
      useUiStore.setState({ activeSpaceId: todo.spaceId, activeListId: null })
    }
    onClose()
  }

  const results = useMemo(() => {
    if (!query.trim() || query.length < 2) return []
    const q = query.toLowerCase()
    return todos
      .filter((t) => t.text.toLowerCase().includes(q))
      .slice(0, 12)
  }, [query, todos])

  return (
    <div className="fixed inset-0 z-50" style={{ background: 'rgba(26,22,37,0.95)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
      <div style={{ padding: '48px 20px 0', maxWidth: 480, margin: '0 auto' }}>
        {/* Search input */}
        <div className="flex items-center gap-3" style={{
          background: 'var(--bg-raised)', borderRadius: 16, padding: '14px 16px',
          boxShadow: '0 0 0 1px var(--border-visible)',
        }}>
          <span style={{ fontSize: 16, color: 'var(--text-secondary)' }}>⌕</span>
          <input
            ref={inputRef}
            autoFocus
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks..."
            autoComplete="off"
            className="flex-1 bg-transparent"
            style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)', outline: 'none', border: 'none', boxShadow: 'none' }}
          />
          <button onClick={onClose} style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>Cancel</button>
        </div>

        {/* Results */}
        <div style={{ marginTop: 16 }}>
          {query.length >= 2 && results.length === 0 && (
            <p style={{ textAlign: 'center', color: 'var(--text-ghost)', fontSize: 14, marginTop: 40 }}>No tasks found</p>
          )}
          {results.map((todo) => {
            const space = todo.spaceId ? spaces.find(s => s.id === todo.spaceId) : null
            const list = todo.listId ? lists.find(l => l.id === todo.listId) : null
            const loc = [space?.name, list?.name].filter(Boolean).join(' › ')
            return (
              <button key={todo.id} onClick={() => handleTap(todo)} className="w-full text-left" style={{
                padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)',
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <span style={{
                  width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                  background: todo.status === 'done' ? 'linear-gradient(135deg, var(--accent-rose), var(--accent-coral))' : (space?.color || 'var(--border-visible)'),
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontSize: 14, fontWeight: 500, color: todo.status === 'done' ? 'var(--text-done)' : 'var(--text-primary)',
                    textDecoration: todo.status === 'done' ? 'line-through' : 'none',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{todo.text}</p>
                  {loc && <p style={{ fontSize: 11, color: 'var(--text-ghost)', marginTop: 2 }}>{loc}</p>}
                </div>
                <span style={{ fontSize: 14, color: 'var(--text-ghost)' }}>›</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
