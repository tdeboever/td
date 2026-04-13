import { useUiStore } from '../../stores/uiStore'
import { useSpaceStore } from '../../stores/spaceStore'
import { useListStore } from '../../stores/listStore'
import { useTodoStore } from '../../stores/todoStore'
import { useShareStore } from '../../stores/shareStore'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useSwipe } from '../../hooks/useSwipe'
import SpaceAvatar from '../common/SpaceAvatar'
import InviteBanner from '../sharing/InviteBanner'
import ShareSheet from '../sharing/ShareSheet'
import { useState, useRef, useCallback } from 'react'

const SMART_VIEWS = [
  { id: 'today', label: 'Today', icon: '◉' },
  { id: 'upcoming', label: 'Upcoming', icon: '→' },
]

function SharedListRow({ list, share, la, onNavigate, spaces, onAssignSpace }) {
  const [showPicker, setShowPicker] = useState(false)
  return (
    <>
      <div className="flex items-center" style={{ height: 40 }}>
        <button onClick={onNavigate}
          className="flex-1 flex items-center gap-2 text-left transition-colors"
          style={{ padding: '0 0 0 52px', fontSize: 13, color: la ? 'var(--accent-lavender)' : 'var(--text-secondary)', fontWeight: la ? 500 : 400, height: '100%' }}>
          <span className="flex-1">{list.name} <span style={{ fontSize: 10, opacity: 0.4 }}>↗</span></span>
          {share?.owner?.display_name && (
            <span style={{ fontSize: 10, color: 'var(--text-ghost)' }}>{share.owner.display_name.split(' ')[0]}</span>
          )}
        </button>
        {spaces.length > 0 && (
          <button onClick={() => setShowPicker(!showPicker)}
            style={{ padding: '0 12px', color: 'var(--text-ghost)', fontSize: 11, opacity: 0.4 }}>
            {share?.recipient_space_id ? '⟳' : '+'}
          </button>
        )}
      </div>
      {showPicker && (
        <div className="animate-slide-down" style={{ padding: '4px 20px 8px 52px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {share?.recipient_space_id && (
            <button onClick={() => { onAssignSpace(share.id, null); setShowPicker(false) }}
              style={{ padding: '4px 10px', borderRadius: 8, fontSize: 11, background: 'var(--surface-card)', color: 'var(--text-ghost)' }}>
              None
            </button>
          )}
          {spaces.map(s => (
            <button key={s.id} onClick={() => { onAssignSpace(share.id, s.id); setShowPicker(false) }}
              style={{ padding: '4px 10px', borderRadius: 8, fontSize: 11,
                background: share?.recipient_space_id === s.id ? s.color : 'var(--surface-card)',
                color: share?.recipient_space_id === s.id ? 'white' : 'var(--text-secondary)' }}>
              {s.name}
            </button>
          ))}
        </div>
      )}
    </>
  )
}

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
  const sharedLists = useShareStore((s) => s.sharedLists)
  const acceptedShares = useShareStore((s) => s.incoming).filter(s => s.status === 'accepted')
  const fetchShares = useShareStore((s) => s.fetchShares)
  const [shareListId, setShareListId] = useState(null)

  const assignSharedListToSpace = async (shareId, spaceId) => {
    if (!supabase) return
    await supabase.from('list_shares').update({ recipient_space_id: spaceId }).eq('id', shareId)
    fetchShares()
  }
  const [renamingSpace, setRenamingSpace] = useState(null)
  const [renameText, setRenameText] = useState('')
  const [renameColor, setRenameColor] = useState(null)
  const SPACE_COLORS = ['#ff7b54', '#f472b6', '#60a5fa', '#4ade80', '#fbbf24', '#a78bfa', '#f87171', '#38bdf8', '#c084fc', '#fb923c']
  const longPressRef = useRef(null)
  const longPressFired = useRef(false)
  const colorTapRef = useRef(false)
  const startEditSpace = (space) => {
    longPressFired.current = true
    setRenamingSpace(space.id); setRenameText(space.name); setRenameColor(space.color || '#a78bfa')
  }
  const cnt = (fn) => todos.filter((t) => t.status === 'active' && fn(t)).length
  const navigate = (v, o) => { setView(v, o); closeSidebar() }
  const selectSpace = (id) => { setView('space', { spaceId: id }); closeSidebar() }
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
          <p style={{ padding: '0 20px 16px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 28, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>Spaces</p>
          {spaces.map((space) => {
            const spaceLists = lists.filter((l) => l.spaceId === space.id).sort((a, b) => a.position - b.position)
            const a = activeView === 'space' && activeSpaceId === space.id
            const sc = cnt((t) => t.spaceId === space.id)
            return (
              <div key={space.id} style={{ borderBottom: '1px solid var(--border-subtle)', marginBottom: 4, paddingBottom: 4 }}>
                <div className="flex items-center" style={{ minHeight: 48, borderLeft: `3px solid ${a ? 'var(--accent-lavender)' : 'transparent'}`, margin: '0 8px', borderRadius: 16 }}>
                  {renamingSpace === space.id ? (
                    <div style={{ flex: 1, padding: '8px 12px 8px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <SpaceAvatar space={{ ...space, name: renameText || space.name, color: renameColor }} size={24} />
                        <input autoFocus value={renameText} onChange={(e) => setRenameText(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (renameText.trim()) { updateSpace(space.id, { name: renameText.trim(), color: renameColor }); setRenamingSpace(null) } } }}
                          className="flex-1 bg-transparent outline-none" style={{ fontSize: 14, color: 'var(--text-primary)', minWidth: 0 }} />
                        <button onClick={(e) => { e.stopPropagation(); if (renameText.trim()) updateSpace(space.id, { name: renameText.trim(), color: renameColor }); setRenamingSpace(null) }}
                          style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent-coral)', padding: '4px 6px', flexShrink: 0 }}>Done</button>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8, paddingLeft: 34 }}>
                        {SPACE_COLORS.map(c => (
                          <button key={c} onClick={(e) => { e.stopPropagation(); setRenameColor(c) }}
                            style={{
                              width: 22, height: 22, borderRadius: '50%', background: c,
                              border: renameColor === c ? '2px solid white' : '1px solid rgba(255,255,255,0.1)',
                              boxShadow: renameColor === c ? `0 0 6px ${c}60` : 'none',
                              transition: 'all 150ms',
                            }} />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => { if (longPressFired.current) { longPressFired.current = false; return } selectSpace(space.id) }}
                      onDoubleClick={() => startEditSpace(space)}
                      onTouchStart={() => { longPressFired.current = false; longPressRef.current = setTimeout(() => { if (navigator.vibrate) navigator.vibrate(10); startEditSpace(space) }, 500) }}
                      onTouchEnd={() => { if (longPressRef.current) clearTimeout(longPressRef.current) }}
                      onTouchMove={() => { if (longPressRef.current) clearTimeout(longPressRef.current) }}
                      className="flex-1 flex items-center gap-4 text-left transition-colors"
                      style={{ padding: '0 0 0 20px', fontSize: 15, color: a ? 'var(--accent-lavender)' : 'var(--text-primary)', fontWeight: a ? 600 : 400, height: '100%' }}>
                      <SpaceAvatar space={space} size={24} />
                      <span className="flex-1">{space.name}</span>
                      {sc > 0 && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)' }}>{sc}</span>}
                    </button>
                  )}
                  <button onClick={() => { if (confirm(`Delete "${space.name}"?`)) { deleteSpace(space.id); if (a) { useUiStore.setState({ activeSpaceId: null }); closeSidebar() } } }}
                    className="active:opacity-100"
                    style={{ padding: '0 20px', color: 'var(--text-ghost)', fontSize: 14, opacity: 0.25, height: '100%' }}>×</button>
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
                      {list.type === 'checklist' && (
                        <button onClick={() => setShareListId(list.id)}
                          style={{ padding: '0 6px', color: 'var(--text-ghost)', fontSize: 12, opacity: 0.35 }}>↗</button>
                      )}
                      <button onClick={() => { if (confirm(`Delete "${list.name}"?`)) { deleteList(list.id); if (la) navigate('space', { spaceId: space.id }) } }}
                        className="active:opacity-100"
                        style={{ padding: '0 20px', color: 'var(--text-ghost)', fontSize: 14, opacity: 0.25, height: '100%' }}>×</button>
                    </div>
                  )
                })}
                {/* Shared lists assigned to this space */}
                {sharedLists.filter(sl => {
                  const share = acceptedShares.find(s => s.list_id === sl.id)
                  return share?.recipient_space_id === space.id
                }).map(list => {
                  const share = acceptedShares.find(s => s.list_id === list.id)
                  const la = activeView === 'list' && activeListId === list.id
                  return (
                    <SharedListRow key={list.id} list={list} share={share} la={la}
                      onNavigate={() => navigate('list', { spaceId: space.id, listId: list.id })}
                      spaces={spaces} onAssignSpace={assignSharedListToSpace} />
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

          {/* Pending invites */}
          <InviteBanner />

          {/* Shared lists — unassigned ones */}
          {(() => {
            const unassigned = sharedLists.filter(list => {
              const share = acceptedShares.find(s => s.list_id === list.id)
              return !share?.recipient_space_id
            })
            if (unassigned.length === 0) return null
            return (
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 12, marginTop: 4 }}>
                <p style={{ padding: '0 20px 8px', fontSize: 11, fontWeight: 600, color: 'var(--text-ghost)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Shared with me
                </p>
                {unassigned.map(list => {
                  const share = acceptedShares.find(s => s.list_id === list.id)
                  const la = activeView === 'list' && activeListId === list.id
                  return (
                    <SharedListRow key={list.id} list={list} share={share} la={la}
                      onNavigate={() => navigate('list', { spaceId: list.space_id, listId: list.id })}
                      spaces={spaces} onAssignSpace={assignSharedListToSpace} />
                  )
                })}
              </div>
            )
          })()}

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

      {/* Share sheet */}
      {shareListId && (() => {
        const list = lists.find(l => l.id === shareListId)
        return list ? <ShareSheet listId={list.id} listName={list.name} onClose={() => setShareListId(null)} /> : null
      })()}
    </>
  )
}
