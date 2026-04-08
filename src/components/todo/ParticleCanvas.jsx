import { useEffect, useRef } from 'react'

const GRAVITY = 0.12
const FRICTION = 0.985

class Particle {
  constructor(x, y, vx, vy, color, size, shape = 'square', life = 1) {
    this.x = x
    this.y = y
    this.vx = vx
    this.vy = vy
    this.color = color
    this.size = size
    this.shape = shape
    this.life = life
    this.decay = 0.012 + Math.random() * 0.018
    this.rotation = Math.random() * Math.PI * 2
    this.rotationSpeed = (Math.random() - 0.5) * 0.3
    this.gravity = GRAVITY
  }

  update() {
    this.x += this.vx
    this.y += this.vy
    this.vy += this.gravity
    this.vx *= FRICTION
    this.life -= this.decay
    this.rotation += this.rotationSpeed
  }

  draw(ctx) {
    if (this.life <= 0) return
    ctx.save()
    ctx.translate(this.x, this.y)
    ctx.rotate(this.rotation)
    ctx.globalAlpha = Math.max(0, this.life)
    ctx.fillStyle = this.color

    if (this.shape === 'circle') {
      ctx.beginPath()
      ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2)
      ctx.fill()
    } else {
      ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size)
    }
    ctx.restore()
  }
}

const COLORS = ['#ff7b54', '#f472b6', '#60a5fa', '#4ade80', '#fbbf24', '#a78bfa', '#f4f0ed']
const SMOKE_COLORS = ['#222', '#333', '#444', '#555']

let particles = []
let animating = false
let canvasRef = null
let ctxRef = null

function animate() {
  if (!ctxRef || !canvasRef) return
  const ctx = ctxRef
  ctx.clearRect(0, 0, canvasRef.width, canvasRef.height)

  particles = particles.filter((p) => p.life > 0)
  for (const p of particles) { p.update(); p.draw(ctx) }

  if (particles.length > 0) {
    requestAnimationFrame(animate)
  } else {
    animating = false
    ctx.clearRect(0, 0, canvasRef.width, canvasRef.height)
  }
}

function startAnim() {
  if (!animating) { animating = true; requestAnimationFrame(animate) }
}

// === PUBLIC EFFECTS API ===

// Classic explosion burst
export function emitExplosion(x, y, velocity, count = 40) {
  const speed = Math.min(velocity / 50, 18)
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.8
    const v = speed * (0.3 + Math.random() * 0.7)
    const color = COLORS[Math.floor(Math.random() * COLORS.length)]
    const size = 2 + Math.random() * (speed > 10 ? 8 : 5)
    particles.push(new Particle(x, y, Math.cos(angle) * v, Math.sin(angle) * v - 2, color, size))
  }
  startAnim()
}

// Rocket exhaust trail — emits downward particles from a point
export function emitExhaust(x, y) {
  for (let i = 0; i < 5; i++) {
    const vx = (Math.random() - 0.5) * 3
    const vy = 2 + Math.random() * 4
    const color = i < 2 ? '#ff6b35' : SMOKE_COLORS[Math.floor(Math.random() * SMOKE_COLORS.length)]
    const p = new Particle(x + (Math.random() - 0.5) * 10, y, vx, vy, color, 3 + Math.random() * 4, 'circle')
    p.gravity = 0.05
    p.decay = 0.03 + Math.random() * 0.02
    particles.push(p)
  }
  startAnim()
}

// Starburst at a point (for rocket endpoint)
export function emitStarburst(x, y) {
  for (let i = 0; i < 30; i++) {
    const angle = (Math.PI * 2 * i) / 30
    const v = 3 + Math.random() * 6
    const color = COLORS[Math.floor(Math.random() * COLORS.length)]
    const p = new Particle(x, y, Math.cos(angle) * v, Math.sin(angle) * v, color, 2 + Math.random() * 4)
    p.gravity = 0.08
    particles.push(p)
  }
  startAnim()
}

// Vortex implosion then burst
export function emitVortex(x, y) {
  // Converging ring — two waves
  for (let wave = 0; wave < 2; wave++) {
    setTimeout(() => {
      for (let i = 0; i < 16; i++) {
        const angle = (Math.PI * 2 * i) / 16 + wave * 0.2
        const dist = 60 + wave * 30 + Math.random() * 20
        const speed = 5 + wave * 2
        const p = new Particle(
          x + Math.cos(angle) * dist,
          y + Math.sin(angle) * dist,
          -Math.cos(angle) * speed,
          -Math.sin(angle) * speed,
          COLORS[Math.floor(Math.random() * COLORS.length)],
          3 + Math.random() * 4,
          'circle'
        )
        p.gravity = 0
        p.decay = 0.02
        particles.push(p)
      }
      startAnim()
    }, wave * 120)
  }
  // Big delayed burst
  setTimeout(() => {
    emitExplosion(x, y, 900, 35)
  }, 350)
}

// Crumple trail — small particles along an arc
export function emitTrail(x, y, count = 3) {
  for (let i = 0; i < count; i++) {
    const p = new Particle(
      x + (Math.random() - 0.5) * 8,
      y + (Math.random() - 0.5) * 8,
      (Math.random() - 0.5) * 1.5,
      (Math.random() - 0.5) * 1.5,
      '#ff6b3580',
      2 + Math.random() * 2,
      'circle'
    )
    p.gravity = 0.02
    p.decay = 0.04
    particles.push(p)
  }
  startAnim()
}

export default function ParticleCanvas() {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    resize()
    window.addEventListener('resize', resize)
    canvasRef = canvas
    ctxRef = canvas.getContext('2d')
    return () => { window.removeEventListener('resize', resize); canvasRef = null; ctxRef = null }
  }, [])

  return <canvas ref={ref} className="fixed inset-0 z-50 pointer-events-none" style={{ width: '100%', height: '100%' }} />
}
