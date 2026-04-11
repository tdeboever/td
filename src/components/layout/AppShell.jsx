import { useCallback } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import UndoToast from '../todo/UndoToast'
import TodoInput from '../todo/TodoInput'
import ParticleCanvas from '../todo/ParticleCanvas'
import FallenBall from '../todo/FallenBall'
import SpaceRow from './SpaceRow'
import InstallPrompt from '../common/InstallPrompt'
import OfflineIndicator from '../common/OfflineIndicator'
import { useUiStore } from '../../stores/uiStore'
import { useSwipe } from '../../hooks/useSwipe'

const VIEW_ORDER = ['today', 'upcoming', 'notes']

export default function AppShell({ children }) {
  const inputFocused = useUiStore((s) => s.inputFocused)
  const { activeView, setView, toggleSidebar } = useUiStore()

  const swipeToView = useCallback((direction) => {
    const idx = VIEW_ORDER.indexOf(activeView)
    const current = idx === -1 ? 0 : idx
    const next = current + direction
    if (next < 0) { toggleSidebar(); return }
    if (next >= 0 && next < VIEW_ORDER.length) setView(VIEW_ORDER[next])
  }, [activeView, setView, toggleSidebar])

  const swipeHandlers = useSwipe({
    onSwipeLeft: () => swipeToView(1),
    onSwipeRight: () => swipeToView(-1),
  })

  return (
    <div style={{ height: '100dvh', overflow: 'hidden' }} className="flex justify-center">
      <div className="app-shell w-full max-w-[480px] flex flex-col relative" style={{ height: '100%', overflow: 'hidden' }}>
        <OfflineIndicator />
        <Sidebar />
        <Header />
        <SpaceRow />
        <main className="flex-1 min-h-0 overflow-y-auto no-scrollbar">
          {children}
        </main>
        <div {...swipeHandlers} style={{ borderTop: '1px solid rgba(255,255,255,0.04)', flexShrink: 0 }}>
          <TodoInput />
          {!inputFocused && <BottomNav />}
        </div>
        <UndoToast />
        <FallenBall />
        <ParticleCanvas />
        <InstallPrompt />
      </div>
    </div>
  )
}
