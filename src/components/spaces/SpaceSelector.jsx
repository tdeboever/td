import { useSpaceStore } from '../../stores/spaceStore'
import { useUiStore } from '../../stores/uiStore'

export default function SpaceSelector() {
  const spaces = useSpaceStore((s) => s.spaces)
  const { setView, activeSpaceId } = useUiStore()

  if (spaces.length === 0) return null

  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 py-2">
      {spaces.map((space) => (
        <button
          key={space.id}
          onClick={() => setView('space', { spaceId: space.id })}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-xl text-sm whitespace-nowrap
            ${activeSpaceId === space.id
              ? 'bg-accent/10 text-accent border border-accent/30'
              : 'bg-surface text-text-dim border border-border'
            }
          `}
        >
          <span>{space.icon}</span>
          <span>{space.name}</span>
        </button>
      ))}
    </div>
  )
}
