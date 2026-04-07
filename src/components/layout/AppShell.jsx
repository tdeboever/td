import { useCallback } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import UndoToast from '../todo/UndoToast'
import TodoInput from '../todo/TodoInput'
import ParticleCanvas from '../todo/ParticleCanvas'
import { useUiStore } from '../../stores/uiStore'
import { useSwipe } from '../../hooks/useSwipe'

const VIEW_ORDER = ['inbox', 'today', 'upcoming']

export default function AppShell({ children }) {
  const { inputFocused, activeView, setView } = useUiStore()

  const swipeToView = useCallback((direction) => {
    const idx = VIEW_ORDER.indexOf(activeView)
    if (idx === -1) return
    const next = idx + direction
    if (next >= 0 && next < VIEW_ORDER.length) setView(VIEW_ORDER[next])
  }, [activeView, setView])

  const swipeHandlers = useSwipe({
    onSwipeLeft: () => swipeToView(1),
    onSwipeRight: () => swipeToView(-1),
  })

  return (
    <div className="h-full flex justify-center">
      <div className="app-shell w-full max-w-[480px] h-full flex flex-col relative overflow-hidden">
        <Sidebar />
        <Header />
        <main className="flex-1 min-h-0 overflow-y-auto no-scrollbar" {...swipeHandlers}>
          {children}
        </main>
        <div className="border-t" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
          <TodoInput />
          {!inputFocused && <BottomNav />}
        </div>
        <UndoToast />
        <ParticleCanvas />
      </div>
    </div>
  )
}
