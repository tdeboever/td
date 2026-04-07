import { useRef, useState, useCallback } from 'react'

const THRESHOLD = 80

export default function SwipeHandler({ onSwipeRight, onSwipeLeft, children }) {
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
    setOffset(dx)
  }, [])

  const onTouchEnd = useCallback(() => {
    if (offset > THRESHOLD && onSwipeRight) {
      onSwipeRight()
    } else if (offset < -THRESHOLD && onSwipeLeft) {
      onSwipeLeft()
    }
    setOffset(0)
    setSwiping(false)
    startX.current = null
  }, [offset, onSwipeRight, onSwipeLeft])

  const clampedOffset = Math.max(-120, Math.min(120, offset))
  const rightProgress = Math.min(1, Math.max(0, clampedOffset / THRESHOLD))
  const leftProgress = Math.min(1, Math.max(0, -clampedOffset / THRESHOLD))

  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Right swipe background (complete) */}
      {clampedOffset > 0 && (
        <div
          className="absolute inset-y-0 left-0 flex items-center pl-5 rounded-2xl"
          style={{
            width: clampedOffset,
            backgroundColor: `rgba(34, 197, 94, ${rightProgress * 0.9})`,
          }}
        >
          {rightProgress >= 0.8 && (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" className="animate-in">
              <path d="M3 9.5l4 4L15 5" />
            </svg>
          )}
        </div>
      )}

      {/* Left swipe background (snooze) */}
      {clampedOffset < 0 && (
        <div
          className="absolute inset-y-0 right-0 flex items-center justify-end pr-5 rounded-2xl"
          style={{
            width: -clampedOffset,
            backgroundColor: `rgba(99, 102, 241, ${leftProgress * 0.9})`,
          }}
        >
          {leftProgress >= 0.8 && (
            <span className="text-white text-sm animate-in">💤</span>
          )}
        </div>
      )}

      <div
        className="relative"
        style={{
          transform: swiping ? `translateX(${clampedOffset}px)` : 'translateX(0)',
          transition: swiping ? 'none' : 'transform 250ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {children}
      </div>
    </div>
  )
}
