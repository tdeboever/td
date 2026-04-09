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

function useVisibleTodos() {
  const todos = useTodoStore((s) => s.todos)
  return useMemo(() => {
    const now = new Date().toISOString()
    return todos.filter((t) => !t.snoozedUntil || t.snoozedUntil <= now)
  }, [todos])
}

// Today = due today + unscheduled (no date = available now)
function TodayView() {
  const visible = useVisibleTodos()
  const todos = useMemo(
    () => visible.filter((t) => !t.dueDate || isToday(t.dueDate)),
    [visible]
  )
  return (
    <TodoList todos={todos}
      emptyTitle="All clear"
      emptySubtitle="Nothing to do — enjoy it" />
  )
}

// Upcoming = future dates only
function UpcomingView() {
  const visible = useVisibleTodos()
  const todos = useMemo(
    () => visible
      .filter((t) => t.status === 'active' && isFuture(t.dueDate) && !isToday(t.dueDate))
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)),
    [visible]
  )
  return (
    <TodoList todos={todos}
      emptyTitle="Horizon is clear"
      emptySubtitle="Future tasks will show up here" />
  )
}

function SpaceView() {
  const activeSpaceId = useUiStore((s) => s.activeSpaceId)
  const visible = useVisibleTodos()
  const todos = useMemo(() => visible.filter((t) => t.spaceId === activeSpaceId), [visible, activeSpaceId])
  return (
    <TodoList todos={todos}
      emptyTitle="No tasks in this space"
      emptySubtitle="Add a task below" />
  )
}

function ListView() {
  const activeListId = useUiStore((s) => s.activeListId)
  const lists = useListStore((s) => s.lists)
  const visible = useVisibleTodos()
  const todos = useMemo(() => visible.filter((t) => t.listId === activeListId), [visible, activeListId])
  const list = lists.find((l) => l.id === activeListId)
  return (
    <TodoList todos={todos} isChecklist={list?.type === 'checklist'}
      emptyTitle={`No items in ${list?.name || 'this list'}`}
      emptySubtitle="Add one below" />
  )
}

const VIEWS = {
  today: TodayView,
  upcoming: UpcomingView,
  space: SpaceView,
  list: ListView,
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
