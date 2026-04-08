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

function InboxView() {
  const visible = useVisibleTodos()
  const todos = useMemo(
    () => visible.filter((t) => !t.listId && !t.spaceId),
    [visible]
  )
  return (
    <TodoList
      todos={todos}

      emptyTitle="Nothing here yet"
      emptySubtitle="Capture a thought — tap below"
    />
  )
}

function TodayView() {
  const visible = useVisibleTodos()
  const todos = useMemo(
    () => visible.filter((t) => t.status === 'active' && isToday(t.dueDate)),
    [visible]
  )
  return (
    <TodoList
      todos={todos}

      emptyTitle="Today is clear"
      emptySubtitle="Nothing on the schedule — enjoy it"
    />
  )
}

function UpcomingView() {
  const visible = useVisibleTodos()
  const todos = useMemo(
    () =>
      visible
        .filter((t) => t.status === 'active' && isFuture(t.dueDate) && !isToday(t.dueDate))
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)),
    [visible]
  )
  return (
    <TodoList
      todos={todos}

      emptyTitle="Horizon is clear"
      emptySubtitle="Future tasks will show up here"
    />
  )
}

function SpaceView() {
  const activeSpaceId = useUiStore((s) => s.activeSpaceId)
  const visible = useVisibleTodos()
  const todos = useMemo(
    () => visible.filter((t) => t.spaceId === activeSpaceId),
    [visible, activeSpaceId]
  )
  return (
    <TodoList
      todos={todos}

      emptyTitle="No tasks in this space"
      emptySubtitle="Add a task below"
    />
  )
}

function ListView() {
  const activeListId = useUiStore((s) => s.activeListId)
  const lists = useListStore((s) => s.lists)
  const visible = useVisibleTodos()
  const todos = useMemo(
    () => visible.filter((t) => t.listId === activeListId),
    [visible, activeListId]
  )
  const list = lists.find((l) => l.id === activeListId)
  const isChecklist = list?.type === 'checklist'

  return (
    <TodoList
      todos={todos}
      isChecklist={isChecklist}

      emptyTitle={`No items in ${list?.name || 'this list'}`}
      emptySubtitle="Add one below"
    />
  )
}

const VIEWS = {
  inbox: InboxView,
  today: TodayView,
  upcoming: UpcomingView,
  space: SpaceView,
  list: ListView,
}

function AppContent() {
  const activeView = useUiStore((s) => s.activeView)
  const ViewComponent = VIEWS[activeView] || InboxView
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

  // Sync when user is authenticated
  useSync(user?.id ?? null)

  // If Supabase isn't configured, skip auth — run local-only
  if (!isSupabaseConfigured()) {
    return <AppContent />
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-bg">
        <div className="text-text-dim text-sm">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return <Login onSignIn={signIn} />
  }

  return <AppContent />
}
