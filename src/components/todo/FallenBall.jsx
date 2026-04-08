import { useRef, useEffect, useState } from 'react'
import { useUiStore } from '../../stores/uiStore'
import BasketballMode from './BasketballMode'

const BALL_SIZE = 22
const GRAVITY = 0.7
const BOUNCE = 0.35
const FRICTION = 0.92
const FADE_AFTER = 5000

export default function FallenBall() {
  const ball = useUiStore((s) => s.completionBall)
  const clearBall = useUiStore((s) => s.clearBall)
  const [showBasketball, setShowBasketball] = useState(false)
  const [, forceRender] = useState(0)

  const px = useRef(0)
  const py = useRef(0)
  const vx = useRef(0)
  const vy = useRef(0)
  const tiltX = useRef(0)  // gyroscope
  const opacity = useRef(1)
  const settled = useRef(false)
  const frameId = useRef(null)
  const done = useRef(false)
  const startTime = useRef(0)

  const W = useRef(window.innerWidth)
  const H = useRef(window.innerHeight)

  useEffect(() => {
    if (!ball) return

    done.current = false
    settled.current = false
    px.current = ball.x
    py.current = ball.y
    vx.current = (Math.random() - 0.5) * 3 // slight random horizontal
    vy.current = 0
    opacity.current = 1
    startTime.current = Date.now()
    W.current = window.innerWidth
    H.current = window.innerHeight

    // Gyroscope — tilt influences gravity in both axes
    const tiltY = { current: 0 } // forward/back tilt affects gravity strength
    let gyroHandler = null
    if (window.DeviceOrientationEvent) {
      gyroHandler = (e) => {
        if (e.gamma !== null) tiltX.current = (e.gamma / 45) * 2
        if (e.beta !== null) {
          const normalBeta = 45
          tiltY.current = ((e.beta - normalBeta) / 45) * 1.0
        }
      }
      window.addEventListener('deviceorientation', gyroHandler)
    }

    const tick = () => {
      if (done.current) return
      frameId.current = requestAnimationFrame(tick)

      const elapsed = Date.now() - startTime.current

      // Apply gravity (modified by forward/back tilt) + horizontal tilt
      const effectiveGravity = GRAVITY + (tiltY.current * 0.5)
      vy.current += effectiveGravity
      vx.current += tiltX.current * 0.2
      vx.current *= FRICTION

      px.current += vx.current
      py.current += vy.current

      // Ceiling — ball can float up if tilted back hard enough
      if (py.current < BALL_SIZE / 2) { py.current = BALL_SIZE / 2; vy.current = Math.abs(vy.current) * 0.3 }

      // Floor — rests ON TOP of the input/nav area, not behind it
      const floor = H.current - 140
      if (py.current > floor) {
        py.current = floor
        vy.current = -vy.current * BOUNCE
        vx.current *= 0.8
        if (Math.abs(vy.current) < 1) {
          vy.current = 0
          settled.current = true
        }
        if (navigator.vibrate && Math.abs(vy.current) > 2) navigator.vibrate(3)
      }

      // Walls
      if (px.current < BALL_SIZE / 2) { px.current = BALL_SIZE / 2; vx.current = Math.abs(vx.current) * 0.6 }
      if (px.current > W.current - BALL_SIZE / 2) { px.current = W.current - BALL_SIZE / 2; vx.current = -Math.abs(vx.current) * 0.6 }

      // Fade after timeout
      if (elapsed > FADE_AFTER) {
        opacity.current = Math.max(0, 1 - (elapsed - FADE_AFTER) / 1000)
        if (opacity.current <= 0) {
          done.current = true
          clearBall()
          return
        }
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

  if (showBasketball) {
    return (
      <BasketballMode
        origin={{
          x: px.current, y: py.current,
          width: BALL_SIZE, height: BALL_SIZE,
          velocity: 0,
          // Skip morph — ball is already a ball, go straight to play
          skipMorph: true,
        }}
        onComplete={() => { setShowBasketball(false); clearBall() }}
        onCancel={() => { setShowBasketball(false); clearBall() }}
      />
    )
  }

  if (!ball) return null

  const handleGrab = (e) => {
    e.stopPropagation()
    done.current = true
    setShowBasketball(true)
  }

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
        border: '2px solid rgba(255,255,255,0.12)',
        background: 'rgba(255,255,255,0.04)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        opacity: opacity.current,
        cursor: 'grab',
        touchAction: 'none',
      }}
    />
  )
}
