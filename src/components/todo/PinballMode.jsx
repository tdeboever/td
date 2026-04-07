import { useState, useRef, useEffect } from 'react'
import { emitExplosion, emitStarburst } from './ParticleCanvas'

const BALL_SIZE = 36
const BUMPER_SIZE = 50
const BUMPER_COUNT = 5
const GRAVITY = 0.15

function randomBumpers(w, h) {
  const bumpers = []
  const margin = 60
  for (let i = 0; i < BUMPER_COUNT; i++) {
    bumpers.push({
      x: margin + Math.random() * (w - margin * 2),
      y: 100 + Math.random() * (h * 0.5),
      hit: false,
      scale: 1,
    })
  }
  return bumpers
}

export default function PinballMode({ origin, onComplete, onCancel }) {
  const [, forceRender] = useState(0)
  const rerender = () => forceRender((n) => n + 1)

  const phase = useRef('launch')
  const px = useRef(origin.x)
  const py = useRef(origin.y)
  const vx = useRef(6 + Math.random() * 4)
  const vy = useRef(-8 - Math.random() * 4)
  const bumpers = useRef([])
  const hits = useRef(0)
  const frameId = useRef(null)
  const done = useRef(false)

  const W = useRef(window.innerWidth)
  const H = useRef(window.innerHeight)

  useEffect(() => {
    done.current = false
    phase.current = 'launch'
    bumpers.current = randomBumpers(W.current, H.current)
    hits.current = 0

    const tick = () => {
      if (done.current) return
      frameId.current = requestAnimationFrame(tick)

      if (phase.current === 'done') { rerender(); return }

      // Physics
      vy.current += GRAVITY
      px.current += vx.current
      py.current += vy.current

      // Wall bounces
      if (px.current < BALL_SIZE / 2) { px.current = BALL_SIZE / 2; vx.current = Math.abs(vx.current) * 0.9 }
      if (px.current > W.current - BALL_SIZE / 2) { px.current = W.current - BALL_SIZE / 2; vx.current = -Math.abs(vx.current) * 0.9 }
      if (py.current < BALL_SIZE / 2) { py.current = BALL_SIZE / 2; vy.current = Math.abs(vy.current) * 0.9 }

      // Bumper collisions
      for (const b of bumpers.current) {
        const dx = px.current - b.x
        const dy = py.current - b.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        const minDist = (BALL_SIZE + BUMPER_SIZE) / 2

        if (dist < minDist) {
          // Bounce off bumper
          const nx = dx / dist
          const ny = dy / dist
          const dot = vx.current * nx + vy.current * ny
          vx.current -= 2 * dot * nx
          vy.current -= 2 * dot * ny

          // Push out of overlap
          px.current = b.x + nx * minDist
          py.current = b.y + ny * minDist

          // Boost
          const speed = Math.sqrt(vx.current ** 2 + vy.current ** 2)
          if (speed < 8) { vx.current *= 1.3; vy.current *= 1.3 }

          // Effects
          b.hit = true
          b.scale = 1.3
          setTimeout(() => { b.scale = 1 }, 150)
          hits.current++
          emitExplosion(b.x, b.y, 400, 8)
          if (navigator.vibrate) navigator.vibrate(8)
        }
      }

      // Exit bottom = done
      if (py.current > H.current + 50) {
        phase.current = 'done'
        emitStarburst(px.current, H.current)
        if (navigator.vibrate) navigator.vibrate([10, 20, 10])
        setTimeout(() => onComplete?.(), 800)
      }

      rerender()
    }

    frameId.current = requestAnimationFrame(tick)
    return () => { done.current = true; if (frameId.current) cancelAnimationFrame(frameId.current) }
  }, [])

  const p = phase.current

  return (
    <div
      className="fixed inset-0 z-40"
      style={{ background: 'rgba(10,10,10,0.9)', touchAction: 'none' }}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => { e.stopPropagation(); e.preventDefault() }}
      onTouchEnd={(e) => e.stopPropagation()}
    >
      {/* Bumpers */}
      {bumpers.current.map((b, i) => (
        <div key={i} className="absolute pointer-events-none" style={{
          left: b.x - BUMPER_SIZE / 2,
          top: b.y - BUMPER_SIZE / 2,
          width: BUMPER_SIZE,
          height: BUMPER_SIZE,
          borderRadius: '50%',
          border: `2px solid ${b.hit ? 'var(--color-accent)' : 'var(--color-border-light)'}`,
          background: b.hit ? 'rgba(255,107,53,0.15)' : 'rgba(255,255,255,0.03)',
          transform: `scale(${b.scale})`,
          transition: 'transform 150ms, border-color 200ms, background 200ms',
        }} />
      ))}

      {/* Hit counter */}
      {hits.current > 0 && (
        <div className="absolute top-6 right-6 text-[20px] font-bold text-accent tabular-nums">
          {hits.current}
        </div>
      )}

      {/* Ball */}
      {p !== 'done' && (
        <div className="absolute pointer-events-none" style={{
          left: px.current - BALL_SIZE / 2,
          top: py.current - BALL_SIZE / 2,
          width: BALL_SIZE,
          height: BALL_SIZE,
          borderRadius: '50%',
          border: '2px solid rgba(255,255,255,0.1)',
          background: 'radial-gradient(circle at 40% 35%, rgba(255,255,255,0.08), rgba(255,255,255,0.02))',
          background: 'rgba(255,255,255,0.04)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
        }} />
      )}

      {p === 'done' && (
        <div className="absolute inset-0 flex items-center justify-center animate-slide-up" style={{ zIndex: 10 }}>
          <p className="text-[28px] font-semibold text-text tracking-tight">Task complete</p>
        </div>
      )}

      {p === 'launch' && (
        <button onClick={onCancel} className="absolute bottom-8 left-0 right-0 text-center text-[12px] text-text-faint" style={{ zIndex: 10 }}>
          tap to cancel
        </button>
      )}
    </div>
  )
}
