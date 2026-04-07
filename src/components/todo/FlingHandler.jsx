import { useRef, useState, useCallback } from 'react'
import BasketballMode from './BasketballMode'
import SlingshotMode from './SlingshotMode'
import PinballMode from './PinballMode'

const THRESHOLD = 60

export default function FlingHandler({ onComplete, onSwipeLeft, children, disabled }) {
  const startPos = useRef(null)
  const dragRef = useRef(null)
  const velocityHistory = useRef([])
  const itemRef = useRef(null)
  const originalRect = useRef(null)

  const [renderDrag, setRenderDrag] = useState(null)
  const [mode, setMode] = useState(null) // 'basketball' | 'slingshot' | 'pinball'
  const [modeOrigin, setModeOrigin] = useState(null)

  const reset = () => {
    dragRef.current = null
    setRenderDrag(null)
    setMode(null)
    setModeOrigin(null)
    startPos.current = null
    originalRect.current = null
  }

  const handleDone = () => { onComplete?.(); reset() }

  const onTouchStart = (e) => {
    if (disabled || mode) return
    const t = e.touches[0]
    startPos.current = { x: t.clientX, y: t.clientY }
    originalRect.current = itemRef.current?.getBoundingClientRect()
    velocityHistory.current = [{ x: t.clientX, y: t.clientY, t: Date.now() }]
    dragRef.current = { dx: 0, dy: 0 }
    setRenderDrag({ dx: 0, dy: 0 })
  }

  const onTouchMove = (e) => {
    if (!startPos.current || mode) return
    const t = e.touches[0]
    const dx = t.clientX - startPos.current.x
    const dy = t.clientY - startPos.current.y
    if (Math.sqrt(dx * dx + dy * dy) > 8) {
      e.stopPropagation()
      dragRef.current = { dx, dy }
      setRenderDrag({ dx, dy })
      velocityHistory.current.push({ x: t.clientX, y: t.clientY, t: Date.now() })
      if (velocityHistory.current.length > 6) velocityHistory.current.shift()
    }
  }

  const onTouchEnd = () => {
    const drag = dragRef.current
    if (!startPos.current || !drag) { reset(); return }

    const dist = Math.sqrt(drag.dx * drag.dx + drag.dy * drag.dy)
    if (dist < THRESHOLD) { reset(); return }

    const h = velocityHistory.current
    let velocity = 0
    const angle = Math.atan2(drag.dy, drag.dx)
    if (h.length >= 2) {
      const a = h[0], b = h[h.length - 1], dt = (b.t - a.t) / 1000
      if (dt > 0) velocity = Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2) / dt
    }

    const rect = originalRect.current
    const o = {
      x: rect ? rect.left + rect.width / 2 : startPos.current.x,
      y: rect ? rect.top + rect.height / 2 : startPos.current.y,
      width: rect?.width || 200,
      height: rect?.height || 50,
      velocity,
    }

    const dir = getDirection(angle)

    // Left swipe = snooze/delete panel (not a mini-game)
    if (dir === 'left') {
      reset()
      onSwipeLeft?.()
      return
    }

    if (navigator.vibrate) navigator.vibrate(5)
    setModeOrigin(o)
    if (dir === 'down') setMode('basketball')
    else if (dir === 'up') setMode('slingshot')
    else setMode('pinball') // right
  }

  const getDirection = (angle) => {
    const deg = (angle * 180) / Math.PI
    if (deg > -135 && deg <= -45) return 'up'
    if (deg > 45 && deg <= 135) return 'down'
    if (deg > -45 && deg <= 45) return 'right'
    return 'left'
  }

  const getStyle = () => {
    if (mode) return { transform: 'scale(0)', opacity: 0, transition: 'all 250ms ease-in' }
    if (renderDrag) {
      const d = renderDrag
      const dist = Math.sqrt(d.dx ** 2 + d.dy ** 2)
      const progress = Math.min(1, dist / THRESHOLD)
      return {
        transform: `translate(${d.dx * 0.6}px, ${d.dy * 0.4}px) rotate(${d.dx * 0.02}deg) scale(${1 - progress * 0.05})`,
        opacity: 1 - progress * 0.25,
        transition: 'none',
        zIndex: 10,
        position: 'relative',
      }
    }
    return {}
  }

  return (
    <>
      <div ref={itemRef} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} style={getStyle()}>
        {children}
      </div>
      {mode === 'basketball' && modeOrigin && <BasketballMode origin={modeOrigin} onComplete={handleDone} onCancel={reset} />}
      {mode === 'slingshot' && modeOrigin && <SlingshotMode origin={modeOrigin} onComplete={handleDone} onCancel={reset} />}
      {mode === 'pinball' && modeOrigin && <PinballMode origin={modeOrigin} onComplete={handleDone} onCancel={reset} />}
    </>
  )
}
