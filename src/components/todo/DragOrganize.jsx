import { useRef, useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useSpaceStore } from '../../stores/spaceStore'
import { useListStore } from '../../stores/listStore'
import { useTodoStore } from '../../stores/todoStore'
import { useUiStore } from '../../stores/uiStore'
import { toLocalDateStr } from '../../lib/utils'
import SpaceAvatar from '../common/SpaceAvatar'

export default function DragOrganize({ todo, todos: todosArr, startPos, onDone }) {
  const todos = todosArr || (todo ? [todo] : [])
  const isMulti = todos.length > 1
  const primaryTodo = todos[0]

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
  const rafRef = useRef(null)
  const scaleRef = useRef(1)
  const zoneRefs = useRef({})
  const wallLeftRef = useRef(null)
  const wallRightRef = useRef(null)
  const labelLeftRef = useRef(null)
  const labelRightRef = useRef(null)
  const [tick, setTick] = useState(0)
  const [entered, setEntered] = useState(false)
  const [listPicker, setListPicker] = useState(null)

  const W = window.innerWidth
  const H = window.innerHeight

  const act = useCallback((label, data) => () => {
    const olds = todos.map(t => ({ id: t.id, spaceId: t.spaceId, listId: t.listId, dueDate: t.dueDate, dueTime: t.dueTime, type: t.type }))
    for (const t of todos) updateTodo(t.id, data)
    showUndo(isMulti ? `${todos.length} tasks: ${label}` : label, () => { for (const o of olds) updateTodo(o.id, o) })
  }, [todos, isMulti, updateTodo, showUndo])

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

  // Derive lists from locked space
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
      action: act('Later', (() => {
        const n = new Date(); const date = toLocalDateStr(n)
        let h = Math.min(n.getHours() + 3, 21), m = 0
        const todoIds = new Set(todos.map(t => t.id))
        const taken = new Set(allTodos.filter(t => t.status === 'active' && t.dueDate === date && !todoIds.has(t.id)).map(t => t.dueTime).filter(Boolean))
        while (taken.has(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`)) { m += 15; if (m >= 60) { h++; m = 0 }; if (h > 23) break }
        return { dueDate: date, dueTime: `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}` }
      })()) },
    { id: 'tmrw', label: 'Tmrw', r: 35, color: '#a78bfa', icon: '📅',
      action: act('Tomorrow', (() => { const d=new Date(); d.setDate(d.getDate()+1); return { dueDate: toLocalDateStr(d), dueTime: null } })()) },
    { id: 'week', label: 'Next wk', r: 35, color: '#34d399', icon: '📆',
      action: act('Next week', (() => { const d=new Date(); d.setDate(d.getDate()+7); return { dueDate: toLocalDateStr(d), dueTime: null } })()) },
  ]

  const wallDelete = () => {
    const savedAll = todos.map(t => ({ ...t }))
    for (const t of todos) deleteTodo(t.id)
    showUndo(isMulti ? `Deleted ${todos.length}` : 'Deleted', () => {
      for (const saved of savedAll) {
        const restored = addTodo(saved.text, {
          type: saved.type, listId: saved.listId, spaceId: saved.spaceId,
          priority: saved.priority, dueDate: saved.dueDate, dueTime: saved.dueTime,
        })
        if (saved.subtasks?.length) updateTodo(restored.id, { subtasks: saved.subtasks })
      }
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

  // Direct DOM update for zone hover — no React re-render needed
  const updateZoneHover = (zoneId, isHovered) => {
    const el = zoneRefs.current[zoneId]
    if (!el) return
    const inner = el.firstChild
    const label = el.lastChild
    const zone = allZonesRef.current.find(z => z.id === zoneId)
    if (!zone) return
    if (isHovered) {
      inner.style.width = '58px'; inner.style.height = '58px'
      inner.style.borderRadius = '18px'
      inner.style.background = zone.color
      inner.style.boxShadow = `0 0 24px ${zone.color}50`
      inner.style.borderColor = 'rgba(255,255,255,0.25)'
      label.style.color = '#fff'
    } else {
      inner.style.width = '50px'; inner.style.height = '50px'
      inner.style.borderRadius = '14px'
      inner.style.background = 'rgba(255,255,255,0.12)'
      inner.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)'
      inner.style.borderColor = 'rgba(255,255,255,0.06)'
      label.style.color = 'rgba(255,255,255,0.55)'
    }
  }

  const updateWalls = (nearLeft, nearRight) => {
    if (wallLeftRef.current) {
      wallLeftRef.current.style.background = nearLeft ? '#60a5fa' : 'rgba(96,165,250,0.1)'
      wallLeftRef.current.style.boxShadow = nearLeft ? '0 0 14px rgba(96,165,250,0.5)' : 'none'
    }
    if (wallRightRef.current) {
      wallRightRef.current.style.background = nearRight ? '#ff6b6b' : 'rgba(255,107,107,0.1)'
      wallRightRef.current.style.boxShadow = nearRight ? '0 0 14px rgba(255,107,107,0.5)' : 'none'
    }
    if (labelLeftRef.current) labelLeftRef.current.style.opacity = nearLeft ? '1' : '0'
    if (labelRightRef.current) labelRightRef.current.style.opacity = nearRight ? '1' : '0'
  }

  useEffect(() => {
    if (listPicker) return
    setTimeout(() => setEntered(true), 20)

    // Track last 4 positions for velocity (reuse array, no allocations)
    const hist = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] // x,y,t * 4
    let histIdx = 0, histLen = 0

    const move = (e) => {
      e.preventDefault()
      const t = e.touches[0]
      px.current = t.clientX
      py.current = t.clientY

      // Store in ring buffer (no object allocation)
      const i = (histIdx % 4) * 3
      hist[i] = t.clientX; hist[i + 1] = t.clientY; hist[i + 2] = Date.now()
      histIdx++; if (histLen < 4) histLen++

      // Batch ALL visual updates into a single RAF
      if (rafRef.current) return
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null

        // Move pill
        if (pillRef.current) {
          pillRef.current.style.transform = `translate3d(${px.current - 70}px, ${py.current - 18}px, 0) scale(${scaleRef.current})`
        }

        // Velocity from ring buffer
        if (histLen >= 2) {
          const oldest = ((histIdx - histLen) % 4 + 4) % 4 * 3
          const newest = ((histIdx - 1) % 4 + 4) % 4 * 3
          const dt = (hist[newest + 2] - hist[oldest + 2]) / 1000
          if (dt > 0) {
            velX.current = (hist[newest] - hist[oldest]) / dt
            velY.current = (hist[newest + 1] - hist[oldest + 1]) / dt
          }
        }

        // Space lock detection
        const hasRisen = startPos.y - py.current > 40
        if (!lockedSpaceId.current && hasRisen) {
          let nearest = null, nearD = 80
          for (const z of spaceZonesRef.current) {
            const dx = px.current - z.x, dy = py.current - z.y
            const d = Math.sqrt(dx * dx + dy * dy)
            if (d < nearD) { nearest = z.id; nearD = d }
          }
          if (!nearest && velY.current < -100) {
            const projX = px.current + velX.current * 0.3
            const projY = py.current + velY.current * 0.3
            for (const z of spaceZonesRef.current) {
              const dx = projX - z.x, dy = projY - z.y
              const d = Math.sqrt(dx * dx + dy * dy)
              if (d < 200 && (!nearest || d < nearD)) { nearest = z.id; nearD = d }
            }
          }
          if (nearest) lockedSpaceId.current = nearest
        } else if (lockedSpaceId.current) {
          for (const z of spaceZonesRef.current) {
            if (z.id === lockedSpaceId.current) continue
            const dx = px.current - z.x, dy = py.current - z.y
            if (Math.sqrt(dx * dx + dy * dy) < 50) { lockedSpaceId.current = z.id; break }
          }
        }

        const newHovered = hitTest(px.current, py.current)
        const prevHovered = hoveredRef.current
        hoveredRef.current = newHovered

        if (newHovered !== prevHovered) {
          if (prevHovered && prevHovered !== 'wall-del' && prevHovered !== 'wall-note') updateZoneHover(prevHovered, false)
          if (newHovered && newHovered !== 'wall-del' && newHovered !== 'wall-note') updateZoneHover(newHovered, true)
          updateWalls(newHovered === 'wall-note', newHovered === 'wall-del')

          if (pillRef.current) {
            const zone = newHovered ? allZonesRef.current.find(z => z.id === newHovered) : null
            pillRef.current.style.background = newHovered === 'wall-del' ? '#ff6b6b'
              : newHovered === 'wall-note' ? '#60a5fa'
              : zone ? zone.color
              : 'linear-gradient(135deg, #f472b6, #ff7b54)'
            scaleRef.current = newHovered ? 0.8 : 1
            pillRef.current.style.transform = `translate3d(${px.current - 70}px, ${py.current - 18}px, 0) scale(${scaleRef.current})`
          }
        }

        if (lockedSpaceId.current !== lastLockedRef.current) {
          lastLockedRef.current = lockedSpaceId.current
          setTick(n => n + 1)
        }
      })
    }

    const doFly = (x, y, cb) => {
      flyingRef.current = { x, y }
      if (pillRef.current) {
        pillRef.current.style.transition = 'all 280ms cubic-bezier(0.16,1,0.3,1)'
        pillRef.current.style.transform = `translate3d(${x - 70}px, ${y - 18}px, 0) scale(0.8)`
        pillRef.current.style.opacity = '0.5'
      }
      if (navigator.vibrate) navigator.vibrate(8)
      setTimeout(() => { cb(); setTimeout(() => onDoneRef.current(), 100) }, 280)
    }

    const end = () => {
      if (flyingRef.current) return
      const az = allZonesRef.current
      const cur = hoveredRef.current

      // Wall zones — works on hover release OR fling
      if (cur === 'wall-del') {
        doFly(W + 50, py.current, () => wallDeleteRef.current()); return
      }
      if (cur === 'wall-note') {
        doFly(-50, py.current, () => wallNoteRef.current()); return
      }

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

        // Fling to note (left) still works, but delete requires drag-to-wall only
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
    return () => { document.removeEventListener('touchmove', move); document.removeEventListener('touchend', end); if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [listPicker])

  const handlePickList = (list) => {
    const olds = todos.map(t => ({ id: t.id, spaceId: t.spaceId, listId: t.listId }))
    for (const t of todos) updateTodo(t.id, { spaceId: listPicker.spaceId, listId: list.id })
    showUndo(`→ ${list.name}`, () => { for (const o of olds) updateTodo(o.id, o) })
    onDone()
  }

  const setZoneRef = (id) => (el) => { if (el) zoneRefs.current[id] = el }

  const renderZone = (z, delay = 0) => (
    <div key={z.id} ref={setZoneRef(z.id)}
      className="absolute flex flex-col items-center" style={{
        left: z.x - 30, top: z.y - 30, width: 60,
        opacity: entered ? 1 : 0,
        transition: entered ? 'none' : `opacity 250ms ${delay}ms`,
      }}>
      <div style={{
        width: 50, height: 50,
        borderRadius: 14,
        background: 'rgba(255,255,255,0.12)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: typeof z.icon === 'string' ? 20 : 16, color: 'white',
        border: '2px solid rgba(255,255,255,0.06)',
      }}>
        {z.icon}
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, marginTop: 5, color: 'rgba(255,255,255,0.55)', whiteSpace: 'nowrap' }}>{z.label}</span>
    </div>
  )

  if (listPicker) {
    return createPortal(
      <div className="fixed inset-0 z-50" style={{ touchAction: 'none' }}>
        <div className="absolute inset-0 animate-fade-in" style={{
          background: 'rgba(26,22,37,0.92)',
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
    <div className="fixed inset-0 z-50" style={{ touchAction: 'none' }}>
      {/* Overlay — solid dark, NO backdrop-filter blur (kills frame rate) */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'rgba(20,16,30,0.88)',
        opacity: entered ? 1 : 0, transition: 'opacity 200ms',
      }} />

      {/* Left wall — Note */}
      <div ref={wallLeftRef} style={{
        position: 'absolute', left: 0, top: '42%', bottom: '42%', width: 3, borderRadius: '0 3px 3px 0',
        background: 'rgba(96,165,250,0.1)',
        transition: 'background 150ms, box-shadow 150ms', opacity: entered ? 1 : 0,
      }} />
      <div ref={labelLeftRef} style={{
        position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
        fontSize: 11, fontWeight: 600, color: '#60a5fa', letterSpacing: '0.05em',
        writingMode: 'vertical-rl', textOrientation: 'mixed',
        opacity: 0, transition: 'opacity 100ms',
      }}>Note</div>

      {/* Right wall — Delete */}
      <div ref={wallRightRef} style={{
        position: 'absolute', right: 0, top: '42%', bottom: '42%', width: 3, borderRadius: '3px 0 0 3px',
        background: 'rgba(255,107,107,0.1)',
        transition: 'background 150ms, box-shadow 150ms', opacity: entered ? 1 : 0,
      }} />
      <div ref={labelRightRef} style={{
        position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
        fontSize: 11, fontWeight: 600, color: '#ff6b6b', letterSpacing: '0.05em',
        writingMode: 'vertical-rl', textOrientation: 'mixed',
        opacity: 0, transition: 'opacity 100ms',
      }}>Delete</div>

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

      {/* Pill — GPU-composited transform only */}
      <div ref={pillRef} style={{
        position: 'absolute', left: 0, top: 0,
        transform: `translate3d(${px.current - 70}px, ${py.current - 18}px, 0)`,
        width: 140, padding: '9px 14px', borderRadius: 20,
        background: 'linear-gradient(135deg, #f472b6, #ff7b54)',
        color: 'white', fontSize: 12, fontWeight: 600,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center',
        willChange: 'transform',
      }}>
        {isMulti ? `${todos.length} tasks` : primaryTodo.text}
      </div>
    </div>,
    document.body
  )
}
