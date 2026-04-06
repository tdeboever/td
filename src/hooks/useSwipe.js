import { useRef, useCallback } from 'react'

const SWIPE_THRESHOLD = 50
const VELOCITY_THRESHOLD = 0.3

export function useSwipe({ onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown } = {}) {
  const touchStart = useRef(null)
  const touchStartTime = useRef(null)

  const onTouchStart = useCallback((e) => {
    const touch = e.touches[0]
    touchStart.current = { x: touch.clientX, y: touch.clientY }
    touchStartTime.current = Date.now()
  }, [])

  const onTouchEnd = useCallback(
    (e) => {
      if (!touchStart.current) return

      const touch = e.changedTouches[0]
      const dx = touch.clientX - touchStart.current.x
      const dy = touch.clientY - touchStart.current.y
      const dt = Date.now() - touchStartTime.current
      const velocity = Math.sqrt(dx * dx + dy * dy) / dt

      const absDx = Math.abs(dx)
      const absDy = Math.abs(dy)

      if (Math.max(absDx, absDy) < SWIPE_THRESHOLD && velocity < VELOCITY_THRESHOLD) {
        touchStart.current = null
        return
      }

      if (absDx > absDy) {
        if (dx > 0) onSwipeRight?.(dx, velocity)
        else onSwipeLeft?.(dx, velocity)
      } else {
        if (dy > 0) onSwipeDown?.(dy, velocity)
        else onSwipeUp?.(dy, velocity)
      }

      touchStart.current = null
    },
    [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]
  )

  return { onTouchStart, onTouchEnd }
}
