import { useRef, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useSpaceStore } from '../../stores/spaceStore'
import { useTodoStore } from '../../stores/todoStore'
import { useUiStore } from '../../stores/uiStore'
import { toLocalDateStr } from '../../lib/utils'
import { emitExplosion } from './ParticleCanvas'
import SpaceAvatar from '../common/SpaceAvatar'

const ZONE_R = 30

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
  const [hovered, setHovered] = useState(null)
  const [entered, setEntered] = useState(false)
  const [, rerender] = useState(0)

  const W = window.innerWidth
  const H = window.innerHeight

  const zones = [
    ...spaces.map((s, i) => ({
      id: `sp-${s.id}`, label: s.name, color: s.color || '#a78bfa',
      x: 50 + i * 72, y: 80,
      icon: <SpaceAvatar space={s} size={26} />,
      action: () => { updateTodo(todo.id, { spaceId: s.id }); showUndo(`→ ${s.name}`, () => updateTodo(todo.id, { spaceId: todo.spaceId })) },
    })),
    { id: 'later', label: 'Later', x: W - 50, y: H * 0.35, color: '#60a5fa', icon: '⏰',
      action: () => { const n=new Date(); updateTodo(todo.id, { dueDate: toLocalDateStr(n), dueTime: `${String(Math.min(n.getHours()+3,21)).padStart(2,'0')}:00` }); showUndo('Later', () => updateTodo(todo.id, { dueDate: todo.dueDate, dueTime: todo.dueTime })) }},
    { id: 'tmrw', label: 'Tmrw', x: W - 50, y: H * 0.5, color: '#a78bfa', icon: '📅',
      action: () => { const d=new Date(); d.setDate(d.getDate()+1); updateTodo(todo.id, { dueDate: toLocalDateStr(d), dueTime: null }); showUndo('Tomorrow', () => updateTodo(todo.id, { dueDate: todo.dueDate })) }},
    { id: 'note', label: 'Note', x: 50, y: H * 0.45, color: '#60a5fa', icon: '✎',
      action: () => { updateTodo(todo.id, { type: 'note' }); showUndo('→ Note', () => updateTodo(todo.id, { type: 'task' })) }},
    { id: 'del', label: 'Delete', x: W / 2, y: H - 120, color: '#ff6b6b', icon: '✕',
      action: () => deleteTodo(todo.id) },
  ]

  // Listen on DOCUMENT so we capture the existing touch seamlessly
  useEffect(() => {
    setTimeout(() => setEntered(true), 50)

    const move = (e) => {
      e.preventDefault()
      const t = e.touches[0]
      const now = Date.now()
      const dt = (now - lastT.current.t) / 1000
      if (dt > 0) { velX.current = (t.clientX - lastT.current.x) / dt; velY.current = (t.clientY - lastT.current.y) / dt }
      lastT.current = { x: t.clientX, y: t.clientY, t: now }
      px.current = t.clientX
      py.current = t.clientY

      let near = null
      for (const z of zones) {
        if (Math.sqrt((px.current - z.x) ** 2 + (py.current - z.y) ** 2) < 55) { near = z.id; break }
      }
      setHovered(near)
      rerender(n => n + 1)
    }

    const end = () => {
      // Direct drop
      if (hovered) {
        const z = zones.find(z => z.id === hovered)
        if (z) {
          emitExplosion(z.x, z.y, 400, 12)
          if (navigator.vibrate) navigator.vibrate(12)
          z.action()
          onDone()
          return
        }
      }

      // Fling
      const speed = Math.sqrt(velX.current ** 2 + velY.current ** 2)
      if (speed > 500) {
        const projX = px.current + velX.current * 0.25
        const projY = py.current + velY.current * 0.25
        let best = null, bestD = 130
        for (const z of zones) {
          const d = Math.sqrt((projX - z.x) ** 2 + (projY - z.y) ** 2)
          if (d < bestD) { best = z; bestD = d }
        }
        if (best) {
          emitExplosion(best.x, best.y, 400, 12)
          if (navigator.vibrate) navigator.vibrate(12)
          best.action()
          onDone()
          return
        }
      }

      onDone()
    }

    document.addEventListener('touchmove', move, { passive: false })
    document.addEventListener('touchend', end)
    return () => {
      document.removeEventListener('touchmove', move)
      document.removeEventListener('touchend', end)
    }
  })

  const overlay = (
    <div className="fixed inset-0 z-50" style={{ touchAction: 'none', pointerEvents: 'none' }}>
      {/* Background blur */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'rgba(26,22,37,0.8)',
        backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
        opacity: entered ? 1 : 0,
        transition: 'opacity 250ms ease-out',
      }} />

      {/* Drop zones — spring in */}
      {zones.map((z, i) => {
        const h = hovered === z.id
        return (
          <div key={z.id} className="absolute flex flex-col items-center" style={{
            left: z.x - ZONE_R, top: z.y - ZONE_R,
            width: ZONE_R * 2, height: ZONE_R * 2 + 16,
            opacity: entered ? 1 : 0,
            transform: entered ? 'scale(1) translateY(0)' : 'scale(0.5) translateY(10px)',
            transition: `all 350ms cubic-bezier(0.34,1.56,0.64,1) ${i * 40}ms`,
          }}>
            <div style={{
              width: h ? 58 : 50, height: h ? 58 : 50,
              borderRadius: h ? 18 : 14,
              background: h ? z.color : 'rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, color: 'white',
              boxShadow: h ? `0 0 28px ${z.color}60, 0 4px 16px rgba(0,0,0,0.3)` : '0 2px 8px rgba(0,0,0,0.2)',
              transition: 'all 200ms cubic-bezier(0.16,1,0.3,1)',
              border: `2px solid ${h ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.06)'}`,
            }}>
              {typeof z.icon === 'string' ? z.icon : z.icon}
            </div>
            <span style={{
              fontSize: 9, fontWeight: 600, marginTop: 4,
              color: h ? '#fff' : 'var(--text-ghost)',
              transition: 'color 150ms',
            }}>{z.label}</span>
          </div>
        )
      })}

      {/* Floating pill */}
      <div style={{
        position: 'absolute',
        left: px.current - 75, top: py.current - 22,
        width: 150, padding: '10px 16px',
        borderRadius: 20,
        background: hovered
          ? (zones.find(z => z.id === hovered)?.color || 'linear-gradient(135deg, var(--accent-rose), var(--accent-coral))')
          : 'linear-gradient(135deg, var(--accent-rose), var(--accent-coral))',
        boxShadow: '0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)',
        color: 'white', fontSize: 13, fontWeight: 600,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center',
        transition: 'background 150ms, border-radius 150ms',
        transform: hovered ? 'scale(0.9)' : 'scale(1)',
      }}>
        {todo.text}
      </div>
    </div>
  )

  return createPortal(overlay, document.body)
}
