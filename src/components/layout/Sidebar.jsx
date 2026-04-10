import { useUiStore } from '../../stores/uiStore'
import { useSpaceStore } from '../../stores/spaceStore'
import { useListStore } from '../../stores/listStore'
import { useTodoStore } from '../../stores/todoStore'
import { useAuth } from '../../hooks/useAuth'
import { useSwipe } from '../../hooks/useSwipe'
import SpaceAvatar from '../common/SpaceAvatar'
import { useState } from 'react'

const SMART_VIEWS = [
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

  const swipeHandlers = useSwipe({ onSwipeRight: closeSidebar })
  const deleteSpace = useSpaceStore((s) => s.deleteSpace)
  const deleteList = useListStore((s) => s.deleteList)
  const { user, signOut } = useAuth()
  const updateSpace = useSpaceStore((s) => s.updateSpace)
  const [renamingSpace, setRenamingSpace] = useState(null)
  const [renameText, setRenameText] = useState('')
  const cnt = (fn) => todos.filter((t) => t.status === 'active' && fn(t)).length
  const navigate = (v, o) => { setView(v, o); closeSidebar() }
  const selectSpace = (id) => { useUiStore.setState({ activeSpaceId: id, activeListId: null }); closeSidebar() }
  const handleAddSpace = (e) => { e.preventDefault(); if (!newSpaceName.trim()) return; addSpace(newSpaceName.trim()); setNewSpaceName('') }
  const handleAddList = (e, sid) => { e.preventDefault(); if (!newListName.trim()) return; addList(newListName.trim(), sid, newListType); setNewListName(''); setNewListType('tasks'); setAddingListForSpace(null) }

  const smartCounts = {
    today: cnt((t) => !t.dueDate || new Date(t.dueDate).toDateString() === new Date().toDateString()),
    upcoming: (() => { const n = new Date(); n.setHours(0,0,0,0); return cnt((t) => t.dueDate && new Date(t.dueDate) > n) })(),
  }

  return (
    <>
      {sidebarOpen && <div className="fixed inset-0 z-40 animate-fade-in" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }} onClick={closeSidebar} />}
      <aside {...swipeHandlers} className={`fixed top-0 left-0 bottom-0 z-50 flex flex-col transform transition-transform duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ width: '80%', maxWidth: 320, background: 'rgba(26,22,37,0.95)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', borderRight: '1px solid var(--border-subtle)' }}>
        <nav className="flex-1 overflow-y-auto no-scrollbar" style={{ paddingTop: 48 }}>
          <p style={{ padding: '0 20px 16px', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>Spaces</p>
          {spaces.map((space) => {
            const spaceLists = lists.filter((l) => l.spaceId === space.id).sort((a, b) => a.position - b.position)
            const a = activeView === 'space' && activeSpaceId === space.id
            const sc = cnt((t) => t.spaceId === space.id)
            return (
              <div key={space.id}>
                <div className="flex items-center" style={{ height: 48, borderLeft: `3px solid ${a ? 'var(--accent-lavender)' : 'transparent'}` }}>
                  {renamingSpace === space.id ? (
                    <form onSubmit={(e) => { e.preventDefault(); if (renameText.trim()) { updateSpace(space.id, { name: renameText.trim() }); setRenamingSpace(null) } }}
                      style={{ flex: 1, padding: '0 20px', display: 'flex', alignItems: 'center', gap: 12, height: '100%' }}>
                      <SpaceAvatar space={{ ...space, name: renameText || space.name }} size={24} />
                      <input autoFocus value={renameText} onChange={(e) => setRenameText(e.target.value)}
                        onBlur={() => { if (renameText.trim()) updateSpace(space.id, { name: renameText.trim() }); setRenamingSpace(null) }}
                        className="flex-1 bg-transparent outline-none" style={{ fontSize: 15, color: 'var(--text-primary)' }} />
                    </form>
                  ) : (
                    <button onClick={() => selectSpace(space.id)}
                      onDoubleClick={() => { setRenamingSpace(space.id); setRenameText(space.name) }}
                      className="flex-1 flex items-center gap-4 text-left transition-colors"
                      style={{ padding: '0 0 0 20px', fontSize: 15, color: a ? 'var(--accent-lavender)' : 'var(--text-primary)', fontWeight: a ? 600 : 400, height: '100%' }}>
                      <SpaceAvatar space={space} size={24} />
                      <span className="flex-1">{space.name}</span>
                      {sc > 0 && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)' }}>{sc}</span>}
                    </button>
                  )}
                  <button onClick={() => { if (confirm(`Delete "${space.name}"?`)) { deleteSpace(space.id); if (a) { useUiStore.setState({ activeSpaceId: null }); closeSidebar() } } }}
                    style={{ padding: '0 20px', color: 'var(--text-ghost)', fontSize: 14, height: '100%' }}>×</button>
                </div>
                {spaceLists.map((list) => {
                  const la = activeView === 'list' && activeListId === list.id
                  const lc = cnt((t) => t.listId === list.id)
                  return (
                    <div key={list.id} className="flex items-center" style={{ height: 40 }}>
                      <button onClick={() => navigate('list', { spaceId: space.id, listId: list.id })} className="flex-1 flex items-center text-left transition-colors"
                        style={{ padding: '0 0 0 52px', fontSize: 13, color: la ? 'var(--accent-lavender)' : 'var(--text-secondary)', fontWeight: la ? 500 : 400, height: '100%' }}>
                        <span className="flex-1">{list.name}{list.type === 'checklist' && <span style={{ marginLeft: 6, fontSize: 10, opacity: 0.4 }}>☑</span>}</span>
                        {lc > 0 && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-ghost)' }}>{lc}</span>}
                      </button>
                      <button onClick={() => { if (confirm(`Delete "${list.name}"?`)) { deleteList(list.id); if (la) navigate('space', { spaceId: space.id }) } }}
                        style={{ padding: '0 20px', color: 'var(--text-ghost)', fontSize: 12, height: '100%' }}>×</button>
                    </div>
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

        {/* Sign out — fixed at bottom */}
        {user && (
          <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-ghost)', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.email}
            </div>
            <button onClick={signOut} style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Sign out</button>
          </div>
        )}
      </aside>
    </>
  )
}
