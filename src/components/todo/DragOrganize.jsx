import { useRef, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useSpaceStore } from '../../stores/spaceStore'
import { useListStore } from '../../stores/listStore'
import { useTodoStore } from '../../stores/todoStore'
import { useUiStore } from '../../stores/uiStore'
import { toLocalDateStr } from '../../lib/utils'
import { emitExplosion } from './ParticleCanvas'
import SpaceAvatar from '../common/SpaceAvatar'

export default function DragOrganize({ todo, startPos, onDone }) {
  const spaces = useSpaceStore((s) => s.spaces)
  const allLists = useListStore((s) => s.lists)
  const updateTodo = useTodoStore((s) => s.updateTodo)
  const deleteTodo = useTodoStore((s) => s.deleteTodo)
  const showUndo = useUiStore((s) => s.showUndo)

  const px = useRef(startPos.x)
  const py = useRef(startPos.y)
  const velX = useRef(0)
  const velY = useRef(0)
  const lastT = useRef({ x: startPos.x, y: startPos.y, t: Date.now() })
  const [hovered, setHovered] = useState(null)
  const [nearSpace, setNearSpace] = useState(null) // for showing lists
  const [entered, setEntered] = useState(false)
  const [, rerender] = useState(0)

  const W = window.innerWidth
  const H = window.innerHeight

  const act = (label, data) => () => {
    const old = { spaceId: todo.spaceId, listId: todo.listId, dueDate: todo.dueDate, dueTime: todo.dueTime, type: todo.type }
    updateTodo(todo.id, data)
    showUndo(label, () => updateTodo(todo.id, old))
  }

  // Spatial layout — spread for tossing
  const pad = W / (spaces.length + 1)
  const zones = [
    // Spaces — horizontal row at top
    ...spaces.map((s, i) => ({
      id: `sp-${s.id}`, label: s.name, color: s.color || '#a78bfa',
      x: pad * (i + 1), y: 100,
      r: 40, // hit radius
      icon: <SpaceAvatar space={s} size={30} />,
      spaceId: s.id,
      action: act(`→ ${s.name}`, { spaceId: s.id, listId: null }),
    })),
    // Actions — spread at bottom
    { id: 'later', label: 'Later', x: W * 0.15, y: H - 130, r: 35, color: '#60a5fa', icon: '⏰',
      action: act('Later', (() => { const n=new Date(); return { dueDate: toLocalDateStr(n), dueTime: `${String(Math.min(n.getHours()+3,21)).padStart(2,'0')}:00` } })()) },
    { id: 'tmrw', label: 'Tmrw', x: W * 0.4, y: H - 130, r: 35, color: '#a78bfa', icon: '📅',
      action: act('Tomorrow', (() => { const d=new Date(); d.setDate(d.getDate()+1); return { dueDate: toLocalDateStr(d), dueTime: null } })()) },
    { id: 'note', label: 'Note', x: W * 0.65, y: H - 130, r: 35, color: '#60a5fa', icon: '✎',
      action: act('→ Note', { type: 'note' }) },
    { id: 'del', label: 'Delete', x: W * 0.88, y: H - 130, r: 35, color: '#ff6b6b', icon: '✕',
      action: () => deleteTodo(todo.id) },
  ]

  // Lists for hovered space — fan out below the space
  const hoveredSpaceId = nearSpace
  const spaceLists = hoveredSpaceId ? allLists.filter(l => l.spaceId === hoveredSpaceId) : []
  const spaceZone = zones.find(z => z.spaceId === hoveredSpaceId)
  const listZones = spaceLists.map((l, i) => ({
    id: `list-${l.id}`, label: l.name, color: spaceZone?.color || '#a78bfa',
    x: (spaceZone?.x || W/2) + (i - (spaceLists.length - 1) / 2) * 70,
    y: 180, r: 30,
    action: act(`→ ${l.name}`, { spaceId: hoveredSpaceId, listId: l.id }),
  }))

  const allZones = [...zones, ...listZones]

  const hitTest = (x, y, radius = 0) => {
    for (const z of allZones) {
      const dist = Math.sqrt((x - z.x) ** 2 + (y - z.y) ** 2)
      if (dist < (z.r || 40) + radius) return z.id
    }
    return null
  }

  useEffect(() => {
    setTimeout(() => setEntered(true), 20)
    const move = (e) => {
      e.preventDefault()
      const t = e.touches[0]; const now = Date.now()
      const dt = (now - lastT.current.t) / 1000
      if (dt > 0) { velX.current = (t.clientX - lastT.current.x) / dt; velY.current = (t.clientY - lastT.current.y) / dt }
      lastT.current = { x: t.clientX, y: t.clientY, t: now }
      px.current = t.clientX; py.current = t.clientY

      const hit = hitTest(px.current, py.current)
      setHovered(hit)

      // Track which space we're near (for showing lists)
      let near = null
      for (const z of zones) {
        if (z.spaceId && Math.sqrt((px.current - z.x) ** 2 + (py.current - z.y) ** 2) < 100) { near = z.spaceId; break }
      }
      setNearSpace(near)

      rerender(n => n + 1)
    }
    const end = () => {
      if (hovered) {
        const z = allZones.find(z => z.id === hovered)
        if (z) { emitExplosion(z.x, z.y, 500, 12); if (navigator.vibrate) navigator.vibrate(12); z.action(); onDone(); return }
      }
      // Fling — generous radius
      const speed = Math.sqrt(velX.current ** 2 + velY.current ** 2)
      if (speed > 400) {
        const pX = px.current + velX.current * 0.3, pY = py.current + velY.current * 0.3
        const hit = hitTest(pX, pY, 30) // extra 30px radius for flings
        if (hit) {
          const z = allZones.find(z => z.id === hit)
          if (z) { emitExplosion(z.x, z.y, 600, 15); if (navigator.vibrate) navigator.vibrate(15); z.action(); onDone(); return }
        }
      }
      onDone()
    }
    document.addEventListener('touchmove', move, { passive: false })
    document.addEventListener('touchend', end)
    return () => { document.removeEventListener('touchmove', move); document.removeEventListener('touchend', end) }
  })

  const renderZone = (z, delay = 0) => {
    const h = hovered === z.id
    return (
      <div key={z.id} className="absolute flex flex-col items-center" style={{
        left: z.x - 32, top: z.y - 32, width: 64,
        opacity: entered ? 1 : 0,
        transform: entered ? 'scale(1)' : 'scale(0.4)',
        transition: `all 350ms cubic-bezier(0.34,1.56,0.64,1) ${delay}ms`,
      }}>
        <div style={{
          width: h ? 60 : 52, height: h ? 60 : 52,
          borderRadius: h ? 20 : 16,
          background: h ? z.color : 'rgba(255,255,255,0.07)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, color: 'white',
          boxShadow: h ? `0 0 30px ${z.color}60, 0 4px 20px rgba(0,0,0,0.3)` : '0 2px 8px rgba(0,0,0,0.2)',
          transition: 'all 200ms cubic-bezier(0.16,1,0.3,1)',
          border: `2px solid ${h ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.06)'}`,
        }}>
          {typeof z.icon === 'string' ? z.icon : z.icon}
        </div>
        <span style={{ fontSize: 10, fontWeight: 600, marginTop: 5, color: h ? '#fff' : 'var(--text-ghost)', transition: 'color 150ms' }}>{z.label}</span>
      </div>
    )
  }

  return createPortal(
    <div className="fixed inset-0 z-50" style={{ touchAction: 'none', pointerEvents: 'none' }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'rgba(26,22,37,0.82)',
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        opacity: entered ? 1 : 0, transition: 'opacity 200ms',
      }} />

      {/* Space zones — top row */}
      {zones.filter(z => z.spaceId).map((z, i) => renderZone(z, i * 40))}

      {/* List zones — fan out below hovered space */}
      {listZones.map((z, i) => renderZone(z, 150 + i * 30))}

      {/* Action zones — bottom */}
      {zones.filter(z => !z.spaceId).map((z, i) => renderZone(z, 80 + i * 30))}

      {/* Pill */}
      <div style={{
        position: 'absolute', left: px.current - 75, top: py.current - 20,
        width: 150, padding: '10px 16px', borderRadius: 22,
        background: hovered
          ? (allZones.find(z => z.id === hovered)?.color || 'linear-gradient(135deg, #f472b6, #ff7b54)')
          : 'linear-gradient(135deg, #f472b6, #ff7b54)',
        boxShadow: '0 14px 44px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)',
        color: 'white', fontSize: 13, fontWeight: 600,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center',
        transform: hovered ? 'scale(0.85)' : 'scale(1)',
        transition: 'transform 200ms cubic-bezier(0.16,1,0.3,1), background 150ms',
      }}>
        {todo.text}
      </div>
    </div>,
    document.body
  )
}
