import { useRef, useEffect, useState } from 'react'
import { useUiStore } from '../../stores/uiStore'
import { emitExplosion, emitStarburst } from './ParticleCanvas'

const BALL_SIZE = 22
const BALL_BIG = 48
const GRAVITY = 0.6
const BOUNCE = 0.4
const FRICTION = 0.93
const FADE_AFTER = 6000

export default function FallenBall() {
  const ball = useUiStore((s) => s.completionBall)
  const clearBall = useUiStore((s) => s.clearBall)
  const [, forceRender] = useState(0)
  const rerender = () => forceRender((n) => n + 1)

  // phase: 'falling' | 'holding' | 'shot' | 'swish' | 'score' | 'miss'
  const phase = useRef('falling')
  const px = useRef(0)
  const py = useRef(0)
  const vx = useRef(0)
  const vy = useRef(0)
  const spin = useRef(0)
  const tiltX = useRef(0)
  const opacity = useRef(1)
  const size = useRef(BALL_SIZE)
  const overlayOpacity = useRef(0)
  const isDragging = useRef(false)
  const touches = useRef([])
  const frameId = useRef(null)
  const done = useRef(false)
  const startTime = useRef(0)
  const ballRef = useRef(null)

  const W = useRef(window.innerWidth)
  const H = useRef(window.innerHeight)
  const hoopX = useRef(0)
  const hoopY = 110

  useEffect(() => {
    if (!ball) return

    done.current = false
    phase.current = 'falling'
    px.current = ball.x
    py.current = ball.y
    opacity.current = 1
    size.current = BALL_SIZE
    overlayOpacity.current = 0
    isDragging.current = false
    startTime.current = Date.now()
    W.current = window.innerWidth
    H.current = window.innerHeight
    hoopX.current = W.current / 2

    // Pop out
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.2
    const power = 6 + Math.random() * 4
    vx.current = Math.cos(angle) * power
    vy.current = Math.sin(angle) * power
    emitExplosion(ball.x, ball.y, 400, 8)
    if (navigator.vibrate) navigator.vibrate(8)

    // Gyroscope
    const tiltY = { current: 0 }
    let gyroHandler = null
    if (window.DeviceOrientationEvent) {
      gyroHandler = (e) => {
        if (e.gamma !== null) tiltX.current = (e.gamma / 45) * 2
        if (e.beta !== null) tiltY.current = ((e.beta - 45) / 45) * 1.0
      }
      window.addEventListener('deviceorientation', gyroHandler)
    }

    const floor = H.current - 149

    const tick = () => {
      if (done.current) return
      frameId.current = requestAnimationFrame(tick)
      const p = phase.current
      const elapsed = Date.now() - startTime.current

      // === FALLING ===
      if (p === 'falling') {
        const grav = GRAVITY + (tiltY.current * 0.5)
        vy.current += grav
        vx.current += tiltX.current * 0.2
        vx.current *= FRICTION
        spin.current += vx.current * 4
        px.current += vx.current
        py.current += vy.current

        if (py.current < BALL_SIZE / 2) { py.current = BALL_SIZE / 2; vy.current = Math.abs(vy.current) * 0.3 }
        if (py.current > floor) {
          py.current = floor
          vy.current = -vy.current * BOUNCE
          vx.current *= 0.8
          if (Math.abs(vy.current) > 1.5 && navigator.vibrate) navigator.vibrate(Math.min(6, Math.floor(Math.abs(vy.current))))
          if (Math.abs(vy.current) < 1.2) vy.current = 0
        }
        if (px.current < BALL_SIZE / 2) { px.current = BALL_SIZE / 2; vx.current = Math.abs(vx.current) * 0.5 }
        if (px.current > W.current - BALL_SIZE / 2) { px.current = W.current - BALL_SIZE / 2; vx.current = -Math.abs(vx.current) * 0.5 }

        if (elapsed > FADE_AFTER) {
          opacity.current = Math.max(0, 1 - (elapsed - FADE_AFTER) / 800)
          if (opacity.current <= 0) { done.current = true; clearBall(); return }
        }

        if (isDragging.current) {
          // Grabbed! Transition to holding
          phase.current = 'holding'
          vx.current = 0; vy.current = 0
        }

        rerender(); return
      }

      // === HOLDING (basketball mode — ball follows finger) ===
      if (p === 'holding') {
        if (size.current < BALL_BIG) size.current = Math.min(BALL_BIG, size.current + 2)
        if (overlayOpacity.current < 0.88) overlayOpacity.current = Math.min(0.88, overlayOpacity.current + 0.05)
        rerender(); return
      }

      // === SHOT ===
      if (p === 'shot') {
        vy.current += GRAVITY * 0.65
        vx.current += tiltX.current * 0.12
        px.current += vx.current
        py.current += vy.current
        spin.current += vx.current * 3

        const hx = hoopX.current
        if (Math.abs(py.current - (hoopY + 24)) < 14 && vy.current > 0 && Math.abs(px.current - hx) < 45) {
          phase.current = 'swish'
          setTimeout(() => doScore(px.current, hoopY + 30), 250)
          rerender(); return
        }

        const nearRim = Math.abs(py.current - hoopY) < 15
        if (nearRim && vy.current > 0 && Math.abs(px.current - hx) > 35 && Math.abs(px.current - hx) < 65) {
          vy.current = -vy.current * 0.7
          vx.current += (px.current > hx ? 3 : -3)
          if (navigator.vibrate) navigator.vibrate(6)
        }

        if (px.current < size.current / 2) { px.current = size.current / 2; vx.current = -vx.current * 0.7 }
        if (px.current > W.current - size.current / 2) { px.current = W.current - size.current / 2; vx.current = -vx.current * 0.7 }
        if (py.current < -size.current || py.current > H.current + 200) doMiss()

        rerender(); return
      }

      // === SWISH ===
      if (p === 'swish') {
        vy.current += GRAVITY * 0.2
        py.current += vy.current * 0.4
        px.current += (hoopX.current - px.current) * 0.15
        spin.current += 0.5
        rerender(); return
      }

      rerender()
    }

    frameId.current = requestAnimationFrame(tick)
    return () => {
      done.current = true
      if (frameId.current) cancelAnimationFrame(frameId.current)
      if (gyroHandler) window.removeEventListener('deviceorientation', gyroHandler)
    }
  }, [ball])

  // Touch handlers on ball element — passive:false for preventDefault
  useEffect(() => {
    const el = ballRef.current
    if (!el) return

    const handleStart = (e) => {
      e.stopPropagation(); e.preventDefault()
      isDragging.current = true
      const t = e.touches[0]
      px.current = t.clientX
      py.current = t.clientY
      touches.current = [{ x: t.clientX, y: t.clientY, t: Date.now() }]
    }

    const handleMove = (e) => {
      e.stopPropagation(); e.preventDefault()
      if (!isDragging.current) return
      const t = e.touches[0]
      px.current = t.clientX
      py.current = t.clientY
      spin.current += (t.clientX - (touches.current[touches.current.length - 1]?.x || t.clientX)) * 1.5
      touches.current.push({ x: t.clientX, y: t.clientY, t: Date.now() })
      if (touches.current.length > 6) touches.current.shift()
    }

    const handleEnd = (e) => {
      e.stopPropagation()
      if (!isDragging.current) return
      isDragging.current = false

      if (phase.current === 'falling') return // was just a tap during falling, ignore

      const h = touches.current
      let fvx = 0, fvy = 0
      if (h.length >= 2) {
        const a = h[0], b = h[h.length - 1], dt = (b.t - a.t) / 1000
        if (dt > 0) { fvx = (b.x - a.x) / dt / 60; fvy = (b.y - a.y) / dt / 60 }
      }

      if (fvy < -2) {
        phase.current = 'shot'
        vx.current = fvx * 0.3 + (hoopX.current - px.current) * 0.02
        vy.current = Math.max(fvy * 0.5, -16)
      } else {
        // Didn't shoot — stay in holding
        isDragging.current = true
      }
    }

    el.addEventListener('touchstart', handleStart, { passive: false })
    el.addEventListener('touchmove', handleMove, { passive: false })
    el.addEventListener('touchend', handleEnd, { passive: false })
    return () => {
      el.removeEventListener('touchstart', handleStart)
      el.removeEventListener('touchmove', handleMove)
      el.removeEventListener('touchend', handleEnd)
    }
  }, [ball])

  const doScore = (x, y) => {
    phase.current = 'score'
    if (navigator.vibrate) navigator.vibrate([10, 30, 10, 30, 20])
    emitStarburst(x, y)
    setTimeout(() => emitExplosion(x, y + 20, 1200, 50), 80)
    setTimeout(() => { clearBall() }, 1400)
  }

  const doMiss = () => { phase.current = 'miss'; clearBall() }

  if (!ball) return null

  const p = phase.current
  const s = size.current
  const inGame = p === 'holding' || p === 'shot' || p === 'swish'
  const isSwish = p === 'swish'
  const hx = hoopX.current

  return (
    <>
      {/* Overlay — fades in when entering basketball */}
      {inGame && overlayOpacity.current > 0 && (
        <div className="fixed inset-0 z-35 pointer-events-none" style={{ background: `rgba(26,22,37,${overlayOpacity.current})` }} />
      )}

      {/* Hoop */}
      {inGame && overlayOpacity.current > 0.4 && (
        <>
          <div className="fixed pointer-events-none animate-slide-down" style={{ zIndex: 36, left: hx - 55, top: hoopY - 30 }}>
            <svg width="110" height="80" viewBox="0 0 110 80">
              <rect x="15" y="0" width="80" height="50" rx="3" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
              <rect x="35" y="15" width="40" height="28" rx="2" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
              <line x1="15" y1="54" x2="25" y2="75" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
              <line x1="35" y1="54" x2="35" y2="78" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
              <line x1="55" y1="54" x2="55" y2="80" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
              <line x1="75" y1="54" x2="75" y2="78" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
              <line x1="95" y1="54" x2="85" y2="75" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
            </svg>
          </div>
          <div className="fixed pointer-events-none" style={{ zIndex: isSwish ? 36 : 38, left: hx - 55, top: hoopY - 30 }}>
            <svg width="110" height="80" viewBox="0 0 110 80">
              <line x1="15" y1="50" x2="5" y2="54" stroke="var(--accent-coral)" strokeWidth="3" strokeLinecap="round" />
              <line x1="95" y1="50" x2="105" y2="54" stroke="var(--accent-coral)" strokeWidth="3" strokeLinecap="round" />
              <line x1="5" y1="54" x2="105" y2="54" stroke="var(--accent-coral)" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </div>
        </>
      )}

      {/* Ball — same element the entire lifecycle */}
      {p !== 'score' && p !== 'miss' && (
        <div
          ref={ballRef}
          className="fixed"
          style={{
            zIndex: isSwish ? 37 : 39,
            left: px.current - s / 2,
            top: py.current - s / 2,
            width: s, height: s,
            borderRadius: '50%',
            border: '2px solid transparent',
            background: isSwish ? 'linear-gradient(135deg, var(--accent-mint), var(--accent-sky))' : 'linear-gradient(135deg, var(--accent-rose), var(--accent-coral))',
            boxShadow: inGame
              ? '0 0 16px rgba(244,114,182,0.3), 0 4px 12px rgba(0,0,0,0.3)'
              : '0 0 8px rgba(244,114,182,0.2), 0 2px 6px rgba(0,0,0,0.3)',
            opacity: opacity.current,
            transform: `rotate(${spin.current}deg)`,
            cursor: p === 'falling' ? 'grab' : 'grabbing',
            touchAction: 'none',
            transition: isSwish ? 'background 200ms' : 'box-shadow 200ms',
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <svg width={s * 0.4} height={s * 0.4} viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"
              style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}>
              <path d="M2 5.5l2 2L8 3" />
            </svg>
          </div>
        </div>
      )}

      {/* Score */}
      {p === 'score' && (
        <div className="fixed inset-0 z-40 flex items-center justify-center animate-slide-up">
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 28 }}>Task complete</p>
        </div>
      )}

      {/* Cancel */}
      {p === 'holding' && (
        <button onClick={clearBall} className="fixed bottom-8 left-0 right-0 text-center z-40" style={{ fontSize: 12, color: 'var(--text-ghost)' }}>
          tap to cancel
        </button>
      )}
    </>
  )
}
