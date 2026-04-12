import { useState, useRef, useEffect } from 'react'
import { emitExplosion, emitStarburst } from './ParticleCanvas'

const GRAVITY = 0.55
const BALL_SIZE = 48
const RIM_WIDTH = 90

export default function BasketballMode({ origin, onComplete, onCancel }) {
  const [, forceRender] = useState(0)
  const rerender = () => forceRender((n) => n + 1)

  const phase = useRef('holding') // 'holding' | 'shot' | 'swish' | 'score' | 'miss'
  const px = useRef(origin.x)
  const py = useRef(origin.y)
  const vx = useRef(0)
  const vy = useRef(0)
  const spin = useRef(0)
  const ballSize = useRef(origin.width || 22) // starts at fallen ball size, grows

  const isDragging = useRef(true) // starts grabbed immediately
  const touches = useRef([])
  const frameId = useRef(null)
  const overlayRef = useRef(null)
  const overlayOpacity = useRef(0)

  const W = useRef(window.innerWidth)
  const H = useRef(window.innerHeight)
  const hoopX = W.current / 2
  const hoopY = 110
  const done = useRef(false)
  const tiltX = useRef(0)

  useEffect(() => {
    done.current = false
    isDragging.current = true
    px.current = origin.x
    py.current = origin.y
    ballSize.current = origin.width || 22

    let gyroHandler = null
    if (window.DeviceOrientationEvent) {
      gyroHandler = (e) => { if (e.gamma !== null) tiltX.current = (e.gamma / 45) * 1.5 }
      window.addEventListener('deviceorientation', gyroHandler)
    }

    const tick = (ts) => {
      if (done.current) return
      frameId.current = requestAnimationFrame(tick)

      // Grow ball to full size over 300ms
      if (ballSize.current < BALL_SIZE) {
        ballSize.current = Math.min(BALL_SIZE, ballSize.current + 1.5)
      }

      // Fade in overlay
      if (overlayOpacity.current < 0.88) {
        overlayOpacity.current = Math.min(0.88, overlayOpacity.current + 0.04)
      }

      const p = phase.current

      if (p === 'holding') {
        // Ball follows finger — no physics
        rerender()
        return
      }

      if (p === 'shot') {
        vy.current += GRAVITY * 0.65
        vx.current += tiltX.current * 0.12
        px.current += vx.current
        py.current += vy.current
        spin.current += vx.current * 3

        // Score check — falling through hoop (generous scoring zone)
        if (Math.abs(py.current - (hoopY + 24)) < 16 && vy.current > 0 && Math.abs(px.current - hoopX) < RIM_WIDTH / 2) {
          phase.current = 'swish'
          setTimeout(() => doScore(px.current, hoopY + 30), 250)
          rerender(); return
        }

        // Rim bounce — friendly: close shots get nudged in, far shots bounce out
        const nearRim = Math.abs(py.current - hoopY) < 15
        if (nearRim && vy.current > 0 && Math.abs(px.current - hoopX) > RIM_WIDTH / 2 && Math.abs(px.current - hoopX) < RIM_WIDTH / 1.5) {
          const distFromCenter = Math.abs(px.current - hoopX)
          const isCloseShot = distFromCenter < RIM_WIDTH / 1.8
          if (isCloseShot) {
            // Friendly rim — soft bounce, nudge toward center
            vy.current = -vy.current * 0.35
            vx.current = (hoopX - px.current) * 0.15
          } else {
            // Hard rim — bounces out
            vy.current = -vy.current * 0.65
            vx.current += (px.current > hoopX ? 3 : -3)
          }
          if (navigator.vibrate) navigator.vibrate(6)
        }

        // Wall bounces
        if (px.current < BALL_SIZE / 2) { px.current = BALL_SIZE / 2; vx.current = -vx.current * 0.7; if (navigator.vibrate) navigator.vibrate(4) }
        if (px.current > W.current - BALL_SIZE / 2) { px.current = W.current - BALL_SIZE / 2; vx.current = -vx.current * 0.7; if (navigator.vibrate) navigator.vibrate(4) }

        // Miss
        if (py.current < -BALL_SIZE || py.current > H.current + 200) doMiss()

        rerender(); return
      }

      if (p === 'swish') {
        vy.current += GRAVITY * 0.2
        py.current += vy.current * 0.4
        px.current += (hoopX - px.current) * 0.15
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
  }, [])

  // Touch — attached with passive:false
  useEffect(() => {
    const el = overlayRef.current
    if (!el) return

    const handleStart = (e) => {
      e.stopPropagation(); e.preventDefault()
      if (phase.current !== 'holding') return
      const t = e.touches[0]
      isDragging.current = true
      touches.current = [{ x: t.clientX, y: t.clientY, t: Date.now() }]
    }

    const handleMove = (e) => {
      e.stopPropagation(); e.preventDefault()
      if (!isDragging.current || phase.current !== 'holding') return
      const t = e.touches[0]
      px.current = t.clientX
      py.current = t.clientY
      spin.current += (t.clientX - (touches.current[touches.current.length - 1]?.x || t.clientX)) * 1.5
      touches.current.push({ x: t.clientX, y: t.clientY, t: Date.now() })
      if (touches.current.length > 6) touches.current.shift()
    }

    const handleEnd = (e) => {
      e.stopPropagation()
      if (phase.current !== 'holding') return
      isDragging.current = false
      const h = touches.current
      let fvx = 0, fvy = 0
      if (h.length >= 2) {
        const a = h[0], b = h[h.length - 1], dt = (b.t - a.t) / 1000
        if (dt > 0) { fvx = (b.x - a.x) / dt / 60; fvy = (b.y - a.y) / dt / 60 }
      }
      if (fvy < -2) {
        phase.current = 'shot'
        vx.current = fvx * 0.3 + (hoopX - px.current) * 0.02
        vy.current = Math.max(fvy * 0.5, -16)
      } else {
        // Dropped without shooting — go back to holding
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
  }, [])

  const doScore = (x, y) => {
    phase.current = 'score'
    if (navigator.vibrate) navigator.vibrate([10, 30, 10, 30, 20])
    emitStarburst(x, y)
    setTimeout(() => emitExplosion(x, y + 20, 1200, 50), 80)
    setTimeout(() => onComplete?.(), 1400)
  }

  const doMiss = () => { phase.current = 'miss'; onComplete?.() }

  const p = phase.current
  const bs = ballSize.current
  const ballVisible = p !== 'score'
  const isSwish = p === 'swish'

  const ballEl = ballVisible && (
    <div className="absolute pointer-events-none" style={{
      left: px.current - bs / 2, top: py.current - bs / 2,
      width: bs, height: bs, borderRadius: '50%',
      border: '2px solid transparent',
      background: isSwish ? 'linear-gradient(135deg, var(--accent-mint), var(--accent-sky))' : 'linear-gradient(135deg, var(--accent-rose), var(--accent-coral))',
      boxShadow: isSwish ? '0 0 20px rgba(74,222,128,0.3)' : '0 0 12px rgba(244,114,182,0.3), 0 4px 12px rgba(0,0,0,0.3)',
      transform: `rotate(${spin.current}deg)`,
      transition: isSwish ? 'background 200ms' : 'none',
    }}>
      <div className="absolute inset-0 flex items-center justify-center">
        <svg width={bs * 0.4} height={bs * 0.4} viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"
          style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}>
          <path d="M2 5.5l2 2L8 3" />
        </svg>
      </div>
    </div>
  )

  const hoopBack = p !== 'holding' || overlayOpacity.current > 0.5 ? (
    <div className="absolute pointer-events-none animate-slide-down" style={{ left: hoopX - 55, top: hoopY - 30 }}>
      <svg width="110" height="80" viewBox="0 0 110 80">
        <rect x="15" y="0" width="80" height="50" rx="3" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
        <rect x="35" y="15" width="40" height="28" rx="2" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        <line x1="15" y1="54" x2="25" y2="75" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        <line x1="35" y1="54" x2="35" y2="78" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        <line x1="55" y1="54" x2="55" y2="80" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        <line x1="75" y1="54" x2="75" y2="78" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        <line x1="95" y1="54" x2="85" y2="75" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        <line x1="15" y1="62" x2="95" y2="62" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
        <line x1="20" y1="70" x2="90" y2="70" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
      </svg>
    </div>
  ) : null

  const hoopRim = p !== 'holding' || overlayOpacity.current > 0.5 ? (
    <div className="absolute pointer-events-none" style={{ left: hoopX - 55, top: hoopY - 30 }}>
      <svg width="110" height="80" viewBox="0 0 110 80">
        <line x1="15" y1="50" x2="5" y2="54" stroke="var(--accent-coral)" strokeWidth="3" strokeLinecap="round" />
        <line x1="95" y1="50" x2="105" y2="54" stroke="var(--accent-coral)" strokeWidth="3" strokeLinecap="round" />
        <line x1="5" y1="54" x2="105" y2="54" stroke="var(--accent-coral)" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </div>
  ) : null

  return (
    <div ref={overlayRef} className="fixed inset-0 z-40"
      style={{ background: `rgba(26,22,37,${overlayOpacity.current})`, touchAction: 'none' }}>

      {isSwish ? <>{hoopBack}{ballEl}{hoopRim}</> : <>{hoopBack}{hoopRim}{ballEl}</>}

      {p === 'score' && (
        <div className="absolute inset-0 flex items-center justify-center animate-slide-up" style={{ zIndex: 10 }}>
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24 }}>Task complete</p>
        </div>
      )}

      {p === 'holding' && (
        <button onClick={onCancel} className="absolute bottom-8 left-0 right-0 text-center" style={{ fontSize: 12, color: 'var(--text-ghost)', zIndex: 10 }}>
          tap to cancel
        </button>
      )}
    </div>
  )
}
