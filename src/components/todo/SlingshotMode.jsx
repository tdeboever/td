import { useState, useRef, useEffect } from 'react'
import { emitExplosion, emitStarburst, emitExhaust } from './ParticleCanvas'

const BALL_SIZE = 44
const ANCHOR_Y_OFFSET = 0.55 // fraction of screen height for slingshot Y
const MAX_PULL = 180
const POWER_MULT = 0.12

export default function SlingshotMode({ origin, onComplete, onCancel }) {
  const [, forceRender] = useState(0)
  const rerender = () => forceRender((n) => n + 1)

  const phase = useRef('ready') // 'ready' | 'pulling' | 'flying' | 'done'
  const px = useRef(0)
  const py = useRef(0)
  const vx = useRef(0)
  const vy = useRef(0)
  const pullX = useRef(0)
  const pullY = useRef(0)
  const frameId = useRef(null)
  const done = useRef(false)
  const exhaustTimer = useRef(null)

  const W = useRef(window.innerWidth)
  const H = useRef(window.innerHeight)
  const anchorX = W.current / 2
  const anchorY = H.current * ANCHOR_Y_OFFSET

  useEffect(() => {
    done.current = false
    px.current = anchorX
    py.current = anchorY

    const tick = () => {
      if (done.current) return
      frameId.current = requestAnimationFrame(tick)
      const p = phase.current

      if (p === 'flying') {
        vy.current += 0.4 // gravity
        px.current += vx.current
        py.current += vy.current
        vx.current *= 0.995

        // Off screen = done
        if (py.current < -100 || px.current < -100 || px.current > W.current + 100 || py.current > H.current + 100) {
          emitStarburst(
            Math.max(0, Math.min(W.current, px.current)),
            Math.max(0, Math.min(H.current, py.current))
          )
          phase.current = 'done'
          if (exhaustTimer.current) { clearInterval(exhaustTimer.current); exhaustTimer.current = null }
          if (navigator.vibrate) navigator.vibrate([10, 20, 10])
          setTimeout(() => onComplete?.(), 600)
        }
      }

      rerender()
    }
    frameId.current = requestAnimationFrame(tick)
    return () => { done.current = true; if (frameId.current) cancelAnimationFrame(frameId.current); if (exhaustTimer.current) clearInterval(exhaustTimer.current) }
  }, [])

  const onTouchStart = (e) => {
    e.stopPropagation()
    if (phase.current !== 'ready') return
    const t = e.touches[0]
    const dist = Math.sqrt((t.clientX - px.current) ** 2 + (t.clientY - py.current) ** 2)
    if (dist > 100) return
    phase.current = 'pulling'
  }

  const onTouchMove = (e) => {
    e.stopPropagation()
    e.preventDefault()
    if (phase.current !== 'pulling') return
    const t = e.touches[0]
    // Pull from anchor — clamp to max pull distance
    let dx = t.clientX - anchorX
    let dy = t.clientY - anchorY
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist > MAX_PULL) { dx = dx / dist * MAX_PULL; dy = dy / dist * MAX_PULL }
    pullX.current = dx
    pullY.current = dy
    px.current = anchorX + dx
    py.current = anchorY + dy
  }

  const onTouchEnd = (e) => {
    e.stopPropagation()
    if (phase.current !== 'pulling') return

    const dist = Math.sqrt(pullX.current ** 2 + pullY.current ** 2)
    if (dist < 20) {
      // Too small — snap back
      px.current = anchorX
      py.current = anchorY
      pullX.current = 0
      pullY.current = 0
      phase.current = 'ready'
      return
    }

    // Launch! Velocity is opposite of pull direction
    phase.current = 'flying'
    vx.current = -pullX.current * POWER_MULT
    vy.current = -pullY.current * POWER_MULT
    pullX.current = 0
    pullY.current = 0

    if (navigator.vibrate) navigator.vibrate(15)

    // Exhaust trail
    exhaustTimer.current = setInterval(() => {
      if (phase.current !== 'flying') { clearInterval(exhaustTimer.current); return }
      emitExhaust(px.current, py.current + BALL_SIZE / 2)
    }, 40)
  }

  const p = phase.current
  const pulling = p === 'pulling'
  const pullDist = Math.sqrt(pullX.current ** 2 + pullY.current ** 2)
  const power = Math.min(1, pullDist / MAX_PULL)

  // Elastic band color based on tension
  const bandColor = power > 0.7 ? 'var(--color-accent)' : power > 0.4 ? 'var(--color-border-light)' : 'var(--color-border)'

  return (
    <div
      className="fixed inset-0 z-40"
      style={{ background: 'rgba(10,10,10,0.9)', touchAction: 'none' }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Slingshot fork — two posts */}
      {p !== 'done' && (
        <svg className="absolute inset-0 pointer-events-none" width={W.current} height={H.current}>
          {/* Left post */}
          <line x1={anchorX - 30} y1={anchorY + 60} x2={anchorX - 20} y2={anchorY - 10} stroke="var(--color-border-light)" strokeWidth="4" strokeLinecap="round" />
          {/* Right post */}
          <line x1={anchorX + 30} y1={anchorY + 60} x2={anchorX + 20} y2={anchorY - 10} stroke="var(--color-border-light)" strokeWidth="4" strokeLinecap="round" />

          {/* Elastic bands — from fork tips to ball */}
          {pulling && (
            <>
              <line x1={anchorX - 20} y1={anchorY - 10} x2={px.current} y2={py.current} stroke={bandColor} strokeWidth={2 + power * 2} strokeLinecap="round" />
              <line x1={anchorX + 20} y1={anchorY - 10} x2={px.current} y2={py.current} stroke={bandColor} strokeWidth={2 + power * 2} strokeLinecap="round" />
            </>
          )}
          {!pulling && p === 'ready' && (
            <>
              <line x1={anchorX - 20} y1={anchorY - 10} x2={anchorX} y2={anchorY + 5} stroke="var(--color-border)" strokeWidth="2" strokeLinecap="round" />
              <line x1={anchorX + 20} y1={anchorY - 10} x2={anchorX} y2={anchorY + 5} stroke="var(--color-border)" strokeWidth="2" strokeLinecap="round" />
            </>
          )}

          {/* Trajectory guide when pulling */}
          {pulling && power > 0.3 && (
            <>
              {[...Array(5)].map((_, i) => {
                const t = (i + 1) * 0.15
                const gx = px.current + (-pullX.current * POWER_MULT) * t * 60
                const gy = py.current + (-pullY.current * POWER_MULT) * t * 60 + 0.4 * (t * 60) ** 2 / 2
                return <circle key={i} cx={gx} cy={gy} r={2} fill="var(--color-border-light)" opacity={0.4 - i * 0.06} />
              })}
            </>
          )}
        </svg>
      )}

      {/* Power indicator */}
      {pulling && (
        <div className="absolute left-5 top-1/2 -translate-y-1/2" style={{ width: 4, height: 120, background: 'var(--color-border)', borderRadius: 2 }}>
          <div style={{ position: 'absolute', bottom: 0, width: '100%', height: `${power * 100}%`, background: power > 0.7 ? 'var(--color-accent)' : 'var(--color-border-light)', borderRadius: 2, transition: 'height 50ms' }} />
        </div>
      )}

      {/* Ball — checkbox style */}
      {p !== 'done' && (
        <div className="absolute pointer-events-none" style={{
          left: px.current - BALL_SIZE / 2,
          top: py.current - BALL_SIZE / 2,
          width: BALL_SIZE,
          height: BALL_SIZE,
          borderRadius: '50%',
          border: '2.5px solid var(--color-border-light)',
          background: 'rgba(255,255,255,0.04)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          transform: p === 'flying' ? `rotate(${vx.current * 10}deg)` : undefined,
        }} />
      )}

      {/* Done text */}
      {p === 'done' && (
        <div className="absolute inset-0 flex items-center justify-center animate-slide-up" style={{ zIndex: 10 }}>
          <p className="text-[28px] font-semibold text-text tracking-tight">Task complete</p>
        </div>
      )}

      {p === 'ready' && (
        <div className="absolute bottom-8 left-0 right-0 text-center">
          <p className="text-[13px] text-text-dim mb-2">Pull back and release</p>
          <button onClick={onCancel} className="text-[12px] text-text-faint">tap to cancel</button>
        </div>
      )}
    </div>
  )
}
