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
  const allTodos = useTodoStore((s) => s.todos)
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
  const lockedNearRef = useRef(null)
  const [entered, setEntered] = useState(false)
  const [flying, setFlying] = useState(null)
  const [listPicker, setListPicker] = useState(null) // { spaceId, lists[] } for "Other" popup
  const [, rerender] = useState(0)

  const W = window.innerWidth
  const H = window.innerHeight
  const RISE = 30

  const act = (label, data) => () => {
    const old = { spaceId: todo.spaceId, listId: todo.listId, dueDate: todo.dueDate, dueTime: todo.dueTime, type: todo.type }
    updateTodo(todo.id, data)
    showUndo(label, () => updateTodo(todo.id, old))
  }

  // Arc helper: slight curve for a row of items
  // Top row: edges drop down (toward screen center) — a smile shape
  // Bottom row: edges rise up (toward screen center) — a frown shape
  const arcY = (baseY, i, count, arcHeight, smileDown = true) => {
    if (count <= 1) return baseY
    const t = (i - (count - 1) / 2) / ((count - 1) / 2) // -1 to 1
    const offset = arcHeight * t * t // parabola, 0 at center, arcHeight at edges
    return smileDown ? baseY + offset : baseY - offset
  }

  // TOP: Spaces (edges drop down toward center)
  const spacePad = W / (spaces.length + 1)
  const spaceZones = spaces.map((s, i) => ({
    id: `sp-${s.id}`, label: s.name, color: s.color || '#a78bfa',
    x: spacePad * (i + 1), y: arcY(90, i, spaces.length, 20, true), r: 40,
    icon: <SpaceAvatar space={s} size={28} />,
    action: act(`→ ${s.name}`, { spaceId: s.id, listId: null }),
  }))

  // Determine which lists to show for near space
  const nearSpace = spaces.find(s => `sp-${s.id}` === nearSpaceId)
  const spaceLists = nearSpace ? allLists.filter(l => l.spaceId === nearSpace.id) : []
  const showingLists = spaceLists.length > 0 && !!lockedNearRef.current

  // Sort lists by recent activity (most recent todo update in that list)
  const listActivity = (list) => {
    const latest = allTodos
      .filter(t => t.listId === list.id)
      .reduce((max, t) => {
        const d = new Date(t.updatedAt || t.createdAt).getTime()
        return d > max ? d : max
      }, 0)
    return latest || new Date(list.createdAt).getTime()
  }

  const sortedLists = [...spaceLists].sort((a, b) => listActivity(b) - listActivity(a))
  const hasOverflow = sortedLists.length > 4
  const visibleLists = hasOverflow ? sortedLists.slice(0, 3) : sortedLists.slice(0, 4)
  const overflowLists = hasOverflow ? sortedLists.slice(3) : []

  const actionZones = [
    { id: 'later', label: 'Later', r: 35, color: '#60a5fa', icon: '⏰',
      action: act('Later', (() => { const n=new Date(); return { dueDate: toLocalDateStr(n), dueTime: `${String(Math.min(n.getHours()+3,21)).padStart(2,'0')}:00` } })()) },
    { id: 'tmrw', label: 'Tmrw', r: 35, color: '#a78bfa', icon: '📅',
      action: act('Tomorrow', (() => { const d=new Date(); d.setDate(d.getDate()+1); return { dueDate: toLocalDateStr(d), dueTime: null } })()) },
    { id: 'week', label: 'Next wk', r: 35, color: '#34d399', icon: '📆',
      action: act('Next week', (() => { const d=new Date(); d.setDate(d.getDate()+7); return { dueDate: toLocalDateStr(d), dueTime: null } })()) },
  ]

  const addTodo = useTodoStore((s) => s.addTodo)
  const deleteZone = { id: 'del', label: 'Delete', r: 35, color: '#ff6b6b', icon: '✕',
    x: W - 50, y: H / 2, action: () => {
      const saved = { ...todo }
      deleteTodo(todo.id)
      showUndo('Deleted', () => {
        // Re-add with original properties
        const restored = addTodo(saved.text, {
          type: saved.type, listId: saved.listId, spaceId: saved.spaceId,
          priority: saved.priority, dueDate: saved.dueDate, dueTime: saved.dueTime,
        })
        if (saved.subtasks?.length) updateTodo(restored.id, { subtasks: saved.subtasks })
      })
    } }

  const noteZone = { id: 'note', label: 'Note', r: 35, color: '#60a5fa', icon: '✎',
    x: 50, y: H / 2, action: act('→ Note', { type: 'note' }) }

  const listZones = visibleLists.map((l) => ({
    id: `list-${l.id}`, label: l.name, r: 35, color: nearSpace?.color || '#a78bfa',
    action: act(`→ ${l.name}`, { spaceId: nearSpace.id, listId: l.id }),
  }))

  // Add "Other" zone if overflow
  if (hasOverflow && nearSpace) {
    listZones.push({
      id: 'other-list', label: 'Other…', r: 35, color: 'rgba(255,255,255,0.2)', icon: '•••',
      action: () => {
        setListPicker({ spaceId: nearSpace.id, spaceName: nearSpace.name, lists: overflowLists })
      },
    })
  }

  // Position bottom items with arc (curves down at edges)
  const bottomItems = showingLists ? listZones : actionZones
  const bottomPad = W / (bottomItems.length + 1)
  const bottomZones = bottomItems.map((z, i) => ({
    ...z,
    x: bottomPad * (i + 1),
    y: arcY(H - 200, i, bottomItems.length, 18, false),
  }))

  const allZones = [...spaceZones, ...bottomZones, deleteZone, noteZone]
  const allZonesRef = useRef(allZones)
  allZonesRef.current = allZones

  const hitTest = (x, y, extra = 0) => {
    for (const z of allZonesRef.current) {
      if (Math.sqrt((x - z.x) ** 2 + (y - z.y) ** 2) < (z.r || 35) + extra) return z.id
    }
    return null
  }

  useEffect(() => {
    if (listPicker) return // pause gesture handling when picker is showing
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

      const risen = startPos.y - py.current > RISE
      if (risen && !lockedNearRef.current) {
        // Lock in the nearest space ONCE — don't change it after
        let nearest = null, nearD = Infinity
        for (const z of spaceZones) {
          const d = Math.abs(px.current - z.x)
          if (d < nearD) { nearest = z.id; nearD = d }
        }
        lockedNearRef.current = nearest
        setNearSpaceId(nearest)
      } else if (!risen && !lockedNearRef.current) {
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
      setTimeout(() => { z.action(); if (z.id !== 'other-list') setTimeout(onDone, 100) }, 280)
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

  // Handle list picker selection
  const handlePickList = (list) => {
    const old = { spaceId: todo.spaceId, listId: todo.listId }
    updateTodo(todo.id, { spaceId: listPicker.spaceId, listId: list.id })
    showUndo(`→ ${list.name}`, () => updateTodo(todo.id, old))
    onDone()
  }

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

  // List picker popup (shown after flinging to "Other…")
  if (listPicker) {
    return createPortal(
      <div className="fixed inset-0 z-50" style={{ touchAction: 'none' }}>
        <div className="absolute inset-0 animate-fade-in" style={{
          background: 'rgba(26,22,37,0.85)',
          backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        }} onClick={onDone} />
        <div className="absolute animate-slide-up" style={{
          bottom: 0, left: 0, right: 0,
          background: 'var(--bg-mid)', borderRadius: '24px 24px 0 0',
          padding: '20px 20px 40px', maxHeight: '50vh', overflowY: 'auto',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.3)',
        }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--border-visible)', margin: '0 auto 16px' }} />
          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-ghost)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
            {listPicker.spaceName} — pick a list
          </p>
          {listPicker.lists.map(l => (
            <button key={l.id} onClick={() => handlePickList(l)} className="w-full text-left" style={{
              padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)',
              fontSize: 15, fontWeight: 500, color: 'var(--text-primary)',
            }}>
              {l.name}
            </button>
          ))}
          <button onClick={onDone} className="w-full" style={{
            marginTop: 12, padding: '12px', borderRadius: 14,
            fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)',
            background: 'var(--surface-card)',
          }}>Cancel</button>
        </div>
      </div>,
      document.body
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

      {/* Top: Spaces (arc) */}
      {spaceZones.map((z, i) => renderZone(z, i * 40))}

      {/* Hint: which space's lists are showing */}
      {showingLists && nearSpace && entered && (
        <div className="animate-fade-in" style={{
          position: 'absolute', left: 0, right: 0, top: H - 255,
          textAlign: 'center', fontSize: 10, fontWeight: 600,
          color: nearSpace.color, letterSpacing: '0.08em', textTransform: 'uppercase',
        }}>
          {nearSpace.name} lists
        </div>
      )}

      {/* Bottom: actions OR lists (arc) */}
      {bottomZones.map((z, i) => renderZone(z, showingLists ? 0 : 60 + i * 30))}

      {/* Side zones */}
      {renderZone(noteZone, 70)}
      {renderZone(deleteZone, 80)}

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
