import Header from './Header'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import UndoToast from '../todo/UndoToast'

export default function AppShell({ children }) {
  return (
    <div className="h-full flex flex-col bg-bg relative">
      <Sidebar />
      <Header />
      <main className="flex-1 overflow-y-auto no-scrollbar">{children}</main>
      <BottomNav />
      <UndoToast />
    </div>
  )
}
