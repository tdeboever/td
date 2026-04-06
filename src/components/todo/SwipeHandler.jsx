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

  const clampedOffset = Math.max(-150, Math.min(150, offset))
  const rightProgress = Math.min(1, Math.max(0, clampedOffset / THRESHOLD))
  const leftProgress = Math.min(1, Math.max(0, -clampedOffset / THRESHOLD))

  return (
    <div className="relative overflow-hidden" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      {/* Right swipe background (complete) */}
      {clampedOffset > 0 && (
        <div
          className="absolute inset-y-0 left-0 flex items-center pl-4 text-white text-sm font-medium"
          style={{
            width: clampedOffset,
            backgroundColor: `rgba(48, 209, 88, ${rightProgress})`,
          }}
        >
          {rightProgress >= 1 && '✓'}
        </div>
      )}

      {/* Left swipe background (snooze) */}
      {clampedOffset < 0 && (
        <div
          className="absolute inset-y-0 right-0 flex items-center justify-end pr-4 text-white text-sm font-medium"
          style={{
            width: -clampedOffset,
            backgroundColor: `rgba(255, 159, 10, ${leftProgress})`,
          }}
        >
          {leftProgress >= 1 && '💤'}
        </div>
      )}

      <div
        className="relative bg-bg transition-transform"
        style={{
          transform: swiping ? `translateX(${clampedOffset}px)` : 'translateX(0)',
          transition: swiping ? 'none' : 'transform 200ms ease-out',
        }}
      >
        {children}
      </div>
    </div>
  )
}
