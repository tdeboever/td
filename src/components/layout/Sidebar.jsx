import { useUiStore } from '../../stores/uiStore'
import { useSpaceStore } from '../../stores/spaceStore'
import { useListStore } from '../../stores/listStore'
import { useState } from 'react'

const SMART_VIEWS = [
  { id: 'inbox', label: 'Inbox', icon: '📥' },
  { id: 'today', label: 'Today', icon: '📅' },
  { id: 'upcoming', label: 'Upcoming', icon: '🗓️' },
]

export default function Sidebar() {
  const { sidebarOpen, closeSidebar, setView, activeView, activeSpaceId, activeListId } = useUiStore()
  const spaces = useSpaceStore((s) => s.spaces)
  const addSpace = useSpaceStore((s) => s.addSpace)
  const lists = useListStore((s) => s.lists)
  const addList = useListStore((s) => s.addList)

  const [newSpaceName, setNewSpaceName] = useState('')
  const [addingListForSpace, setAddingListForSpace] = useState(null)
  const [newListName, setNewListName] = useState('')

  const handleAddSpace = (e) => {
    e.preventDefault()
    if (!newSpaceName.trim()) return
    addSpace(newSpaceName.trim())
    setNewSpaceName('')
  }

  const handleAddList = (e, spaceId) => {
    e.preventDefault()
    if (!newListName.trim()) return
    addList(newListName.trim(), spaceId)
    setNewListName('')
    setAddingListForSpace(null)
  }

  const navigate = (view, opts) => {
    setView(view, opts)
    closeSidebar()
  }

  return (
    <>
      {/* Backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40" onClick={closeSidebar} />
      )}

      {/* Panel */}
      <aside
        className={`
          fixed top-0 left-0 bottom-0 w-72 bg-surface z-50
          transform transition-transform duration-200 ease-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          flex flex-col safe-top
        `}
      >
        <div className="px-4 py-4 border-b border-border">
          <h2 className="font-display text-lg font-bold">Focus</h2>
        </div>

        <nav className="flex-1 overflow-y-auto no-scrollbar py-2">
          {/* Smart Views */}
          <div className="px-2 mb-4">
            {SMART_VIEWS.map((v) => (
              <button
                key={v.id}
                onClick={() => navigate(v.id)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left
                  ${activeView === v.id
                    ? 'bg-accent/10 text-accent'
                    : 'text-text-dim hover:bg-surface-hover'
                  }
                `}
              >
                <span>{v.icon}</span>
                <span>{v.label}</span>
              </button>
            ))}
          </div>

          {/* Spaces */}
          <div className="px-4 mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-text-dim/50">
              Spaces
            </span>
          </div>

          {spaces.map((space) => {
            const spaceLists = lists
              .filter((l) => l.spaceId === space.id)
              .sort((a, b) => a.position - b.position)

            return (
              <div key={space.id} className="px-2 mb-1">
                <button
                  onClick={() => navigate('space', { spaceId: space.id })}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left
                    ${activeView === 'space' && activeSpaceId === space.id
                      ? 'bg-accent/10 text-accent'
                      : 'text-text hover:bg-surface-hover'
                    }
                  `}
                >
                  <span>{space.icon}</span>
                  <span>{space.name}</span>
                </button>

                {/* Lists under this space */}
                {spaceLists.map((list) => (
                  <button
                    key={list.id}
                    onClick={() => navigate('list', { spaceId: space.id, listId: list.id })}
                    className={`
                      w-full flex items-center gap-3 pl-10 pr-3 py-2 rounded-lg text-sm text-left
                      ${activeView === 'list' && activeListId === list.id
                        ? 'bg-accent/10 text-accent'
                        : 'text-text-dim hover:bg-surface-hover'
                      }
                    `}
                  >
                    <span className="text-[10px]">{list.type === 'checklist' ? '☑' : '▸'}</span>
                    <span>{list.name}</span>
                  </button>
                ))}

                {/* Add list */}
                {addingListForSpace === space.id ? (
                  <form onSubmit={(e) => handleAddList(e, space.id)} className="pl-10 pr-3 py-1">
                    <input
                      autoFocus
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                      onBlur={() => setAddingListForSpace(null)}
                      placeholder="List name..."
                      className="w-full bg-transparent text-sm text-text placeholder:text-text-dim/50 outline-none border-b border-border-light pb-1"
                    />
                  </form>
                ) : (
                  <button
                    onClick={() => setAddingListForSpace(space.id)}
                    className="w-full flex items-center gap-3 pl-10 pr-3 py-1.5 text-xs text-text-dim/40 hover:text-text-dim"
                  >
                    + Add list
                  </button>
                )}
              </div>
            )
          })}

          {/* Add space */}
          <form onSubmit={handleAddSpace} className="px-4 mt-3">
            <input
              value={newSpaceName}
              onChange={(e) => setNewSpaceName(e.target.value)}
              placeholder="+ New space..."
              className="w-full bg-transparent text-sm text-text-dim placeholder:text-text-dim/30 outline-none py-2"
            />
          </form>
        </nav>
      </aside>
    </>
  )
}
