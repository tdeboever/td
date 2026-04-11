import { useSpaceStore } from '../../stores/spaceStore'
import { useListStore } from '../../stores/listStore'
import { useUiStore } from '../../stores/uiStore'
import SpaceAvatar from '../common/SpaceAvatar'

export default function SpaceRow() {
  const spaces = useSpaceStore((s) => s.spaces)
  const lists = useListStore((s) => s.lists)
  const { activeSpaceId, activeListId, setView, activeView } = useUiStore()
  const setState = useUiStore.setState

  if (spaces.length === 0) return null

  const handleSpaceTap = (id) => {
    if (activeSpaceId === id) {
      setState({ activeSpaceId: null, activeListId: null })
    } else {
      setState({ activeSpaceId: id, activeListId: null })
    }
  }

  const handleListTap = (listId) => {
    if (activeListId === listId) {
      setState({ activeListId: null })
    } else {
      setState({ activeListId: listId })
    }
  }

  // Determine which space's lists to show
  const effectiveSpaceId = activeListId
    ? lists.find(l => l.id === activeListId)?.spaceId
    : activeSpaceId
  const spaceLists = effectiveSpaceId
    ? lists.filter((l) => l.spaceId === effectiveSpaceId).sort((a, b) => a.position - b.position)
    : []

  const isInsideSpace = !!activeSpaceId || !!activeListId

  return (
    <div style={{ padding: '0 20px 14px' }}>
      {/* Space chips — only on top-level views (Today, Upcoming, Notes) */}
      {!isInsideSpace && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {spaces.map((s) => {
            const active = activeSpaceId === s.id
            return (
              <button key={s.id} onClick={() => handleSpaceTap(s.id)}
                className="flex items-center gap-2"
                style={{
                  flexShrink: 0, padding: '6px 14px', borderRadius: 9999,
                  fontSize: 13, fontWeight: 500,
                  background: active ? 'linear-gradient(135deg, var(--accent-lavender), var(--accent-sky))' : 'var(--surface-card)',
                  color: active ? 'white' : 'var(--text-secondary)',
                  boxShadow: active ? '0 2px 10px rgba(167,139,250,0.2)' : 'none',
                  transition: 'all 150ms',
                }}>
                <SpaceAvatar space={s} size={18} /> {s.name}
              </button>
            )
          })}
        </div>
      )}

      {/* List chips — show when inside a space or viewing a list */}
      {spaceLists.length > 1 && isInsideSpace && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          <button onClick={() => setState({ activeListId: null })}
            style={{
              flexShrink: 0, padding: '5px 14px', borderRadius: 9999, fontSize: 12, fontWeight: 500,
              background: !activeListId ? 'var(--surface-active)' : 'transparent',
              color: !activeListId ? 'var(--text-primary)' : 'var(--text-secondary)',
              border: !activeListId ? '1px solid rgba(255,255,255,0.16)' : '1px solid rgba(255,255,255,0.06)',
            }}>All</button>
          {spaceLists.map((l) => (
            <button key={l.id} onClick={() => handleListTap(l.id)}
              style={{
                flexShrink: 0, padding: '5px 14px', borderRadius: 9999, fontSize: 12, fontWeight: 500,
                background: activeListId === l.id ? 'var(--surface-active)' : 'transparent',
                color: activeListId === l.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                border: activeListId === l.id ? '1px solid rgba(255,255,255,0.16)' : '1px solid rgba(255,255,255,0.06)',
              }}>{l.name}</button>
          ))}
        </div>
      )}
    </div>
  )
}
