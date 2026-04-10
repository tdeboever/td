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

export default function AppShell({ children }) {
  const inputFocused = useUiStore((s) => s.inputFocused)

  return (
    <div className="h-full flex justify-center">
      <div className="app-shell w-full max-w-[480px] h-full flex flex-col relative overflow-hidden">
        <OfflineIndicator />
        <Sidebar />
        <Header />
        <SpaceRow />
        <main className="flex-1 min-h-0 overflow-y-auto no-scrollbar">
          {children}
        </main>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <TodoInput />
          <BottomNav hidden={inputFocused} />
        </div>
        <UndoToast />
        <FallenBall />
        <ParticleCanvas />
        <InstallPrompt />
      </div>
    </div>
  )
}
