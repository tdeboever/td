import { useRef, useState, useEffect } from 'react'
import { useSpaceStore } from '../../stores/spaceStore'
import { useTodoStore } from '../../stores/todoStore'
import { useUiStore } from '../../stores/uiStore'
import { toLocalDateStr } from '../../lib/utils'
import SpaceAvatar from '../common/SpaceAvatar'

/*
  When active, shows a floating task pill + drop zone targets.
  The task follows the finger and can be dropped/flung to a target.
*/

const ZONE_SIZE = 64
const SNAP_DIST = 60

export default function DragOrganize({ todo, startPos, onDone }) {
  const spaces = useSpaceStore((s) => s.spaces)
  const updateTodo = useTodoStore((s) => s.updateTodo)
  const deleteTodo = useTodoStore((s) => s.deleteTodo)
  const showUndo = useUiStore((s) => s.showUndo)

  const [pos, setPos] = useState(startPos)
  const [hoveredZone, setHoveredZone] = useState(null)
  const [dropped, setDropped] = useState(false)
  const velocity = useRef({ vx: 0, vy: 0 })
  const lastTouch = useRef({ x: startPos.x, y: startPos.y, t: Date.now() })
  const overlayRef = useRef(null)

  const W = window.innerWidth
  const H = window.innerHeight

  // Drop zones — arranged around the screen
  const zones = [
    // Spaces across the top
    ...spaces.map((s, i) => ({
      id: `space-${s.id}`,
      label: s.name,
      x: (W / (spaces.length + 1)) * (i + 1),
      y: 80,
      color: s.color || 'var(--accent-lavender)',
      icon: <SpaceAvatar space={s} size={28} />,
      action: () => {
        const old = { spaceId: todo.spaceId }
        updateTodo(todo.id, { spaceId: s.id })
        showUndo(`→ ${s.name}`, () => updateTodo(todo.id, old))
      },
    })),
    // Time options bottom-left
    { id: 'later', label: 'Later', x: W * 0.2, y: H - 160, color: 'var(--accent-sky)', icon: '⏰',
      action: () => {
        const now = new Date()
        const h = Math.min(now.getHours() + 3, 21)
        updateTodo(todo.id, { dueDate: toLocalDateStr(now), dueTime: `${String(h).padStart(2,'0')}:00` })
        showUndo('Set to later', () => updateTodo(todo.id, { dueDate: todo.dueDate, dueTime: todo.dueTime }))
      }},
    { id: 'tmrw', label: 'Tomorrow', x: W * 0.4, y: H - 160, color: 'var(--accent-lavender)', icon: '📅',
      action: () => {
        const d = new Date(); d.setDate(d.getDate() + 1)
        updateTodo(todo.id, { dueDate: toLocalDateStr(d), dueTime: null })
        showUndo('→ Tomorrow', () => updateTodo(todo.id, { dueDate: todo.dueDate, dueTime: todo.dueTime }))
      }},
    // Note bottom-right
    { id: 'note', label: 'Note', x: W * 0.7, y: H - 160, color: 'var(--accent-sky)', icon: '✎',
      action: () => {
        updateTodo(todo.id, { type: 'note' })
        showUndo('Made a note', () => updateTodo(todo.id, { type: 'task' }))
      }},
    // Delete far bottom-right
    { id: 'delete', label: 'Delete', x: W * 0.9, y: H - 160, color: 'var(--color-danger)', icon: '✕',
      action: () => deleteTodo(todo.id) },
  ]

  // Touch handlers
  useEffect(() => {
    const el = overlayRef.current
    if (!el) return

    const handleMove = (e) => {
      e.preventDefault()
      const t = e.touches[0]
      const now = Date.now()
      const dt = (now - lastTouch.current.t) / 1000
      if (dt > 0) {
        velocity.current.vx = (t.clientX - lastTouch.current.x) / dt
        velocity.current.vy = (t.clientY - lastTouch.current.y) / dt
      }
      lastTouch.current = { x: t.clientX, y: t.clientY, t: now }
      setPos({ x: t.clientX, y: t.clientY })

      // Check which zone we're hovering
      let nearest = null
      let nearestDist = Infinity
      for (const z of zones) {
        const dist = Math.sqrt((t.clientX - z.x) ** 2 + (t.clientY - z.y) ** 2)
        if (dist < SNAP_DIST && dist < nearestDist) {
          nearest = z.id
          nearestDist = dist
        }
      }
      setHoveredZone(nearest)
    }

    const handleEnd = () => {
      if (hoveredZone) {
        // Drop on zone
        const zone = zones.find((z) => z.id === hoveredZone)
        if (zone) {
          setDropped(true)
          if (navigator.vibrate) navigator.vibrate(10)
          zone.action()
          setTimeout(onDone, 300)
          return
        }
      }

      // Check momentum — if flung toward a zone
      const speed = Math.sqrt(velocity.current.vx ** 2 + velocity.current.vy ** 2)
      if (speed > 800) {
        const angle = Math.atan2(velocity.current.vy, velocity.current.vx)
        const projX = pos.x + Math.cos(angle) * 200
        const projY = pos.y + Math.sin(angle) * 200
        for (const z of zones) {
          const dist = Math.sqrt((projX - z.x) ** 2 + (projY - z.y) ** 2)
          if (dist < SNAP_DIST * 2) {
            setDropped(true)
            setPos({ x: z.x, y: z.y })
            if (navigator.vibrate) navigator.vibrate(10)
            z.action()
            setTimeout(onDone, 300)
            return
          }
        }
      }

      // No target — cancel
      onDone()
    }

    el.addEventListener('touchmove', handleMove, { passive: false })
    el.addEventListener('touchend', handleEnd)
    return () => {
      el.removeEventListener('touchmove', handleMove)
      el.removeEventListener('touchend', handleEnd)
    }
  })

  return (
    <div ref={overlayRef} className="fixed inset-0 z-50" style={{ touchAction: 'none' }}>
      {/* Dimmed background */}
      <div className="absolute inset-0 animate-fade-in" style={{ background: 'rgba(26,22,37,0.7)' }} />

      {/* Drop zones */}
      {zones.map((z) => {
        const isHovered = hoveredZone === z.id
        return (
          <div key={z.id} className="absolute flex flex-col items-center gap-1 animate-fade-in"
            style={{
              left: z.x - ZONE_SIZE / 2, top: z.y - ZONE_SIZE / 2,
              width: ZONE_SIZE, height: ZONE_SIZE,
              transition: 'transform 200ms cubic-bezier(0.16,1,0.3,1), box-shadow 200ms',
              transform: isHovered ? 'scale(1.3)' : 'scale(1)',
            }}>
            <div style={{
              width: ZONE_SIZE - 8, height: ZONE_SIZE - 8, borderRadius: 20,
              background: isHovered ? z.color : 'var(--surface-active)',
              boxShadow: isHovered ? `0 0 24px ${z.color}40` : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, transition: 'all 200ms',
              border: `2px solid ${isHovered ? 'rgba(255,255,255,0.2)' : 'var(--border-visible)'}`,
            }}>
              {typeof z.icon === 'string' ? z.icon : z.icon}
            </div>
            <span style={{ fontSize: 10, fontWeight: 600, color: isHovered ? 'var(--text-primary)' : 'var(--text-ghost)', transition: 'color 150ms' }}>{z.label}</span>
          </div>
        )
      })}

      {/* Floating task pill */}
      {!dropped && (
        <div style={{
          position: 'absolute',
          left: pos.x - 80, top: pos.y - 20,
          width: 160, padding: '10px 16px',
          borderRadius: 20,
          background: 'linear-gradient(135deg, var(--accent-rose), var(--accent-coral))',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          color: 'white', fontSize: 13, fontWeight: 600,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          textAlign: 'center',
          pointerEvents: 'none',
          transition: 'transform 50ms',
        }}>
          {todo.text}
        </div>
      )}
    </div>
  )
}
