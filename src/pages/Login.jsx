import { useState, useRef } from 'react'

export default function Login({ onSignIn }) {
  const [revving, setRevving] = useState(false)
  const titleRef = useRef(null)
  const trailRef = useRef(null)
  const dustRef = useRef(null)

  const handleSignIn = () => {
    setRevving(true)
    if (titleRef.current) {
      titleRef.current.style.animation = 'whimRevv 0.15s ease-in-out 3'
    }
    // After short rev, zoom off
    setTimeout(() => {
      if (titleRef.current) {
        titleRef.current.style.animation = 'whimZoom 0.5s cubic-bezier(0.4, 0, 0, 1) forwards'
      }
      if (trailRef.current) {
        trailRef.current.style.animation = 'whimTrail 0.8s ease-out forwards'
      }
      if (dustRef.current) {
        dustRef.current.style.animation = 'whimDust 0.7s ease-out forwards'
      }
    }, 500)
    setTimeout(() => onSignIn(), 1200)
  }

  return (
    <div className="h-full flex flex-col items-center justify-center" style={{ padding: '0 40px' }}>
      <style>{`
        @keyframes whimRevv {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-2px) rotate(-0.5deg); }
          75% { transform: translateX(2px) rotate(0.5deg); }
        }
        @keyframes whimZoom {
          0% { transform: translateX(0) scale(1); opacity: 1; }
          100% { transform: translateX(-120vw) scale(0.7); opacity: 0; }
        }
        @keyframes whimTrail {
          0% { opacity: 0; transform: translateY(-50%) translateX(0); }
          15% { opacity: 0.4; }
          100% { opacity: 0; transform: translateY(-70%) translateX(0); }
        }
        @keyframes whimDust {
          0% { opacity: 0; transform: scale(0.3); }
          20% { opacity: 0.3; }
          100% { opacity: 0; transform: scale(2.5) translateY(-10px); }
        }
      `}</style>
      <div className="text-center" style={{ marginTop: -60 }}>
        {/* Brand */}
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <h1 ref={titleRef} className="animate-task-enter" style={{
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 52,
            letterSpacing: '-0.04em', color: 'var(--text-primary)',
            animationDelay: '0ms',
          }}>Whim</h1>

          {/* Trail of m's — stays in place, drifts up slightly */}
          <span ref={trailRef} style={{
            position: 'absolute', left: '20%', top: '50%', transform: 'translateY(-50%)',
            fontFamily: 'var(--font-display)', fontWeight: 300, fontSize: 28,
            color: 'var(--text-ghost)', opacity: 0, whiteSpace: 'nowrap',
            letterSpacing: '0.12em', pointerEvents: 'none',
          }}>mmmmm</span>

          {/* Dust puff */}
          <div ref={dustRef} style={{
            position: 'absolute', left: '10%', top: '50%',
            width: 40, height: 40, marginTop: -20, marginLeft: -20,
            borderRadius: '50%', opacity: 0, pointerEvents: 'none',
            background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 40%, transparent 70%)',
          }} />
        </div>

        {/* Sign in button */}
        <button
          onClick={handleSignIn}
          disabled={revving}
          className="animate-task-enter"
          style={{
            display: 'flex', alignItems: 'center', gap: 12, margin: '48px auto 0',
            background: 'var(--surface-card)', borderRadius: 16, padding: '16px 28px',
            fontSize: 15, fontWeight: 500, color: 'var(--text-primary)',
            boxShadow: '0 0 0 1px var(--border-visible), 0 1px 2px rgba(0,0,0,0.15)',
            transition: 'all 200ms',
            animationDelay: '160ms',
            opacity: revving ? 0.5 : 1,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/>
            <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
          </svg>
          Sign in with Google
        </button>

        {/* Skip */}
        <button
          onClick={() => window.location.reload()}
          className="animate-task-enter"
          style={{
            marginTop: 24, fontSize: 12, color: 'var(--text-ghost)',
            letterSpacing: '0.02em',
            animationDelay: '240ms',
          }}
        >
          continue without account
        </button>
      </div>
    </div>
  )
}
