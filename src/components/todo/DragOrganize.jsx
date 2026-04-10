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
  const lists = useListStore((s) => s.lists)
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
  const zonesRef = useRef([])

  const W = window.innerWidth
  const H = window.innerHeight

  // Build zones from DOM positions after render
  const registerZone = (id, el, action, color) => {
    if (!el) return
    const r = el.getBoundingClientRect()
    const existing = zonesRef.current.find(z => z.id === id)
    const zone = { id, x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height, action, color }
    if (existing) Object.assign(existing, zone)
    else zonesRef.current.push(zone)
  }

  const hitTest = (x, y) => {
    for (const z of zonesRef.current) {
      if (Math.abs(x - z.x) < z.w / 2 + 10 && Math.abs(y - z.y) < z.h / 2 + 10) return z.id
    }
    return null
  }

  const triggerZone = (id) => {
    const z = zonesRef.current.find(z => z.id === id)
    if (!z) return
    emitExplosion(z.x, z.y, 400, 10)
    if (navigator.vibrate) navigator.vibrate(12)
    z.action()
  }

  useEffect(() => {
    setTimeout(() => setEntered(true), 30)
    const move = (e) => {
      e.preventDefault()
      const t = e.touches[0]
      const now = Date.now()
      const dt = (now - lastT.current.t) / 1000
      if (dt > 0) { velX.current = (t.clientX - lastT.current.x) / dt; velY.current = (t.clientY - lastT.current.y) / dt }
      lastT.current = { x: t.clientX, y: t.clientY, t: now }
      px.current = t.clientX; py.current = t.clientY
      setHovered(hitTest(px.current, py.current))
      rerender(n => n + 1)
    }
    const end = () => {
      if (hovered) { triggerZone(hovered); onDone(); return }
      const speed = Math.sqrt(velX.current ** 2 + velY.current ** 2)
      if (speed > 500) {
        const pX = px.current + velX.current * 0.2, pY = py.current + velY.current * 0.2
        const hit = hitTest(pX, pY)
        if (hit) { triggerZone(hit); onDone(); return }
      }
      onDone()
    }
    document.addEventListener('touchmove', move, { passive: false })
    document.addEventListener('touchend', end)
    return () => { document.removeEventListener('touchmove', move); document.removeEventListener('touchend', end) }
  })

  // Actions
  const makeAction = (type, data) => () => {
    const old = { spaceId: todo.spaceId, listId: todo.listId, dueDate: todo.dueDate, dueTime: todo.dueTime, type: todo.type }
    updateTodo(todo.id, data)
    showUndo(type, () => updateTodo(todo.id, old))
  }

  const h = hovered

  const overlay = (
    <div className="fixed inset-0 z-50" style={{ touchAction: 'none', pointerEvents: 'none' }}>
      {/* Backdrop */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'rgba(26,22,37,0.85)',
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        opacity: entered ? 1 : 0, transition: 'opacity 200ms',
      }} />

      {/* === DESTINATION SHELF === */}
      <div style={{
        position: 'absolute', top: 60, left: 16, right: 16,
        opacity: entered ? 1 : 0, transform: entered ? 'translateY(0)' : 'translateY(-20px)',
        transition: 'all 350ms cubic-bezier(0.16,1,0.3,1)',
      }}>
        {/* Space cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {spaces.map((s) => {
            const spaceLists = lists.filter(l => l.spaceId === s.id)
            return (
              <div key={s.id} style={{
                background: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: '10px 14px',
                boxShadow: '0 0 0 1px rgba(255,255,255,0.06)',
              }}>
                {/* Space header — drop target */}
                <div ref={el => registerZone(`sp-${s.id}`, el, makeAction(`→ ${s.name}`, { spaceId: s.id, listId: null }), s.color)}
                  className="flex items-center gap-3" style={{
                    padding: '8px 10px', borderRadius: 12, marginBottom: spaceLists.length ? 6 : 0,
                    background: h === `sp-${s.id}` ? (s.color || 'var(--accent-lavender)') : 'transparent',
                    boxShadow: h === `sp-${s.id}` ? `0 0 20px ${s.color || '#a78bfa'}50` : 'none',
                    transition: 'all 200ms cubic-bezier(0.16,1,0.3,1)',
                    transform: h === `sp-${s.id}` ? 'scale(1.02)' : 'scale(1)',
                  }}>
                  <SpaceAvatar space={s} size={28} />
                  <span style={{ fontSize: 15, fontWeight: 600, color: h === `sp-${s.id}` ? 'white' : 'var(--text-primary)' }}>{s.name}</span>
                </div>

                {/* Lists */}
                {spaceLists.length > 0 && (
                  <div className="flex gap-2 flex-wrap" style={{ paddingLeft: 4 }}>
                    {spaceLists.map(l => (
                      <div key={l.id} ref={el => registerZone(`list-${l.id}`, el, makeAction(`→ ${l.name}`, { spaceId: s.id, listId: l.id }), s.color)}
                        style={{
                          padding: '6px 14px', borderRadius: 10, fontSize: 12, fontWeight: 500,
                          background: h === `list-${l.id}` ? (s.color || 'var(--accent-lavender)') : 'rgba(255,255,255,0.04)',
                          color: h === `list-${l.id}` ? 'white' : 'var(--text-secondary)',
                          boxShadow: h === `list-${l.id}` ? `0 0 16px ${s.color || '#a78bfa'}40` : 'none',
                          transition: 'all 200ms cubic-bezier(0.16,1,0.3,1)',
                          transform: h === `list-${l.id}` ? 'scale(1.05)' : 'scale(1)',
                        }}>
                        {l.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* === ACTION BAR === */}
      <div style={{
        position: 'absolute', bottom: 80, left: 16, right: 16,
        display: 'flex', gap: 8,
        opacity: entered ? 1 : 0, transform: entered ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 400ms cubic-bezier(0.16,1,0.3,1) 100ms',
      }}>
        {[
          { id: 'later', label: 'Later', icon: '⏰', color: '#60a5fa',
            action: makeAction('Later', (() => { const n=new Date(); return { dueDate: toLocalDateStr(n), dueTime: `${String(Math.min(n.getHours()+3,21)).padStart(2,'0')}:00` } })()) },
          { id: 'tmrw', label: 'Tmrw', icon: '📅', color: '#a78bfa',
            action: makeAction('Tomorrow', (() => { const d=new Date(); d.setDate(d.getDate()+1); return { dueDate: toLocalDateStr(d), dueTime: null } })()) },
          { id: 'note', label: 'Note', icon: '✎', color: '#60a5fa',
            action: makeAction('→ Note', { type: 'note' }) },
          { id: 'del', label: 'Delete', icon: '✕', color: '#ff6b6b',
            action: () => deleteTodo(todo.id) },
        ].map(a => (
          <div key={a.id} ref={el => registerZone(a.id, el, a.action, a.color)}
            className="flex-1 flex flex-col items-center justify-center gap-1"
            style={{
              height: 60, borderRadius: 14,
              background: h === a.id ? a.color : 'rgba(255,255,255,0.06)',
              boxShadow: h === a.id ? `0 0 20px ${a.color}50` : 'none',
              transition: 'all 200ms cubic-bezier(0.16,1,0.3,1)',
              transform: h === a.id ? 'scale(1.05)' : 'scale(1)',
              border: `1px solid ${h === a.id ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.04)'}`,
            }}>
            <span style={{ fontSize: 18 }}>{a.icon}</span>
            <span style={{ fontSize: 9, fontWeight: 600, color: h === a.id ? 'white' : 'var(--text-ghost)' }}>{a.label}</span>
          </div>
        ))}
      </div>

      {/* === FLOATING PILL === */}
      <div style={{
        position: 'absolute',
        left: px.current - 80, top: py.current - 22,
        width: 160, padding: '10px 16px',
        borderRadius: 22,
        background: hovered
          ? (zonesRef.current.find(z => z.id === hovered)?.color || 'linear-gradient(135deg, #f472b6, #ff7b54)')
          : 'linear-gradient(135deg, #f472b6, #ff7b54)',
        boxShadow: '0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)',
        color: 'white', fontSize: 13, fontWeight: 600,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center',
        transform: hovered ? 'scale(0.88)' : 'scale(1)',
        transition: 'transform 200ms cubic-bezier(0.16,1,0.3,1), background 150ms, border-radius 150ms',
      }}>
        {todo.text}
      </div>
    </div>
  )

  return createPortal(overlay, document.body)
}
