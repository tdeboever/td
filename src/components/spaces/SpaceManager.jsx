import { useState } from 'react'
import { useSpaceStore } from '../../stores/spaceStore'

const ICONS = ['📁', '💼', '🏠', '🎯', '🚀', '📚', '🎨', '🏋️', '🛒', '✈️']

export default function SpaceManager({ onClose }) {
  const spaces = useSpaceStore((s) => s.spaces)
  const addSpace = useSpaceStore((s) => s.addSpace)
  const updateSpace = useSpaceStore((s) => s.updateSpace)
  const deleteSpace = useSpaceStore((s) => s.deleteSpace)

  const [name, setName] = useState('')
  const [icon, setIcon] = useState('📁')

  const handleAdd = (e) => {
    e.preventDefault()
    if (!name.trim()) return
    addSpace(name.trim(), icon)
    setName('')
    setIcon('📁')
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Manage Spaces</h2>
        {onClose && (
          <button onClick={onClose} className="text-text-dim text-sm">Done</button>
        )}
      </div>

      {/* Existing spaces */}
      {spaces.map((space) => (
        <div key={space.id} className="flex items-center gap-3 py-2 border-b border-border">
          <span className="text-lg">{space.icon}</span>
          <span className="flex-1 text-sm">{space.name}</span>
          <button
            onClick={() => deleteSpace(space.id)}
            className="text-danger text-xs px-2 py-1"
          >
            Delete
          </button>
        </div>
      ))}

      {/* Add new */}
      <form onSubmit={handleAdd} className="mt-4">
        <div className="flex gap-2 mb-2 flex-wrap">
          {ICONS.map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIcon(i)}
              className={`text-lg p-1 rounded ${icon === i ? 'bg-accent/20' : ''}`}
            >
              {i}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Space name..."
            className="flex-1 bg-surface rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-dim/40 outline-none border border-border"
          />
          <button
            type="submit"
            className="bg-accent text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            Add
          </button>
        </div>
      </form>
    </div>
  )
}
