import { useRef, useState, useEffect, useCallback } from 'react'
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
  const addTodo = useTodoStore((s) => s.addTodo)
  const showUndo = useUiStore((s) => s.showUndo)

  const px = useRef(startPos.x)
  const py = useRef(startPos.y)
  const velX = useRef(0)
  const velY = useRef(0)
  const touchHistory = useRef([])
  const hoveredRef = useRef(null)
  const lockedSpaceId = useRef(null)
  const flyingRef = useRef(null)
  const pillRef = useRef(null)
  const lastLockedRef = useRef(null)
  const [tick, setTick] = useState(0)
  const [entered, setEntered] = useState(false)
  const [listPicker, setListPicker] = useState(null)

  const W = window.innerWidth
  const H = window.innerHeight

  const act = useCallback((label, data) => () => {
    const old = { spaceId: todo.spaceId, listId: todo.listId, dueDate: todo.dueDate, dueTime: todo.dueTime, type: todo.type }
    updateTodo(todo.id, data)
    showUndo(label, () => updateTodo(todo.id, old))
  }, [todo, updateTodo, showUndo])

  const arcY = (baseY, i, count, arcHeight, smileDown = true) => {
    if (count <= 1) return baseY
    const t = (i - (count - 1) / 2) / ((count - 1) / 2)
    const offset = arcHeight * t * t
    return smileDown ? baseY + offset : baseY - offset
  }

  // TOP: Spaces
  const spaceMargin = 30
  const spaceWidth = W - spaceMargin * 2
  const spacePad = spaces.length > 1 ? spaceWidth / (spaces.length - 1) : 0
  const spaceZones = spaces.map((s, i) => ({
    id: `sp-${s.id}`, label: s.name, color: s.color || '#a78bfa',
    x: spaces.length === 1 ? W / 2 : spaceMargin + spacePad * i,
    y: arcY(90, i, spaces.length, 30, true), r: 40,
    icon: <SpaceAvatar space={s} size={28} />,
    action: act(`→ ${s.name}`, { spaceId: s.id, listId: null }),
  }))

  // Derive lists from locked space — all based on ref, recalculated each render
  const lockedId = lockedSpaceId.current
  const nearSpace = lockedId ? spaces.find(s => `sp-${s.id}` === lockedId) : null
  const spaceLists = nearSpace ? allLists.filter(l => l.spaceId === nearSpace.id) : []
  const showingLists = spaceLists.length > 0 && !!lockedId

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

  const wallDelete = () => {
    const saved = { ...todo }
    deleteTodo(todo.id)
    showUndo('Deleted', () => {
      const restored = addTodo(saved.text, {
        type: saved.type, listId: saved.listId, spaceId: saved.spaceId,
        priority: saved.priority, dueDate: saved.dueDate, dueTime: saved.dueTime,
      })
      if (saved.subtasks?.length) updateTodo(restored.id, { subtasks: saved.subtasks })
    })
  }
  const wallNote = act('→ Note', { type: 'note' })

  const listZones = visibleLists.map((l) => ({
    id: `list-${l.id}`, label: l.name, r: 35, color: nearSpace?.color || '#a78bfa',
    action: act(`→ ${l.name}`, { spaceId: nearSpace.id, listId: l.id }),
  }))

  if (hasOverflow && nearSpace) {
    listZones.push({
      id: 'other-list', label: 'Other…', r: 35, color: 'rgba(255,255,255,0.2)', icon: '•••',
      action: () => setListPicker({ spaceId: nearSpace.id, spaceName: nearSpace.name, lists: overflowLists }),
    })
  }

  // BOTTOM: spread edge-to-edge
  const bottomItems = showingLists ? listZones : actionZones
  const bottomMargin = 40
  const bottomWidth = W - bottomMargin * 2
  const bottomPadding = bottomItems.length > 1 ? bottomWidth / (bottomItems.length - 1) : 0
  const bottomZones = bottomItems.map((z, i) => ({
    ...z,
    x: bottomItems.length === 1 ? W / 2 : bottomMargin + bottomPadding * i,
    y: arcY(H - 200, i, bottomItems.length, 35, false),
  }))

  const allZones = [...spaceZones, ...bottomZones]
  const allZonesRef = useRef(allZones)
  allZonesRef.current = allZones
  const spaceZonesRef = useRef(spaceZones)
  spaceZonesRef.current = spaceZones

  // Stable refs for callbacks
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone
  const wallDeleteRef = useRef(wallDelete)
  wallDeleteRef.current = wallDelete
  const wallNoteRef = useRef(wallNote)
  wallNoteRef.current = wallNote

  const hitTest = (x, y) => {
    if (x > W - 15) return 'wall-del'
    if (x < 15) return 'wall-note'
    for (const z of allZonesRef.current) {
      if (Math.sqrt((x - z.x) ** 2 + (y - z.y) ** 2) < (z.r || 35)) return z.id
    }
    return null
  }

  useEffect(() => {
    if (listPicker) return
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

      // Only check for space lock if finger has moved upward at least 40px from start
      const hasRisen = startPos.y - py.current > 40
      if (!lockedSpaceId.current && hasRisen) {
        // Method 1: Direct proximity (within 80px of a space)
        let nearest = null, nearD = 80
        for (const z of spaceZonesRef.current) {
          const d = Math.sqrt((px.current - z.x) ** 2 + (py.current - z.y) ** 2)
          if (d < nearD) { nearest = z.id; nearD = d }
        }

        // Method 2: Moving upward? Project trajectory to find target space
        if (!nearest && velY.current < -100) {
          const projT = 0.3
          const projX = px.current + velX.current * projT
          const projY = py.current + velY.current * projT
          let bestProj = null, bestProjD = 200
          for (const z of spaceZonesRef.current) {
            const d = Math.sqrt((projX - z.x) ** 2 + (projY - z.y) ** 2)
            if (d < bestProjD) { bestProj = z.id; bestProjD = d }
          }
          if (bestProj) nearest = bestProj
        }

        if (nearest) lockedSpaceId.current = nearest
      } else {
        // Already locked — only switch if finger directly touches a different space (within 50px)
        for (const z of spaceZonesRef.current) {
          if (z.id === lockedSpaceId.current) continue
          const d = Math.sqrt((px.current - z.x) ** 2 + (py.current - z.y) ** 2)
          if (d < 50) { lockedSpaceId.current = z.id; break }
        }
      }

      const newHovered = hitTest(px.current, py.current)
      const prevHovered = hoveredRef.current
      hoveredRef.current = newHovered

      // Move pill directly via DOM — no React rerender needed
      if (pillRef.current) {
        pillRef.current.style.left = (px.current - 70) + 'px'
        pillRef.current.style.top = (py.current - 18) + 'px'

        // Update pill color for hover
        if (newHovered !== prevHovered) {
          const zone = newHovered ? allZonesRef.current.find(z => z.id === newHovered) : null
          pillRef.current.style.background = newHovered === 'wall-del' ? '#ff6b6b'
            : newHovered === 'wall-note' ? '#60a5fa'
            : zone ? zone.color
            : 'linear-gradient(135deg, #f472b6, #ff7b54)'
          pillRef.current.style.transform = newHovered ? 'scale(0.8)' : 'scale(1)'
        }
      }

      // Only trigger React rerender when hover or lock state actually changes
      if (newHovered !== prevHovered || lockedSpaceId.current !== lastLockedRef.current) {
        lastLockedRef.current = lockedSpaceId.current
        setTick(n => n + 1)
      }
    }

    const doFly = (x, y, cb) => {
      flyingRef.current = { x, y }
      if (pillRef.current) {
        pillRef.current.style.left = (x - 70) + 'px'
        pillRef.current.style.top = (y - 18) + 'px'
        pillRef.current.style.opacity = '0.5'
        pillRef.current.style.transform = 'scale(0.8)'
        pillRef.current.style.transition = 'all 280ms cubic-bezier(0.16,1,0.3,1)'
      }
      if (navigator.vibrate) navigator.vibrate(8)
      setTick(n => n + 1)
      setTimeout(() => { cb(); setTimeout(() => onDoneRef.current(), 100) }, 280)
    }

    const end = () => {
      if (flyingRef.current) return
      const az = allZonesRef.current
      const cur = hoveredRef.current

      // Wall zones
      if (cur === 'wall-del' && velX.current > 200) {
        doFly(W + 50, py.current, () => wallDeleteRef.current()); return
      }
      if (cur === 'wall-note' && velX.current < -200) {
        doFly(-50, py.current, () => wallNoteRef.current()); return
      }
      if (cur === 'wall-del' || cur === 'wall-note') { onDoneRef.current(); return }

      // Regular zones — direct hover
      if (cur) {
        const z = az.find(z => z.id === cur)
        if (z) { doFly(z.x, z.y, z.action); return }
      }

      // Fling projection
      const speed = Math.sqrt(velX.current ** 2 + velY.current ** 2)
      if (speed > 150) {
        const projT = Math.min(0.5, 200 / Math.max(speed, 1))
        const pX = px.current + velX.current * projT
        const pY = py.current + velY.current * projT

        if (pX > W && velX.current > 200) { doFly(W + 50, py.current, () => wallDeleteRef.current()); return }
        if (pX < 0 && velX.current < -200) { doFly(-50, py.current, () => wallNoteRef.current()); return }

        let best = null, bestD = 150
        for (const z of az) {
          const d = Math.sqrt((pX - z.x) ** 2 + (pY - z.y) ** 2)
          if (d < bestD) { best = z; bestD = d }
        }
        if (best) { doFly(best.x, best.y, best.action); return }
      }
      onDoneRef.current()
    }

    document.addEventListener('touchmove', move, { passive: false })
    document.addEventListener('touchend', end)
    return () => { document.removeEventListener('touchmove', move); document.removeEventListener('touchend', end) }
  }, [listPicker])

  const handlePickList = (list) => {
    const old = { spaceId: todo.spaceId, listId: todo.listId }
    updateTodo(todo.id, { spaceId: listPicker.spaceId, listId: list.id })
    showUndo(`→ ${list.name}`, () => updateTodo(todo.id, old))
    onDone()
  }

  // Read current state from refs for rendering
  const hovered = hoveredRef.current
  const flying = flyingRef.current
  const isNearRight = hovered === 'wall-del'
  const isNearLeft = hovered === 'wall-note'

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
            }}>{l.name}</button>
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

      {/* Left wall — Note */}
      <div style={{
        position: 'absolute', left: 0, top: '35%', bottom: '35%', width: 3, borderRadius: '0 3px 3px 0',
        background: isNearLeft ? '#60a5fa' : 'rgba(96,165,250,0.15)',
        boxShadow: isNearLeft ? '0 0 12px rgba(96,165,250,0.4)' : 'none',
        transition: 'all 200ms', opacity: entered ? 1 : 0,
      }} />
      {isNearLeft && entered && (
        <div style={{
          position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
          fontSize: 9, fontWeight: 600, color: '#60a5fa', letterSpacing: '0.05em',
          writingMode: 'vertical-rl', textOrientation: 'mixed',
        }}>Note</div>
      )}

      {/* Right wall — Delete */}
      <div style={{
        position: 'absolute', right: 0, top: '35%', bottom: '35%', width: 3, borderRadius: '3px 0 0 3px',
        background: isNearRight ? '#ff6b6b' : 'rgba(255,107,107,0.15)',
        boxShadow: isNearRight ? '0 0 12px rgba(255,107,107,0.4)' : 'none',
        transition: 'all 200ms', opacity: entered ? 1 : 0,
      }} />
      {isNearRight && entered && (
        <div style={{
          position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
          fontSize: 9, fontWeight: 600, color: '#ff6b6b', letterSpacing: '0.05em',
          writingMode: 'vertical-rl', textOrientation: 'mixed',
        }}>Delete</div>
      )}

      {/* Top: Spaces */}
      {spaceZones.map((z, i) => renderZone(z, i * 40))}

      {/* Hint: space name when lists showing */}
      {showingLists && nearSpace && entered && (
        <div className="animate-fade-in" style={{
          position: 'absolute', left: 0, right: 0, top: H - 255,
          textAlign: 'center', fontSize: 10, fontWeight: 600,
          color: nearSpace.color, letterSpacing: '0.08em', textTransform: 'uppercase',
        }}>
          {nearSpace.name} lists
        </div>
      )}

      {/* Bottom: actions OR lists */}
      {bottomZones.map((z, i) => renderZone(z, showingLists ? 0 : 60 + i * 30))}

      {/* Pill — position driven by DOM, not React state */}
      <div ref={pillRef} style={{
        position: 'absolute',
        left: (flying ? flying.x : px.current) - 70,
        top: (flying ? flying.y : py.current) - 18,
        width: 140, padding: '9px 14px', borderRadius: 20,
        background: 'linear-gradient(135deg, #f472b6, #ff7b54)',
        boxShadow: '0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)',
        color: 'white', fontSize: 12, fontWeight: 600,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center',
        transform: 'scale(1)',
        opacity: flying ? 0.5 : 1,
        transition: flying ? 'all 280ms cubic-bezier(0.16,1,0.3,1)' : 'transform 150ms, background 100ms',
        willChange: 'left, top',
      }}>
        {todo.text}
      </div>
    </div>,
    document.body
  )
}
