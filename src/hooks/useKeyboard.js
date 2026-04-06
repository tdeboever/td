import { useState, useEffect } from 'react'

export function useKeyboard() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (!('visualViewport' in window)) return

    const vv = window.visualViewport
    const handleResize = () => {
      // If viewport height is significantly less than window height, keyboard is likely open
      const threshold = window.innerHeight * 0.75
      setIsOpen(vv.height < threshold)
    }

    vv.addEventListener('resize', handleResize)
    return () => vv.removeEventListener('resize', handleResize)
  }, [])

  return { keyboardOpen: isOpen }
}
