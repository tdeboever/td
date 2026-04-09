import { useRef, useState, useCallback } from 'react'

/*
  Swipe LEFT → reveals time/action buttons on the RIGHT
  Swipe RIGHT → reveals space/move buttons on the LEFT

  Props:
    leftActions: [{ label, color, icon?, onAction }]  — revealed on swipe RIGHT
    rightActions: [{ label, color, icon?, onAction }]  — revealed on swipe LEFT
    children: the task content
*/

const THRESHOLD = 60
const BUTTON_W = 72

export default function SwipeActions({ leftActions = [], rightActions = [], children }) {
  const startX = useRef(null)
  const [offset, setOffset] = useState(0)
  const [swiping, setSwiping] = useState(false)

  const onTouchStart = useCallback((e) => {
    startX.current = e.touches[0].clientX
    setSwiping(true)
  }, [])

  const onTouchMove = useCallback((e) => {
    if (startX.current === null) return
    const dx = e.touches[0].clientX - startX.current
    // Limit swipe distance
    const maxRight = leftActions.length * BUTTON_W
    const maxLeft = rightActions.length * BUTTON_W
    const clamped = Math.max(-maxLeft, Math.min(maxRight, dx * 0.8))
    setOffset(clamped)
    if (Math.abs(dx) > 10) e.stopPropagation()
  }, [leftActions.length, rightActions.length])

  const onTouchEnd = useCallback(() => {
    // Check if swiped enough to reveal actions, otherwise snap back
    if (Math.abs(offset) < THRESHOLD) {
      setOffset(0)
    }
    // Keep revealed — user can tap a button
    // If swiped far enough to a specific action, trigger it
    if (offset > 0 && leftActions.length > 0) {
      const idx = Math.min(leftActions.length - 1, Math.floor(offset / BUTTON_W))
      if (offset > BUTTON_W * 0.7) {
        // Keep open for tapping
      }
    }
    if (offset < 0 && rightActions.length > 0) {
      // Keep open for tapping
    }

    setSwiping(false)
    startX.current = null

    // Snap to nearest position: closed or open
    if (Math.abs(offset) >= THRESHOLD) {
      const target = offset > 0 ? Math.min(leftActions.length * BUTTON_W, offset) : Math.max(-rightActions.length * BUTTON_W, offset)
      setOffset(target > 0 ? leftActions.length * BUTTON_W : -rightActions.length * BUTTON_W)
    } else {
      setOffset(0)
    }
  }, [offset, leftActions, rightActions])

  const close = () => setOffset(0)

  return (
    <div className="relative overflow-hidden" style={{ borderRadius: 0 }}>
      {/* LEFT actions (revealed on swipe right) — spaces */}
      {leftActions.length > 0 && (
        <div className="absolute inset-y-0 left-0 flex" style={{ zIndex: 0 }}>
          {leftActions.map((action, i) => (
            <button key={i} onClick={() => { action.onAction(); close() }}
              className="flex flex-col items-center justify-center gap-1"
              style={{
                width: BUTTON_W, height: '100%',
                background: action.color || 'var(--surface-active)',
                fontSize: 10, fontWeight: 600, color: 'white',
                opacity: offset > (i * BUTTON_W + 20) ? 1 : 0.3,
                transition: swiping ? 'none' : 'opacity 150ms',
              }}>
              {action.icon && <span style={{ fontSize: 16 }}>{action.icon}</span>}
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* RIGHT actions (revealed on swipe left) — time/actions */}
      {rightActions.length > 0 && (
        <div className="absolute inset-y-0 right-0 flex" style={{ zIndex: 0 }}>
          {rightActions.map((action, i) => (
            <button key={i} onClick={() => { action.onAction(); close() }}
              className="flex flex-col items-center justify-center gap-1"
              style={{
                width: BUTTON_W, height: '100%',
                background: action.color || 'var(--surface-active)',
                fontSize: 10, fontWeight: 600, color: 'white',
                opacity: -offset > (i * BUTTON_W + 20) ? 1 : 0.3,
                transition: swiping ? 'none' : 'opacity 150ms',
              }}>
              {action.icon && <span style={{ fontSize: 16 }}>{action.icon}</span>}
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Main content — slides */}
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={offset !== 0 ? close : undefined}
        style={{
          position: 'relative', zIndex: 1,
          transform: `translateX(${offset}px)`,
          transition: swiping ? 'none' : 'transform 250ms cubic-bezier(0.16,1,0.3,1)',
          background: 'var(--bg-deep)',
        }}
      >
        {children}
      </div>
    </div>
  )
}
