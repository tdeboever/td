import { useMemo } from 'react'
import AppShell from '../components/layout/AppShell'
import TodoList from '../components/todo/TodoList'
import { useTodoStore } from '../stores/todoStore'
import { useListStore } from '../stores/listStore'
import { useUiStore } from '../stores/uiStore'
import { useAuth } from '../hooks/useAuth'
import { useSync } from '../hooks/useSync'
import { isSupabaseConfigured } from '../lib/supabase'
import { isToday, isFuture } from '../lib/utils'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import { useNotifications } from '../hooks/useNotifications'
import Login from './Login'

// Today = due today + unscheduled, optionally filtered by space/list
function TodayView() {
  const todos = useTodoStore((s) => s.todos)
  const { activeSpaceId, activeListId } = useUiStore()

  const filtered = useMemo(() => {
    let t = todos.filter((t) => !t.dueDate || isToday(t.dueDate))
    if (activeListId) t = t.filter((t) => t.listId === activeListId)
    else if (activeSpaceId) t = t.filter((t) => t.spaceId === activeSpaceId)
    return t
  }, [todos, activeSpaceId, activeListId])

  return (
    <TodoList todos={filtered}
      emptyTitle="All clear"
      emptySubtitle="Nothing to do — enjoy it" />
  )
}

// Upcoming = future dates, optionally filtered by space/list
function UpcomingView() {
  const todos = useTodoStore((s) => s.todos)
  const { activeSpaceId, activeListId } = useUiStore()

  const filtered = useMemo(() => {
    let t = todos.filter((t) => t.status === 'active' && isFuture(t.dueDate) && !isToday(t.dueDate))
    if (activeListId) t = t.filter((t) => t.listId === activeListId)
    else if (activeSpaceId) t = t.filter((t) => t.spaceId === activeSpaceId)
    return t.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
  }, [todos, activeSpaceId, activeListId])

  return (
    <TodoList todos={filtered}
      emptyTitle="Horizon is clear"
      emptySubtitle="Future tasks will show up here" />
  )
}

const VIEWS = {
  today: TodayView,
  upcoming: UpcomingView,
}

function AppContent() {
  const activeView = useUiStore((s) => s.activeView)
  const ViewComponent = VIEWS[activeView] || TodayView
  useKeyboardShortcuts()
  useNotifications()

  return (
    <AppShell>
      <ViewComponent />
    </AppShell>
  )
}

export default function App() {
  const { user, loading, signIn } = useAuth()
  useSync(user?.id ?? null)

  if (!isSupabaseConfigured()) return <AppContent />

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center" style={{ background: 'var(--bg-deep)' }}>
        <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Loading...</div>
      </div>
    )
  }

  if (!user) return <Login onSignIn={signIn} />
  return <AppContent />
}
