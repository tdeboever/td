import { useRef, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useSpaceStore } from '../../stores/spaceStore'
import { useTodoStore } from '../../stores/todoStore'
import { useUiStore } from '../../stores/uiStore'
import { toLocalDateStr } from '../../lib/utils'
import SpaceAvatar from '../common/SpaceAvatar'

const ZONE_R = 32

export default function DragOrganize({ todo, startPos, onDone }) {
  const spaces = useSpaceStore((s) => s.spaces)
  const updateTodo = useTodoStore((s) => s.updateTodo)
  const deleteTodo = useTodoStore((s) => s.deleteTodo)
  const showUndo = useUiStore((s) => s.showUndo)

  const px = useRef(startPos.x)
  const py = useRef(startPos.y)
  const velX = useRef(0)
  const velY = useRef(0)
  const lastT = useRef({ x: startPos.x, y: startPos.y, t: Date.now() })
  const [, rerender] = useState(0)
  const [hovered, setHovered] = useState(null)
  const [done, setDone] = useState(false)
  const overlayRef = useRef(null)

  const W = window.innerWidth
  const H = window.innerHeight

  const zones = [
    ...spaces.map((s, i) => ({
      id: `sp-${s.id}`, label: s.name, color: s.color || '#a78bfa',
      x: 40 + i * 70, y: 70,
      icon: <SpaceAvatar space={s} size={24} />,
      action: () => { updateTodo(todo.id, { spaceId: s.id }); showUndo(`→ ${s.name}`, () => updateTodo(todo.id, { spaceId: todo.spaceId })) },
    })),
    { id: 'later', label: 'Later', x: W - 60, y: H * 0.3, color: '#60a5fa', icon: '⏰',
      action: () => { const n = new Date(); updateTodo(todo.id, { dueDate: toLocalDateStr(n), dueTime: `${String(Math.min(n.getHours()+3,21)).padStart(2,'0')}:00` }); showUndo('Later', () => updateTodo(todo.id, { dueDate: todo.dueDate, dueTime: todo.dueTime })) }},
    { id: 'tmrw', label: 'Tmrw', x: W - 60, y: H * 0.45, color: '#a78bfa', icon: '📅',
      action: () => { const d = new Date(); d.setDate(d.getDate()+1); updateTodo(todo.id, { dueDate: toLocalDateStr(d), dueTime: null }); showUndo('Tomorrow', () => updateTodo(todo.id, { dueDate: todo.dueDate })) }},
    { id: 'note', label: 'Note', x: W - 60, y: H * 0.6, color: '#60a5fa', icon: '✎',
      action: () => { updateTodo(todo.id, { type: 'note' }); showUndo('→ Note', () => updateTodo(todo.id, { type: 'task' })) }},
    { id: 'del', label: 'Delete', x: W / 2, y: H - 100, color: '#ff6b6b', icon: '✕',
      action: () => deleteTodo(todo.id) },
  ]

  useEffect(() => {
    const el = overlayRef.current
    if (!el) return

    const move = (e) => {
      e.preventDefault()
      const t = e.touches[0]
      const now = Date.now()
      const dt = (now - lastT.current.t) / 1000
      if (dt > 0) { velX.current = (t.clientX - lastT.current.x) / dt; velY.current = (t.clientY - lastT.current.y) / dt }
      lastT.current = { x: t.clientX, y: t.clientY, t: now }
      px.current = t.clientX
      py.current = t.clientY

      let nearest = null
      for (const z of zones) {
        if (Math.sqrt((px.current - z.x) ** 2 + (py.current - z.y) ** 2) < 50) { nearest = z.id; break }
      }
      setHovered(nearest)
      rerender(n => n + 1)
    }

    const end = () => {
      // Check direct drop
      if (hovered) {
        const z = zones.find(z => z.id === hovered)
        if (z) { setDone(true); if (navigator.vibrate) navigator.vibrate(10); z.action(); setTimeout(onDone, 200); return }
      }

      // Check fling momentum
      const speed = Math.sqrt(velX.current ** 2 + velY.current ** 2)
      if (speed > 600) {
        const projX = px.current + velX.current * 0.2
        const projY = py.current + velY.current * 0.2
        let best = null, bestDist = 120
        for (const z of zones) {
          const d = Math.sqrt((projX - z.x) ** 2 + (projY - z.y) ** 2)
          if (d < bestDist) { best = z; bestDist = d }
        }
        if (best) { setDone(true); px.current = best.x; py.current = best.y; rerender(n => n+1); if (navigator.vibrate) navigator.vibrate(10); best.action(); setTimeout(onDone, 200); return }
      }

      onDone()
    }

    el.addEventListener('touchmove', move, { passive: false })
    el.addEventListener('touchend', end)
    return () => { el.removeEventListener('touchmove', move); el.removeEventListener('touchend', end) }
  })

  if (done) return null

  return createPortal(
    <div ref={overlayRef} className="fixed inset-0 z-50" style={{ touchAction: 'none' }}>
      <div className="absolute inset-0" style={{ background: 'rgba(26,22,37,0.75)', transition: 'opacity 150ms' }} />

      {/* Drop zones */}
      {zones.map(z => {
        const h = hovered === z.id
        return (
          <div key={z.id} className="absolute flex flex-col items-center gap-1" style={{
            left: z.x - ZONE_R, top: z.y - ZONE_R, width: ZONE_R * 2, height: ZONE_R * 2,
          }}>
            <div style={{
              width: h ? 56 : 48, height: h ? 56 : 48, borderRadius: 16,
              background: h ? z.color : 'rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, color: 'white',
              boxShadow: h ? `0 0 20px ${z.color}50` : 'none',
              transition: 'all 150ms cubic-bezier(0.16,1,0.3,1)',
              border: `2px solid ${h ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.08)'}`,
            }}>
              {typeof z.icon === 'string' ? z.icon : z.icon}
            </div>
            <span style={{ fontSize: 9, fontWeight: 600, color: h ? 'var(--text-primary)' : 'var(--text-ghost)' }}>{z.label}</span>
          </div>
        )
      })}

      {/* Dragged pill */}
      <div style={{
        position: 'absolute', left: px.current - 70, top: py.current - 18,
        width: 140, padding: '8px 14px', borderRadius: 16,
        background: 'linear-gradient(135deg, var(--accent-rose), var(--accent-coral))',
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        color: 'white', fontSize: 12, fontWeight: 600,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center',
        pointerEvents: 'none',
      }}>
        {todo.text}
      </div>
    </div>,
    document.body
  )
}
