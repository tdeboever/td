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
  const [showBasketball, setShowBasketball] = useState(false)
  const [, forceRender] = useState(0)

  const px = useRef(0)
  const py = useRef(0)
  const vx = useRef(0)
  const vy = useRef(0)
  const spin = useRef(0)
  const tiltX = useRef(0)
  const opacity = useRef(1)
  const bounceCount = useRef(0)
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

    // POP out — upward burst with random angle, like flicking a marble
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.2 // mostly up, slightly random
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

      // Ceiling
      if (py.current < BALL_SIZE / 2) {
        py.current = BALL_SIZE / 2
        vy.current = Math.abs(vy.current) * 0.3
      }

      // Floor — above input/nav
      const floor = H.current - 140
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

  if (!ball && !showBasketball) return null

  // Basketball — render the ball AND the basketball overlay simultaneously for seamless transition
  if (showBasketball) {
    return (
      <BasketballMode
        origin={{
          x: px.current, y: py.current,
          width: BALL_SIZE, height: BALL_SIZE,
          velocity: 0, skipMorph: true,
        }}
        onComplete={() => { setShowBasketball(false); clearBall() }}
        onCancel={() => { setShowBasketball(false); clearBall() }}
      />
    )
  }

  if (!ball) return null

  const handleGrab = (e) => {
    e.stopPropagation()
    e.preventDefault()
    done.current = true
    setShowBasketball(true)
  }

  const settled = Math.abs(vy.current) < 0.5 && py.current >= H.current - 142

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
        border: '2px solid rgba(255,255,255,0.15)',
        background: 'radial-gradient(circle at 40% 35%, rgba(255,255,255,0.1), rgba(255,255,255,0.03))',
        boxShadow: settled
          ? '0 0 12px rgba(255,107,53,0.2), 0 2px 6px rgba(0,0,0,0.3)'
          : '0 2px 8px rgba(0,0,0,0.3)',
        opacity: opacity.current,
        transform: `rotate(${spin.current}deg)`,
        cursor: 'grab',
        touchAction: 'none',
        transition: 'box-shadow 300ms',
      }}
    />
  )
}
