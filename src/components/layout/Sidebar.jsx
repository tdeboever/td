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
  const navigate = (view, opts) => { setView(view, opts); closeSidebar() }
  const handleAddSpace = (e) => { e.preventDefault(); if (!newSpaceName.trim()) return; addSpace(newSpaceName.trim()); setNewSpaceName('') }
  const handleAddList = (e, sid) => { e.preventDefault(); if (!newListName.trim()) return; addList(newListName.trim(), sid, newListType); setNewListName(''); setNewListType('tasks'); setAddingListForSpace(null) }

  const smartCounts = {
    inbox: cnt((t) => !t.listId && !t.spaceId),
    today: (() => { const d = new Date().toDateString(); return cnt((t) => t.dueDate && new Date(t.dueDate).toDateString() === d) })(),
    upcoming: (() => { const n = new Date(); n.setHours(0,0,0,0); return cnt((t) => t.dueDate && new Date(t.dueDate) > n) })(),
  }

  return (
    <>
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 animate-fade-in" style={{ backdropFilter: 'blur(8px)' }} onClick={closeSidebar} />
      )}

      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 bg-surface
          transform transition-transform duration-[350ms] ease-[cubic-bezier(0.16,1,0.3,1)]
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          flex flex-col border-r border-border`}
        style={{ width: '80%', maxWidth: 320 }}
      >
        <nav className="flex-1 overflow-y-auto no-scrollbar" style={{ paddingTop: 48 }}>
          {/* Smart Views */}
          <p className="text-[12px] font-medium text-text-dim uppercase"
            style={{ padding: '0 20px 12px', letterSpacing: '0.12em' }}>
            Views
          </p>
          {SMART_VIEWS.map((v) => {
            const isActive = activeView === v.id
            const count = smartCounts[v.id]
            return (
              <button key={v.id} onClick={() => navigate(v.id)}
                className={`w-full flex items-center gap-4 text-[15px] text-left transition-colors
                  ${isActive ? 'text-accent font-semibold' : 'text-text hover:bg-surface-hover'}`}
                style={{ height: 48, padding: '0 20px', borderLeft: isActive ? '3px solid var(--color-accent)' : '3px solid transparent' }}
              >
                <span className="w-5 text-center opacity-60">{v.icon}</span>
                <span className="flex-1">{v.label}</span>
                {count > 0 && <span className="text-[12px] text-text-dim tabular-nums">{count}</span>}
              </button>
            )
          })}

          {/* Divider */}
          <div style={{ height: 1, margin: '20px 20px', background: 'linear-gradient(to right, var(--color-accent), transparent)' }} />

          {/* Spaces */}
          <p className="text-[12px] font-medium text-text-dim uppercase"
            style={{ padding: '0 20px 12px', letterSpacing: '0.12em' }}>
            Spaces
          </p>

          {spaces.map((space) => {
            const spaceLists = lists.filter((l) => l.spaceId === space.id).sort((a, b) => a.position - b.position)
            const isActive = activeView === 'space' && activeSpaceId === space.id
            const sc = cnt((t) => t.spaceId === space.id)
            return (
              <div key={space.id}>
                <button onClick={() => navigate('space', { spaceId: space.id })}
                  className={`w-full flex items-center gap-4 text-[15px] text-left transition-colors
                    ${isActive ? 'text-accent font-semibold' : 'text-text hover:bg-surface-hover'}`}
                  style={{ height: 48, padding: '0 20px', borderLeft: isActive ? '3px solid var(--color-accent)' : '3px solid transparent' }}
                >
                  <span className="w-5 text-center">{space.icon}</span>
                  <span className="flex-1">{space.name}</span>
                  {sc > 0 && <span className="text-[12px] text-text-dim tabular-nums">{sc}</span>}
                </button>

                {spaceLists.map((list) => {
                  const la = activeView === 'list' && activeListId === list.id
                  const lc = cnt((t) => t.listId === list.id)
                  return (
                    <button key={list.id} onClick={() => navigate('list', { spaceId: space.id, listId: list.id })}
                      className={`w-full flex items-center text-[13px] text-left transition-colors
                        ${la ? 'text-accent font-medium' : 'text-text-dim hover:text-text hover:bg-surface-hover'}`}
                      style={{ height: 40, padding: '0 20px 0 52px' }}
                    >
                      <span className="flex-1">
                        {list.name}
                        {list.type === 'checklist' && <span className="ml-1.5 text-[10px] opacity-40">☑</span>}
                      </span>
                      {lc > 0 && <span className="text-[12px] text-text-dim tabular-nums">{lc}</span>}
                    </button>
                  )
                })}

                {addingListForSpace === space.id ? (
                  <form onSubmit={(e) => handleAddList(e, space.id)} style={{ padding: '4px 20px 4px 52px' }}>
                    <input autoFocus value={newListName} onChange={(e) => setNewListName(e.target.value)}
                      onBlur={() => { if (!newListName.trim()) setAddingListForSpace(null) }}
                      placeholder="List name…"
                      className="w-full bg-transparent text-[13px] text-text placeholder:text-text-dim outline-none border-b border-border"
                      style={{ paddingBottom: 4 }} />
                    <div className="flex gap-3 mt-2">
                      <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => setNewListType('tasks')}
                        className={`text-[11px] transition-colors ${newListType === 'tasks' ? 'text-accent' : 'text-text-dim'}`}>Tasks</button>
                      <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => setNewListType('checklist')}
                        className={`text-[11px] transition-colors ${newListType === 'checklist' ? 'text-accent' : 'text-text-dim'}`}>Checklist</button>
                    </div>
                  </form>
                ) : (
                  <button onClick={() => setAddingListForSpace(space.id)}
                    className="w-full text-left text-[12px] text-text-dim hover:text-accent transition-colors"
                    style={{ padding: '6px 20px 6px 52px' }}>
                    + Add list
                  </button>
                )}
              </div>
            )
          })}

          {/* Add space */}
          <form onSubmit={handleAddSpace} style={{ padding: '16px 20px' }}>
            <input value={newSpaceName} onChange={(e) => setNewSpaceName(e.target.value)}
              placeholder="+ New space"
              className="w-full bg-transparent text-[14px] text-text-dim placeholder:text-text-dim outline-none hover:text-accent focus:text-accent transition-colors"
              style={{ padding: '8px 0' }} />
          </form>
        </nav>
      </aside>
    </>
  )
}
