import { useState, useRef, useEffect } from 'react'
import { emitExplosion, emitStarburst } from './ParticleCanvas'

const GRAVITY = 0.55
const BOUNCE = 0.68
const WALL_BOUNCE = 0.5
const BALL_SIZE = 48
const RIM_WIDTH = 90
const FLOOR_OFFSET = 0.72

export default function BasketballMode({ origin, onComplete, onCancel }) {
  const [, forceRender] = useState(0)
  const rerender = () => forceRender((n) => n + 1)

  const phase = useRef('morph')
  const morphT = useRef(0)
  const morphStart = useRef(null)

  const px = useRef(origin.x)
  const py = useRef(origin.y)
  const vx = useRef(0)
  const vy = useRef(3)
  const spin = useRef(0)
  const sqX = useRef(1)
  const sqY = useRef(1)

  const isDragging = useRef(false)
  const touches = useRef([])
  const frameId = useRef(null)
  const overlayRef = useRef(null)

  const W = useRef(window.innerWidth)
  const H = useRef(window.innerHeight)
  const FLOOR = useRef(H.current * FLOOR_OFFSET)
  const hoopX = W.current / 2
  const hoopY = 110
  const done = useRef(false)

  // Main physics loop
  useEffect(() => {
    done.current = false
    px.current = origin.x
    py.current = origin.y
    vx.current = 0

    if (origin.skipMorph) {
      // Ball already exists — wait for user to grab it, no auto-bounce
      phase.current = 'waiting'
      morphT.current = 1
      vy.current = 0
    } else {
      phase.current = 'morph'
      morphT.current = 0
      morphStart.current = null
      const swipeSpeed = origin.velocity || 0
      vy.current = Math.max(3, Math.min(20, swipeSpeed / 150))
    }

    const tick = (ts) => {
      if (done.current) return
      frameId.current = requestAnimationFrame(tick)

      const p = phase.current

      if (p === 'morph') {
        if (!morphStart.current) morphStart.current = ts
        morphT.current = Math.min(1, (ts - morphStart.current) / 400)
        vy.current += GRAVITY * 0.4
        py.current += vy.current
        if (py.current > FLOOR.current) {
          py.current = FLOOR.current
          vy.current = -vy.current * BOUNCE
          if (navigator.vibrate) navigator.vibrate(4)
          sqX.current = 1.25; sqY.current = 0.75
          setTimeout(() => { sqX.current = 1; sqY.current = 1 }, 90)
        }
        if (morphT.current >= 1) {
          phase.current = 'play'
          vy.current = Math.abs(vy.current) > 2 ? vy.current : 3
        }
        rerender()
        return
      }

      // Waiting — ball sits still until grabbed
      if (p === 'waiting') {
        rerender()
        return
      }

      if (p === 'play') {
        if (isDragging.current) { rerender(); return }
        vy.current += GRAVITY
        px.current += vx.current
        py.current += vy.current
        spin.current += vx.current * 2
        if (py.current >= FLOOR.current) {
          py.current = FLOOR.current
          const impact = Math.abs(vy.current)
          vy.current = -vy.current * BOUNCE
          vx.current *= 0.85
          if (impact > 2) {
            if (navigator.vibrate) navigator.vibrate(Math.min(8, Math.floor(impact)))
            const s = Math.min(0.35, impact * 0.02)
            sqX.current = 1 + s; sqY.current = 1 - s
            setTimeout(() => { sqX.current = 1; sqY.current = 1 }, 80)
          }
          if (Math.abs(vy.current) < 2.5) vy.current = -9
        }
        if (px.current < BALL_SIZE / 2) { px.current = BALL_SIZE / 2; vx.current = -vx.current * WALL_BOUNCE }
        if (px.current > W.current - BALL_SIZE / 2) { px.current = W.current - BALL_SIZE / 2; vx.current = -vx.current * WALL_BOUNCE }
        if (Math.abs(vy.current) > 8 && py.current < FLOOR.current - 10) {
          const s = Math.min(0.12, Math.abs(vy.current) * 0.004)
          sqX.current = 1 - s * 0.5; sqY.current = 1 + s
        }
        rerender()
        return
      }

      if (p === 'shot') {
        vy.current += GRAVITY * 0.65
        px.current += vx.current
        py.current += vy.current
        spin.current += vx.current * 3
        const spd = Math.sqrt(vx.current ** 2 + vy.current ** 2)
        if (spd > 4) {
          const s = Math.min(0.1, spd * 0.003)
          sqX.current = 1 - s * 0.3; sqY.current = 1 + s
        } else { sqX.current = 1; sqY.current = 1 }
        const atHoopHeight = Math.abs(py.current - (hoopY + 24)) < 12
        const fallingDown = vy.current > 0
        const aligned = Math.abs(px.current - hoopX) < RIM_WIDTH / 2.2
        if (atHoopHeight && fallingDown && aligned) {
          phase.current = 'swish'
          setTimeout(() => doScore(px.current, hoopY + 30), 250)
          rerender(); return
        }
        const nearRim = Math.abs(py.current - hoopY) < 15
        const hitsRim = nearRim && vy.current > 0 && Math.abs(px.current - hoopX) > RIM_WIDTH / 2.5 && Math.abs(px.current - hoopX) < RIM_WIDTH / 1.5
        if (hitsRim) {
          vy.current = -vy.current * 0.5
          vx.current += (px.current > hoopX ? 2 : -2)
          if (navigator.vibrate) navigator.vibrate(6)
        }
        if (px.current < BALL_SIZE / 2) { px.current = BALL_SIZE / 2; vx.current = -vx.current * 0.6; if (navigator.vibrate) navigator.vibrate(4) }
        if (px.current > W.current - BALL_SIZE / 2) { px.current = W.current - BALL_SIZE / 2; vx.current = -vx.current * 0.6; if (navigator.vibrate) navigator.vibrate(4) }
        if (py.current < -BALL_SIZE || py.current > H.current + 200) doMiss()
        rerender(); return
      }

      if (p === 'swish') {
        vy.current += GRAVITY * 0.2
        py.current += vy.current * 0.4
        px.current += (hoopX - px.current) * 0.15
        vx.current *= 0.8
        spin.current += 0.5
        const tp = Math.min(1, (py.current - hoopY) / 60)
        sqX.current = 1 - tp * 0.15; sqY.current = 1 - tp * 0.15
        rerender(); return
      }

      rerender()
    }

    frameId.current = requestAnimationFrame(tick)
    return () => { done.current = true; if (frameId.current) cancelAnimationFrame(frameId.current) }
  }, [])

  // Touch handlers — attached via ref with { passive: false }
  useEffect(() => {
    const el = overlayRef.current
    if (!el) return

    const handleStart = (e) => {
      e.stopPropagation()
      e.preventDefault()
      if (phase.current !== 'play' && phase.current !== 'waiting') return
      const t = e.touches[0]
      if (Math.sqrt((t.clientX - px.current) ** 2 + (t.clientY - py.current) ** 2) > 80) return
      if (phase.current === 'waiting') phase.current = 'play'
      isDragging.current = true
      vx.current = 0; vy.current = 0
      touches.current = [{ x: t.clientX, y: t.clientY, t: Date.now() }]
    }

    const handleMove = (e) => {
      e.stopPropagation()
      e.preventDefault()
      if (!isDragging.current) return
      const t = e.touches[0]
      px.current = t.clientX
      py.current = Math.min(t.clientY, FLOOR.current)
      spin.current += (t.clientX - (touches.current[touches.current.length - 1]?.x || t.clientX)) * 1.5
      touches.current.push({ x: t.clientX, y: t.clientY, t: Date.now() })
      if (touches.current.length > 6) touches.current.shift()
    }

    const handleEnd = (e) => {
      e.stopPropagation()
      if (!isDragging.current) return
      isDragging.current = false
      const h = touches.current
      let fvx = 0, fvy = 0
      if (h.length >= 2) {
        const a = h[0], b = h[h.length - 1], dt = (b.t - a.t) / 1000
        if (dt > 0) { fvx = (b.x - a.x) / dt / 60; fvy = (b.y - a.y) / dt / 60 }
      }
      if (fvy < -3) {
        phase.current = 'shot'
        vx.current = fvx * 0.3 + (hoopX - px.current) * 0.02
        vy.current = Math.max(fvy * 0.5, -16)
        return
      }
      vx.current = fvx * 0.7
      vy.current = fvy * 0.7
    }

    el.addEventListener('touchstart', handleStart, { passive: false })
    el.addEventListener('touchmove', handleMove, { passive: false })
    el.addEventListener('touchend', handleEnd, { passive: false })
    return () => {
      el.removeEventListener('touchstart', handleStart)
      el.removeEventListener('touchmove', handleMove)
      el.removeEventListener('touchend', handleEnd)
    }
  }, [])

  const doScore = (x, y) => {
    phase.current = 'score'
    if (navigator.vibrate) navigator.vibrate([10, 30, 10, 30, 20])
    emitStarburst(x, y)
    setTimeout(() => emitExplosion(x, y + 20, 1200, 50), 80)
    const flash = document.createElement('div')
    flash.style.cssText = 'position:fixed;inset:0;background:rgba(255,107,53,0.12);z-index:200;pointer-events:none;transition:opacity 300ms'
    document.body.appendChild(flash)
    setTimeout(() => { flash.style.opacity = '0' }, 100)
    setTimeout(() => flash.remove(), 400)
    setTimeout(() => onComplete?.(), 1400)
  }

  const doMiss = () => { phase.current = 'miss'; onComplete?.() }

  const p = phase.current
  const mt = morphT.current
  const heightAboveFloor = FLOOR.current - py.current
  const shadowScale = Math.max(0.3, 1 - heightAboveFloor / 300)
  const shadowOpacity = Math.max(0.05, 0.25 - heightAboveFloor / 500)

  const morphStyle = p === 'morph' ? {
    position: 'absolute',
    left: px.current - lerp(origin.width / 2, BALL_SIZE / 2, mt),
    top: py.current - lerp(origin.height / 2, BALL_SIZE / 2, mt),
    width: lerp(origin.width, BALL_SIZE, mt),
    height: lerp(origin.height, BALL_SIZE, mt),
    borderRadius: lerp(0, BALL_SIZE / 2, mt),
    background: `rgba(255,255,255,${lerp(0, 0.04, mt)})`,
    border: `${lerp(2, 2.5, mt)}px solid rgba(255,255,255,${lerp(0.15, 0.2, mt)})`,
    boxShadow: `0 ${lerp(0, 4, mt)}px ${lerp(0, 12, mt)}px rgba(0,0,0,${lerp(0, 0.5, mt)})`,
    pointerEvents: 'none', overflow: 'hidden',
  } : null

  const ballVisible = p === 'waiting' || p === 'play' || p === 'shot' || p === 'swish'
  const isSwish = p === 'swish'

  const ballEl = ballVisible && (
    <div className="absolute pointer-events-none" style={{
      left: px.current - BALL_SIZE / 2, top: py.current - BALL_SIZE / 2,
      width: BALL_SIZE, height: BALL_SIZE, borderRadius: '50%',
      border: '2px solid rgba(255,255,255,0.1)',
      background: isSwish ? 'linear-gradient(135deg, #ff6b35, #ffaa40)' : 'radial-gradient(circle at 40% 35%, rgba(255,255,255,0.08), rgba(255,255,255,0.02))',
      boxShadow: `0 4px 16px rgba(0,0,0,0.4)${isSwish ? ', 0 0 20px rgba(255,107,53,0.3)' : ''}`,
      transform: `scaleX(${sqX.current}) scaleY(${sqY.current}) rotate(${spin.current}deg)`,
      transition: isSwish ? 'background 200ms, border-color 200ms' : 'none',
      borderColor: isSwish ? 'var(--color-accent)' : undefined,
    }}>
      {isSwish && (
        <div className="absolute inset-0 flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 10l5 5L16 5" />
          </svg>
        </div>
      )}
    </div>
  )

  const hoopBack = p !== 'morph' && (
    <div className="absolute animate-slide-down pointer-events-none" style={{ left: hoopX - 55, top: hoopY - 30 }}>
      <svg width="110" height="80" viewBox="0 0 110 80">
        <rect x="15" y="0" width="80" height="50" rx="3" fill="none" stroke="#333" strokeWidth="2" />
        <rect x="35" y="15" width="40" height="28" rx="2" fill="none" stroke="#333" strokeWidth="1" opacity="0.5" />
        <line x1="15" y1="54" x2="25" y2="75" stroke="#333" strokeWidth="1" />
        <line x1="35" y1="54" x2="35" y2="78" stroke="#333" strokeWidth="1" />
        <line x1="55" y1="54" x2="55" y2="80" stroke="#333" strokeWidth="1" />
        <line x1="75" y1="54" x2="75" y2="78" stroke="#333" strokeWidth="1" />
        <line x1="95" y1="54" x2="85" y2="75" stroke="#333" strokeWidth="1" />
        <line x1="15" y1="62" x2="95" y2="62" stroke="#333" strokeWidth="0.5" opacity="0.4" />
        <line x1="20" y1="70" x2="90" y2="70" stroke="#333" strokeWidth="0.5" opacity="0.3" />
      </svg>
    </div>
  )

  const hoopRim = p !== 'morph' && (
    <div className="absolute pointer-events-none" style={{ left: hoopX - 55, top: hoopY - 30 }}>
      <svg width="110" height="80" viewBox="0 0 110 80">
        <line x1="15" y1="50" x2="5" y2="54" stroke="var(--color-accent)" strokeWidth="3" strokeLinecap="round" />
        <line x1="95" y1="50" x2="105" y2="54" stroke="var(--color-accent)" strokeWidth="3" strokeLinecap="round" />
        <line x1="5" y1="54" x2="105" y2="54" stroke="var(--color-accent)" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </div>
  )

  return (
    <div ref={overlayRef} className="fixed inset-0 z-40"
      style={{ background: `rgba(10,10,10,${p === 'morph' && !origin.skipMorph ? mt * 0.88 : 0.88})`, touchAction: 'none' }}>

      {ballVisible && (
        <div className="absolute rounded-full pointer-events-none" style={{
          left: px.current - 18 * shadowScale, top: FLOOR.current + BALL_SIZE / 2 - 3,
          width: 36 * shadowScale, height: 8 * shadowScale,
          background: `rgba(255,255,255,${shadowOpacity})`, filter: 'blur(4px)',
        }} />
      )}

      {p === 'morph' && (
        <div style={morphStyle}>
          <div className="absolute inset-0 flex items-center justify-center" style={{ borderRadius: '50%', opacity: Math.max(0, mt - 0.3) }}>
            <div style={{ width: '2.5px', height: '60%', background: 'rgba(255,255,255,0.15)', borderRadius: 2 }} />
          </div>
        </div>
      )}

      {isSwish ? <>{hoopBack}{ballEl}{hoopRim}</> : <>{hoopBack}{hoopRim}{ballEl}</>}

      {p === 'score' && (
        <div className="absolute inset-0 flex items-center justify-center animate-slide-up" style={{ zIndex: 10 }}>
          <p className="text-[28px] font-semibold text-text tracking-tight">Task complete</p>
        </div>
      )}

      {(p === 'play' || p === 'waiting') && (
        <button onClick={onCancel} className="absolute bottom-8 left-0 right-0 text-center text-[12px] text-text-faint" style={{ zIndex: 10 }}>
          tap to cancel
        </button>
      )}
    </div>
  )
}

function lerp(a, b, t) { return a + (b - a) * t }
