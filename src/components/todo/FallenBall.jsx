import { useRef, useEffect, useState } from 'react'
import { useUiStore } from '../../stores/uiStore'
import { emitExplosion } from './ParticleCanvas'
import BasketballMode from './BasketballMode'

const BALL_SIZE = 22
const GRAVITY = 0.6
const BOUNCE = 0.4
const FRICTION = 0.93
const FADE_AFTER = 6000

export default function FallenBall() {
  const ball = useUiStore((s) => s.completionBall)
  const clearBall = useUiStore((s) => s.clearBall)
  const [bbState, setBbState] = useState(null) // null | 'transition' | 'playing'
  const [, forceRender] = useState(0)

  const px = useRef(0)
  const py = useRef(0)
  const vx = useRef(0)
  const vy = useRef(0)
  const spin = useRef(0)
  const tiltX = useRef(0)
  const opacity = useRef(1)
  const bounceCount = useRef(0)
  const checkFill = useRef(1) // 1 = checked look, fades to 0 = empty
  const frameId = useRef(null)
  const done = useRef(false)
  const startTime = useRef(0)

  const W = useRef(window.innerWidth)
  const H = useRef(window.innerHeight)

  useEffect(() => {
    if (!ball) return

    done.current = false
    bounceCount.current = 0
    px.current = ball.x
    py.current = ball.y
    opacity.current = 1
    startTime.current = Date.now()
    W.current = window.innerWidth
    H.current = window.innerHeight

    checkFill.current = 1 // start as checked

    // POP out — upward burst with random angle
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.2
    const power = 6 + Math.random() * 4
    vx.current = Math.cos(angle) * power
    vy.current = Math.sin(angle) * power

    // Celebration burst at spawn point
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

    const tick = () => {
      if (done.current) return
      frameId.current = requestAnimationFrame(tick)

      const elapsed = Date.now() - startTime.current

      // Physics
      const grav = GRAVITY + (tiltY.current * 0.5)
      vy.current += grav
      vx.current += tiltX.current * 0.2
      vx.current *= FRICTION
      spin.current += vx.current * 4

      px.current += vx.current
      py.current += vy.current

      // Keep checked look — ball always shows checkmark
      checkFill.current = 1

      // Ceiling
      if (py.current < BALL_SIZE / 2) {
        py.current = BALL_SIZE / 2
        vy.current = Math.abs(vy.current) * 0.3
      }

      // Floor — ball sits ON the divider line (bottom of ball touches line)
      const floor = H.current - 149
      if (py.current > floor) {
        py.current = floor
        const impact = Math.abs(vy.current)
        vy.current = -vy.current * BOUNCE
        vx.current *= 0.8
        bounceCount.current++

        if (impact > 1.5 && navigator.vibrate) navigator.vibrate(Math.min(6, Math.floor(impact)))

        // Settle after enough bounces
        if (Math.abs(vy.current) < 1.2) {
          vy.current = 0
        }
      }

      // Walls
      if (px.current < BALL_SIZE / 2) { px.current = BALL_SIZE / 2; vx.current = Math.abs(vx.current) * 0.5 }
      if (px.current > W.current - BALL_SIZE / 2) { px.current = W.current - BALL_SIZE / 2; vx.current = -Math.abs(vx.current) * 0.5 }

      // Fade
      if (elapsed > FADE_AFTER) {
        opacity.current = Math.max(0, 1 - (elapsed - FADE_AFTER) / 800)
        if (opacity.current <= 0) { done.current = true; clearBall(); return }
      }

      forceRender((n) => n + 1)
    }

    frameId.current = requestAnimationFrame(tick)
    return () => {
      done.current = true
      if (frameId.current) cancelAnimationFrame(frameId.current)
      if (gyroHandler) window.removeEventListener('deviceorientation', gyroHandler)
    }
  }, [ball])

  if (!ball && !bbState) return null

  // Full basketball mode
  if (bbState === 'playing') {
    return (
      <BasketballMode
        origin={{
          x: px.current, y: py.current,
          width: BALL_SIZE, height: BALL_SIZE,
          velocity: 0, skipMorph: true,
        }}
        onComplete={() => { setBbState(null); clearBall() }}
        onCancel={() => { setBbState(null); clearBall() }}
      />
    )
  }

  if (!ball) return null

  const handleGrab = (e) => {
    e.stopPropagation()
    e.preventDefault()
    done.current = true
    // Go straight to basketball — ball starts in 'waiting' (still until grabbed)
    setBbState('playing')
  }

  const settled = Math.abs(vy.current) < 0.5 && py.current >= H.current - 151

  return (
    <div
      onTouchStart={handleGrab}
      onClick={handleGrab}
      className="fixed z-30"
      style={{
        left: px.current - BALL_SIZE / 2,
        top: py.current - BALL_SIZE / 2,
        width: BALL_SIZE,
        height: BALL_SIZE,
        borderRadius: '50%',
        border: '2px solid transparent',
        background: 'linear-gradient(135deg, var(--accent-rose), var(--accent-coral))',
        boxShadow: settled
          ? '0 0 16px rgba(244,114,182,0.3), 0 2px 8px rgba(0,0,0,0.3)'
          : '0 0 8px rgba(244,114,182,0.2), 0 2px 6px rgba(0,0,0,0.3)',
        opacity: opacity.current,
        transform: `rotate(${spin.current}deg)`,
        cursor: 'grab',
        touchAction: 'none',
        transition: 'box-shadow 300ms',
      }}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"
          style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}>
          <path d="M2 5.5l2 2L8 3" />
        </svg>
      </div>
    </div>
  )
}
