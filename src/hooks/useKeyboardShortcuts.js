import { useEffect } from 'react'
import { useUiStore } from '../stores/uiStore'

export function useKeyboardShortcuts() {
  const { setView, executeUndo, undoAction } = useUiStore.getState()

  useEffect(() => {
    const handler = (e) => {
      // Don't fire shortcuts when typing in an input
      const tag = e.target.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return

      // 1/2/3 = switch views
      if (e.key === '1') { e.preventDefault(); useUiStore.getState().setView('inbox') }
      if (e.key === '2') { e.preventDefault(); useUiStore.getState().setView('today') }
      if (e.key === '3') { e.preventDefault(); useUiStore.getState().setView('upcoming') }

      // / = focus search (find the search button and click it)
      if (e.key === '/') {
        e.preventDefault()
        document.querySelector('[data-search-trigger]')?.click()
      }

      // Cmd+Z / Ctrl+Z = undo
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault()
        const { undoAction, executeUndo } = useUiStore.getState()
        if (undoAction) executeUndo()
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])
}
