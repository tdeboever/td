import AppShell from '../components/layout/AppShell'
import TodoList from '../components/todo/TodoList'
import TodoInput from '../components/todo/TodoInput'
import { useTodoStore } from '../stores/todoStore'
import { useListStore } from '../stores/listStore'
import { useUiStore } from '../stores/uiStore'
import { useAuth } from '../hooks/useAuth'
import { useSync } from '../hooks/useSync'
import { isSupabaseConfigured } from '../lib/supabase'
import Login from './Login'

function InboxView() {
  const todos = useTodoStore((s) => s.getInboxTodos())
  return (
    <TodoList
      todos={todos}
      emptyIcon="📥"
      emptyTitle="Inbox is empty"
      emptySubtitle="Tasks without a space land here"
    />
  )
}

function TodayView() {
  const todos = useTodoStore((s) => s.getTodayTodos())
  return (
    <TodoList
      todos={todos}
      emptyIcon="📅"
      emptyTitle="Nothing due today"
      emptySubtitle="Set a due date to see tasks here"
    />
  )
}

function UpcomingView() {
  const todos = useTodoStore((s) => s.getUpcomingTodos())
  return (
    <TodoList
      todos={todos}
      emptyIcon="🗓️"
      emptyTitle="No upcoming tasks"
      emptySubtitle="Tasks with future dates appear here"
    />
  )
}

function SpaceView() {
  const activeSpaceId = useUiStore((s) => s.activeSpaceId)
  const todos = useTodoStore((s) => s.getSpaceTodos(activeSpaceId))
  return (
    <TodoList
      todos={todos}
      emptyIcon="📁"
      emptyTitle="No tasks in this space"
      emptySubtitle="Add a task below"
    />
  )
}

function ListView() {
  const activeListId = useUiStore((s) => s.activeListId)
  const lists = useListStore((s) => s.lists)
  const todos = useTodoStore((s) => s.getListTodos(activeListId))
  const list = lists.find((l) => l.id === activeListId)
  const isChecklist = list?.type === 'checklist'

  return (
    <TodoList
      todos={todos}
      isChecklist={isChecklist}
      emptyIcon={isChecklist ? '☑️' : '📋'}
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

  return (
    <AppShell>
      <ViewComponent />
      <TodoInput />
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
