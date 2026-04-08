import { useUiStore } from '../../stores/uiStore'
import { useSpaceStore } from '../../stores/spaceStore'
import { useListStore } from '../../stores/listStore'
import { useTodoStore } from '../../stores/todoStore'
import { useState } from 'react'

const SMART_VIEWS = [
  { id: 'inbox', label: 'Inbox', icon: '↓' },
  { id: 'today', label: 'Today', icon: '◉' },
  { id: 'upcoming', label: 'Upcoming', icon: '→' },
]

export default function Sidebar() {
  const { sidebarOpen, closeSidebar, setView, activeView, activeSpaceId, activeListId } = useUiStore()
  const spaces = useSpaceStore((s) => s.spaces)
  const addSpace = useSpaceStore((s) => s.addSpace)
  const lists = useListStore((s) => s.lists)
  const addList = useListStore((s) => s.addList)
  const todos = useTodoStore((s) => s.todos)
  const [newSpaceName, setNewSpaceName] = useState('')
  const [addingListForSpace, setAddingListForSpace] = useState(null)
  const [newListName, setNewListName] = useState('')
  const [newListType, setNewListType] = useState('tasks')

  const cnt = (fn) => todos.filter((t) => t.status === 'active' && fn(t)).length
  const navigate = (v, o) => { setView(v, o); closeSidebar() }
  const handleAddSpace = (e) => { e.preventDefault(); if (!newSpaceName.trim()) return; addSpace(newSpaceName.trim()); setNewSpaceName('') }
  const handleAddList = (e, sid) => { e.preventDefault(); if (!newListName.trim()) return; addList(newListName.trim(), sid, newListType); setNewListName(''); setNewListType('tasks'); setAddingListForSpace(null) }

  const smartCounts = {
    inbox: cnt((t) => !t.listId && !t.spaceId),
    today: (() => { const d = new Date().toDateString(); return cnt((t) => t.dueDate && new Date(t.dueDate).toDateString() === d) })(),
    upcoming: (() => { const n = new Date(); n.setHours(0,0,0,0); return cnt((t) => t.dueDate && new Date(t.dueDate) > n) })(),
  }

  return (
    <>
      {sidebarOpen && <div className="fixed inset-0 z-40 animate-fade-in" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }} onClick={closeSidebar} />}
      <aside className={`fixed top-0 left-0 bottom-0 z-50 flex flex-col transform transition-transform duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ width: '80%', maxWidth: 320, background: 'rgba(26,22,37,0.95)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', borderRight: '1px solid var(--border-subtle)' }}>
        <nav className="flex-1 overflow-y-auto no-scrollbar" style={{ paddingTop: 48 }}>
          <p style={{ padding: '0 20px 12px', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-secondary)' }}>Views</p>
          {SMART_VIEWS.map((v) => {
            const a = activeView === v.id
            return (
              <button key={v.id} onClick={() => navigate(v.id)} className="w-full flex items-center gap-4 text-left transition-colors"
                style={{ height: 48, padding: '0 20px', fontSize: 15, borderLeft: `3px solid ${a ? 'var(--accent-lavender)' : 'transparent'}`, color: a ? 'var(--accent-lavender)' : 'var(--text-primary)', fontWeight: a ? 600 : 400 }}>
                <span className="w-5 text-center" style={{ opacity: 0.6 }}>{v.icon}</span>
                <span className="flex-1">{v.label}</span>
                {smartCounts[v.id] > 0 && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)' }}>{smartCounts[v.id]}</span>}
              </button>
            )
          })}
          <div style={{ height: 2, margin: '20px 20px', borderRadius: 1, opacity: 0.5, background: 'linear-gradient(90deg, transparent, #ff7b54 15%, #f472b6 40%, #a78bfa 65%, #60a5fa 85%, transparent)' }} />
          <p style={{ padding: '0 20px 12px', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-secondary)' }}>Spaces</p>
          {spaces.map((space) => {
            const spaceLists = lists.filter((l) => l.spaceId === space.id).sort((a, b) => a.position - b.position)
            const a = activeView === 'space' && activeSpaceId === space.id
            const sc = cnt((t) => t.spaceId === space.id)
            return (
              <div key={space.id}>
                <button onClick={() => navigate('space', { spaceId: space.id })} className="w-full flex items-center gap-4 text-left transition-colors"
                  style={{ height: 48, padding: '0 20px', fontSize: 15, borderLeft: `3px solid ${a ? 'var(--accent-lavender)' : 'transparent'}`, color: a ? 'var(--accent-lavender)' : 'var(--text-primary)', fontWeight: a ? 600 : 400 }}>
                  <span className="w-5 text-center">{space.icon}</span>
                  <span className="flex-1">{space.name}</span>
                  {sc > 0 && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)' }}>{sc}</span>}
                </button>
                {spaceLists.map((list) => {
                  const la = activeView === 'list' && activeListId === list.id
                  const lc = cnt((t) => t.listId === list.id)
                  return (
                    <button key={list.id} onClick={() => navigate('list', { spaceId: space.id, listId: list.id })} className="w-full flex items-center text-left transition-colors"
                      style={{ height: 40, padding: '0 20px 0 52px', fontSize: 13, color: la ? 'var(--accent-lavender)' : 'var(--text-secondary)', fontWeight: la ? 500 : 400 }}>
                      <span className="flex-1">{list.name}{list.type === 'checklist' && <span style={{ marginLeft: 6, fontSize: 10, opacity: 0.4 }}>☑</span>}</span>
                      {lc > 0 && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-ghost)' }}>{lc}</span>}
                    </button>
                  )
                })}
                {addingListForSpace === space.id ? (
                  <form onSubmit={(e) => handleAddList(e, space.id)} style={{ padding: '4px 20px 4px 52px' }}>
                    <input autoFocus value={newListName} onChange={(e) => setNewListName(e.target.value)}
                      onBlur={() => { if (!newListName.trim()) setAddingListForSpace(null) }}
                      placeholder="List name…" className="w-full bg-transparent outline-none"
                      style={{ fontSize: 13, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 4 }} />
                    <div className="flex gap-3 mt-2">
                      <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => setNewListType('tasks')} style={{ fontSize: 11, color: newListType === 'tasks' ? 'var(--accent-lavender)' : 'var(--text-ghost)' }}>Tasks</button>
                      <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => setNewListType('checklist')} style={{ fontSize: 11, color: newListType === 'checklist' ? 'var(--accent-lavender)' : 'var(--text-ghost)' }}>Checklist</button>
                    </div>
                  </form>
                ) : (
                  <button onClick={() => setAddingListForSpace(space.id)} className="w-full text-left transition-colors" style={{ padding: '6px 20px 6px 52px', fontSize: 12, color: 'var(--text-ghost)' }}>
                    <span style={{ color: 'var(--accent-coral)' }}>+</span> Add list
                  </button>
                )}
              </div>
            )
          })}
          <form onSubmit={handleAddSpace} style={{ padding: '16px 20px' }}>
            <input value={newSpaceName} onChange={(e) => setNewSpaceName(e.target.value)}
              placeholder="+ New space" className="w-full bg-transparent outline-none transition-colors"
              style={{ fontSize: 14, color: 'var(--text-ghost)', padding: '8px 0' }} />
          </form>
        </nav>
      </aside>
    </>
  )
}
