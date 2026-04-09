import { useSpaceStore } from '../../stores/spaceStore'
import { useUiStore } from '../../stores/uiStore'
import SpaceAvatar from '../common/SpaceAvatar'

export default function SpaceRow() {
  const spaces = useSpaceStore((s) => s.spaces)
  const { activeView, activeSpaceId, setView } = useUiStore()

  if (spaces.length === 0) return null
  // Only show on main views, not when already in a space/list
  if (activeView === 'space' || activeView === 'list') return null

  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar" style={{ padding: '0 20px 12px' }}>
      {spaces.map((s) => {
        const active = activeView === 'space' && activeSpaceId === s.id
        return (
          <button key={s.id} onClick={() => setView('space', { spaceId: s.id })}
            onMouseDown={(e) => e.preventDefault()}
            style={{
              flexShrink: 0, padding: '6px 16px', borderRadius: 9999,
              fontSize: 13, fontWeight: 500,
              background: active ? 'linear-gradient(135deg, var(--accent-lavender), var(--accent-sky))' : 'var(--surface-card)',
              color: active ? 'white' : 'var(--text-secondary)',
              boxShadow: active ? '0 2px 10px rgba(167,139,250,0.2)' : 'none',
              transition: 'all 150ms',
            }}>
            <SpaceAvatar space={s} size={20} /> {s.name}
          </button>
        )
      })}
    </div>
  )
}
