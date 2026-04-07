import { useState, useRef, useEffect } from 'react'
import { emitExplosion, emitStarburst } from './ParticleCanvas'

const GRAVITY = 0.55
const BOUNCE = 0.68
const WALL_BOUNCE = 0.5
const BALL_SIZE = 48
const RIM_WIDTH = 90

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

  const W = useRef(window.innerWidth)
  const H = useRef(window.innerHeight)
  const FLOOR = useRef(H.current * 0.72)
  const hoopX = W.current / 2
  const hoopY = 110
  const done = useRef(false)

  // Single unified loop
  useEffect(() => {
    done.current = false // reset for React StrictMode double-mount
    phase.current = 'morph'
    morphT.current = 0
    morphStart.current = null
    px.current = origin.x
    py.current = origin.y
    vx.current = 0
    // Initial downward velocity from swipe speed — faster swipe = harder slam
    const swipeSpeed = origin.velocity || 0
    vy.current = Math.max(3, Math.min(20, swipeSpeed / 150))

    const tick = (ts) => {
      if (done.current) return
      frameId.current = requestAnimationFrame(tick)

      const p = phase.current

      // === MORPH ===
      if (p === 'morph') {
        if (!morphStart.current) morphStart.current = ts
        morphT.current = Math.min(1, (ts - morphStart.current) / 400)

        // Fall during morph
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

      // === PLAY (dribble) ===
      if (p === 'play') {
        if (isDragging.current) { rerender(); return }

        vy.current += GRAVITY
        px.current += vx.current
        py.current += vy.current
        spin.current += vx.current * 2

        // Floor
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

        // Walls
        if (px.current < BALL_SIZE / 2) { px.current = BALL_SIZE / 2; vx.current = -vx.current * WALL_BOUNCE }
        if (px.current > W.current - BALL_SIZE / 2) { px.current = W.current - BALL_SIZE / 2; vx.current = -vx.current * WALL_BOUNCE }

        // Stretch when fast
        if (Math.abs(vy.current) > 8 && py.current < FLOOR.current - 10) {
          const s = Math.min(0.12, Math.abs(vy.current) * 0.004)
          sqX.current = 1 - s * 0.5; sqY.current = 1 + s
        }

        rerender()
        return
      }

      // === SHOT ===
      if (p === 'shot') {
        vy.current += GRAVITY * 0.65
        px.current += vx.current
        py.current += vy.current
        spin.current += vx.current * 3

        // Stretch based on movement direction
        const spd = Math.sqrt(vx.current ** 2 + vy.current ** 2)
        if (spd > 4) {
          const s = Math.min(0.1, spd * 0.003)
          sqX.current = 1 - s * 0.3; sqY.current = 1 + s
        } else {
          sqX.current = 1; sqY.current = 1
        }

        // Score check — ball must be FALLING DOWN through the hoop
        const atHoopHeight = Math.abs(py.current - (hoopY + 24)) < 12
        const fallingDown = vy.current > 0
        const horizontallyAligned = Math.abs(px.current - hoopX) < RIM_WIDTH / 2.2

        if (atHoopHeight && fallingDown && horizontallyAligned) {
          // Ball drops through — animate it falling a bit more before scoring
          phase.current = 'swish'
          // Let ball continue falling through the net
          setTimeout(() => doScore(px.current, hoopY + 30), 250)
          rerender()
          return
        }

        // Rim bounce — ball hits rim area but not cleanly through
        const nearRimHeight = Math.abs(py.current - hoopY) < 15
        const hitsRim = nearRimHeight && vy.current > 0 &&
          Math.abs(px.current - hoopX) > RIM_WIDTH / 2.5 &&
          Math.abs(px.current - hoopX) < RIM_WIDTH / 1.5
        if (hitsRim) {
          // Bounce off rim
          vy.current = -vy.current * 0.5
          vx.current += (px.current > hoopX ? 2 : -2)
          if (navigator.vibrate) navigator.vibrate(6)
        }

        // Wall bounces during shot
        if (px.current < BALL_SIZE / 2) {
          px.current = BALL_SIZE / 2
          vx.current = -vx.current * 0.6
          if (navigator.vibrate) navigator.vibrate(4)
        }
        if (px.current > W.current - BALL_SIZE / 2) {
          px.current = W.current - BALL_SIZE / 2
          vx.current = -vx.current * 0.6
          if (navigator.vibrate) navigator.vibrate(4)
        }

        // Miss — flew above screen or fell below
        if (py.current < -BALL_SIZE || py.current > H.current + 200) {
          doMiss()
        }

        rerender()
        return
      }

      // === SWISH (ball falling through net) ===
      if (p === 'swish') {
        vy.current += GRAVITY * 0.2
        py.current += vy.current * 0.4 // slow fall through net
        // Snap toward hoop center
        px.current += (hoopX - px.current) * 0.15
        vx.current *= 0.8
        spin.current += 0.5
        // Shrink slightly as it passes through (perspective)
        const throughProgress = Math.min(1, (py.current - hoopY) / 60)
        sqX.current = 1 - throughProgress * 0.15
        sqY.current = 1 - throughProgress * 0.15
        rerender()
        return
      }

      // score/miss — just keep rendering
      rerender()
    }

    frameId.current = requestAnimationFrame(tick)
    return () => { done.current = true; if (frameId.current) cancelAnimationFrame(frameId.current) }
  }, [])

  const doScore = (x, y) => {
    phase.current = 'score'
    if (navigator.vibrate) navigator.vibrate([10, 30, 10, 30, 20])
    emitStarburst(x, y)
    setTimeout(() => emitExplosion(x, y + 20, 1200, 50), 80)
    flash()
    setTimeout(() => onComplete?.(), 1400)
  }

  const doMiss = () => {
    phase.current = 'miss'
    onComplete?.()
  }

  const flash = () => {
    const el = document.createElement('div')
    el.style.cssText = 'position:fixed;inset:0;background:rgba(255,107,53,0.12);z-index:200;pointer-events:none;transition:opacity 300ms'
    document.body.appendChild(el)
    setTimeout(() => { el.style.opacity = '0' }, 100)
    setTimeout(() => el.remove(), 400)
  }

  // Touch handlers — always stop propagation to prevent view switching
  const onTouchStart = (e) => {
    e.stopPropagation()
    if (phase.current !== 'play') return
    const t = e.touches[0]
    if (Math.sqrt((t.clientX - px.current) ** 2 + (t.clientY - py.current) ** 2) > 80) return
    isDragging.current = true
    vx.current = 0; vy.current = 0
    touches.current = [{ x: t.clientX, y: t.clientY, t: Date.now() }]
  }

  const onTouchMove = (e) => {
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

  const onTouchEnd = (e) => {
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
      // Shoot — heavy ball, dampen velocity significantly
      phase.current = 'shot'
      const distToHoop = hoopX - px.current
      const aimAssist = distToHoop * 0.02
      vx.current = fvx * 0.3 + aimAssist
      vy.current = Math.max(fvy * 0.5, -16)
      return
    }

    // Resume dribble with fling velocity
    vx.current = fvx * 0.7
    vy.current = fvy * 0.7
  }

  // Render values
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
    pointerEvents: 'none',
    overflow: 'hidden',
  } : null

  const ballVisible = p === 'play' || p === 'shot' || p === 'swish'
  const isSwish = p === 'swish'

  const ballEl = ballVisible && (
    <div className="absolute pointer-events-none" style={{
      left: px.current - BALL_SIZE / 2, top: py.current - BALL_SIZE / 2,
      width: BALL_SIZE, height: BALL_SIZE, borderRadius: '50%',
      border: '2.5px solid var(--color-border-light)',
      background: isSwish ? 'var(--color-accent)' : 'rgba(255,255,255,0.04)',
      boxShadow: `0 4px 20px rgba(0,0,0,0.4)${isSwish ? ', 0 0 20px var(--color-accent-glow)' : ''}`,
      transform: `scaleX(${sqX.current}) scaleY(${sqY.current}) rotate(${spin.current}deg)`,
      transition: isSwish ? 'background 200ms, border-color 200ms' : 'none',
      borderColor: isSwish ? 'var(--color-accent)' : undefined,
    }}>
      {/* Checkmark — visible during swish, centered and sized to the ball */}
      {isSwish && (
        <div className="absolute inset-0 flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 10l5 5L16 5" />
          </svg>
        </div>
      )}
    </div>
  )

  // Backboard + net (behind ball)
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

  // Rim (in front of ball)
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
    <div
      className="fixed inset-0 z-40"
      style={{ background: `rgba(10,10,10,${p === 'morph' ? mt * 0.88 : 0.88})`, touchAction: 'none' }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Shadow */}
      {ballVisible && (
        <div className="absolute rounded-full pointer-events-none" style={{
          left: px.current - 18 * shadowScale, top: FLOOR.current + BALL_SIZE / 2 - 3,
          width: 36 * shadowScale, height: 8 * shadowScale,
          background: `rgba(255,255,255,${shadowOpacity})`, filter: 'blur(4px)',
        }} />
      )}

      {/* Morph (checkbox → ball) */}
      {p === 'morph' && (
        <div style={morphStyle}>
          <div className="absolute inset-0 flex items-center justify-center" style={{ borderRadius: '50%', opacity: Math.max(0, mt - 0.3) }}>
            <div style={{ width: '2.5px', height: '60%', background: 'rgba(255,255,255,0.15)', borderRadius: 2 }} />
          </div>
        </div>
      )}

      {/* Render order controls layering: back → ball → rim */}
      {isSwish ? (
        <>{hoopBack}{ballEl}{hoopRim}</>
      ) : (
        <>{hoopBack}{hoopRim}{ballEl}</>
      )}

      {p === 'score' && (
        <div className="absolute inset-0 flex items-center justify-center animate-slide-up" style={{ zIndex: 10 }}>
          <div className="text-center">
            <p className="text-[28px] font-semibold text-text tracking-tight">Task complete</p>
          </div>
        </div>
      )}


      {p === 'play' && (
        <button onClick={onCancel} className="absolute bottom-8 left-0 right-0 text-center text-[12px] text-text-faint" style={{ zIndex: 10 }}>
          tap to cancel
        </button>
      )}
    </div>
  )
}

function lerp(a, b, t) { return a + (b - a) * t }
function lerpColor(hex1, hex2, t) {
  const c = (s, i) => parseInt(s.slice(i, i + 2), 16)
  return `rgb(${Math.round(lerp(c(hex1,1),c(hex2,1),t))},${Math.round(lerp(c(hex1,3),c(hex2,3),t))},${Math.round(lerp(c(hex1,5),c(hex2,5),t))})`
}
