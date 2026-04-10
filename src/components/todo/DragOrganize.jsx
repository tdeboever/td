import { useRef, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useSpaceStore } from '../../stores/spaceStore'
import { useListStore } from '../../stores/listStore'
import { useTodoStore } from '../../stores/todoStore'
import { useUiStore } from '../../stores/uiStore'
import { toLocalDateStr } from '../../lib/utils'
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
  const touchHistory = useRef([])
  const [hovered, setHovered] = useState(null)
  const hoveredRef = useRef(null)
  const [nearSpaceId, setNearSpaceId] = useState(null)
  const [entered, setEntered] = useState(false)
  const [flying, setFlying] = useState(null)
  const [, rerender] = useState(0)

  const W = window.innerWidth
  const H = window.innerHeight
  const MID = H * 0.45 // threshold — above this, you're "reaching" toward spaces

  const act = (label, data) => () => {
    const old = { spaceId: todo.spaceId, listId: todo.listId, dueDate: todo.dueDate, dueTime: todo.dueTime, type: todo.type }
    updateTodo(todo.id, data)
    showUndo(label, () => updateTodo(todo.id, old))
  }

  // TOP: Spaces
  const spacePad = W / (spaces.length + 1)
  const spaceZones = spaces.map((s, i) => ({
    id: `sp-${s.id}`, label: s.name, color: s.color || '#a78bfa',
    x: spacePad * (i + 1), y: 90, r: 40,
    icon: <SpaceAvatar space={s} size={28} />,
    action: act(`→ ${s.name}`, { spaceId: s.id }),
  }))

  // BOTTOM: default actions OR lists for the near space
  const nearSpace = spaces.find(s => `sp-${s.id}` === nearSpaceId)
  const spaceLists = nearSpace ? allLists.filter(l => l.spaceId === nearSpace.id) : []
  const showingLists = spaceLists.length > 0 && py.current < MID

  const actionZones = [
    { id: 'later', label: 'Later', r: 35, color: '#60a5fa', icon: '⏰',
      action: act('Later', (() => { const n=new Date(); return { dueDate: toLocalDateStr(n), dueTime: `${String(Math.min(n.getHours()+3,21)).padStart(2,'0')}:00` } })()) },
    { id: 'tmrw', label: 'Tmrw', r: 35, color: '#a78bfa', icon: '📅',
      action: act('Tomorrow', (() => { const d=new Date(); d.setDate(d.getDate()+1); return { dueDate: toLocalDateStr(d), dueTime: null } })()) },
    { id: 'note', label: 'Note', r: 35, color: '#60a5fa', icon: '✎',
      action: act('→ Note', { type: 'note' }) },
    { id: 'del', label: 'Delete', r: 35, color: '#ff6b6b', icon: '✕',
      action: () => deleteTodo(todo.id) },
  ]

  const listZones = spaceLists.map((l, i) => ({
    id: `list-${l.id}`, label: l.name, r: 35, color: nearSpace?.color || '#a78bfa',
    action: act(`→ ${l.name}`, { spaceId: nearSpace.id, listId: l.id }),
  }))

  // Position bottom items
  const bottomItems = showingLists ? listZones : actionZones
  const bottomPad = W / (bottomItems.length + 1)
  const bottomZones = bottomItems.map((z, i) => ({ ...z, x: bottomPad * (i + 1), y: H - 130 }))

  const allZones = [...spaceZones, ...bottomZones]
  const allZonesRef = useRef(allZones)
  allZonesRef.current = allZones

  const hitTest = (x, y, extra = 0) => {
    for (const z of allZonesRef.current) {
      if (Math.sqrt((x - z.x) ** 2 + (y - z.y) ** 2) < (z.r || 35) + extra) return z.id
    }
    return null
  }

  useEffect(() => {
    setTimeout(() => setEntered(true), 20)
    const move = (e) => {
      e.preventDefault()
      const t = e.touches[0]; const now = Date.now()
      touchHistory.current.push({ x: t.clientX, y: t.clientY, t: now })
      if (touchHistory.current.length > 5) touchHistory.current.shift()
      const h = touchHistory.current
      if (h.length >= 2) {
        const f = h[0], l = h[h.length-1], dt = (l.t - f.t) / 1000
        if (dt > 0) { velX.current = (l.x - f.x) / dt; velY.current = (l.y - f.y) / dt }
      }
      px.current = t.clientX; py.current = t.clientY

      // Detect nearest space when in upper half
      if (py.current < MID) {
        let nearest = null, nearD = 200
        for (const z of spaceZones) {
          const d = Math.abs(px.current - z.x)
          if (d < nearD) { nearest = z.id; nearD = d }
        }
        setNearSpaceId(nearest)
      } else {
        setNearSpaceId(null)
      }

      const hit = hitTest(px.current, py.current)
      hoveredRef.current = hit
      setHovered(hit)
      rerender(n => n + 1)
    }

    const flyTo = (z) => {
      setFlying({ x: z.x, y: z.y })
      if (navigator.vibrate) navigator.vibrate(8)
      setTimeout(() => { z.action(); setTimeout(onDone, 100) }, 280)
    }

    const end = () => {
      if (flying) return
      const az = allZonesRef.current
      const cur = hoveredRef.current
      if (cur) { const z = az.find(z => z.id === cur); if (z) { flyTo(z); return } }
      const speed = Math.sqrt(velX.current ** 2 + velY.current ** 2)
      if (speed > 150) {
        const projT = Math.min(0.5, 200 / Math.max(speed, 1))
        const pX = px.current + velX.current * projT, pY = py.current + velY.current * projT
        let best = null, bestD = 150
        for (const z of az) { const d = Math.sqrt((pX-z.x)**2+(pY-z.y)**2); if (d<bestD) { best=z; bestD=d } }
        if (best) { flyTo(best); return }
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
        left: z.x - 30, top: z.y - 30, width: 60,
        opacity: entered ? 1 : 0,
        transform: entered ? 'scale(1)' : 'scale(0.4)',
        transition: `all 350ms cubic-bezier(0.34,1.56,0.64,1) ${delay}ms`,
      }}>
        <div style={{
          width: h ? 58 : 50, height: h ? 58 : 50,
          borderRadius: h ? 18 : 14,
          background: h ? z.color : 'rgba(255,255,255,0.07)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: typeof z.icon === 'string' ? 20 : 16, color: 'white',
          boxShadow: h ? `0 0 24px ${z.color}50` : '0 2px 8px rgba(0,0,0,0.2)',
          transition: 'all 200ms cubic-bezier(0.16,1,0.3,1)',
          border: `2px solid ${h ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.06)'}`,
        }}>
          {typeof z.icon === 'string' ? z.icon : z.icon}
        </div>
        <span style={{ fontSize: 9, fontWeight: 600, marginTop: 4, color: h ? '#fff' : 'var(--text-ghost)', transition: 'color 150ms', whiteSpace: 'nowrap' }}>{z.label}</span>
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

      {/* Top: Spaces */}
      {spaceZones.map((z, i) => renderZone(z, i * 40))}

      {/* Hint: which space's lists are showing */}
      {showingLists && nearSpace && entered && (
        <div className="animate-fade-in" style={{
          position: 'absolute', left: 0, right: 0, top: H - 185,
          textAlign: 'center', fontSize: 10, fontWeight: 600,
          color: nearSpace.color, letterSpacing: '0.08em', textTransform: 'uppercase',
        }}>
          {nearSpace.name} lists
        </div>
      )}

      {/* Bottom: actions OR lists (swap based on proximity to spaces) */}
      {bottomZones.map((z, i) => renderZone(z, showingLists ? 0 : 60 + i * 30))}

      {/* Pill */}
      <div style={{
        position: 'absolute',
        left: (flying ? flying.x : px.current) - 70,
        top: (flying ? flying.y : py.current) - 18,
        width: 140, padding: '9px 14px', borderRadius: 20,
        background: hovered
          ? (allZonesRef.current.find(z => z.id === hovered)?.color || 'linear-gradient(135deg, #f472b6, #ff7b54)')
          : 'linear-gradient(135deg, #f472b6, #ff7b54)',
        boxShadow: '0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)',
        color: 'white', fontSize: 12, fontWeight: 600,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center',
        transform: (hovered || flying) ? 'scale(0.8)' : 'scale(1)',
        opacity: flying ? 0.5 : 1,
        transition: flying ? 'all 280ms cubic-bezier(0.16,1,0.3,1)' : 'transform 200ms, background 150ms',
      }}>
        {todo.text}
      </div>
    </div>,
    document.body
  )
}
