import { useMemo, useEffect, useRef, useState } from 'react'
import AppShell from '../components/layout/AppShell'
import TodoList from '../components/todo/TodoList'
import TodoItem from '../components/todo/TodoItem'
import EmptyState from '../components/common/EmptyState'
import NotesList from '../components/todo/NotesList'
import { useTodoStore } from '../stores/todoStore'
import { useListStore } from '../stores/listStore'
import { useSpaceStore } from '../stores/spaceStore'
import { useUiStore } from '../stores/uiStore'
import { useAuth } from '../hooks/useAuth'
import { useSync } from '../hooks/useSync'
import { isSupabaseConfigured } from '../lib/supabase'
import { storage } from '../lib/storage'
import { isToday, isFuture, formatRelativeDate } from '../lib/utils'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import { useNotifications } from '../hooks/useNotifications'
import Login from './Login'
import Legal from './Legal'

// Today = tasks (not notes) due today + unscheduled, filtered by space
function TodayView() {
  const todos = useTodoStore((s) => s.todos)
  const lists = useListStore((s) => s.lists)
  const { activeSpaceId, activeListId } = useUiStore()

  // Checklist list IDs — items in checklists only show when viewing that specific list
  const checklistIds = useMemo(() => new Set(lists.filter(l => l.type === 'checklist').map(l => l.id)), [lists])

  const filtered = useMemo(() => {
    // Start with all tasks (not notes)
    // Checklist items hidden from Today UNLESS they have a due date (explicitly scheduled) or you're viewing that list
    let t = todos.filter((t) => t.type !== 'note')
    t = t.filter((t) => !t.listId || !checklistIds.has(t.listId) || t.listId === activeListId || !!t.dueDate)

    // Filter: due today OR no due date (actionable now)
    t = t.filter((t) => !t.dueDate || isToday(t.dueDate))

    // Space/list filter narrows further
    if (activeListId) t = t.filter((t) => t.listId === activeListId)
    else if (activeSpaceId) t = t.filter((t) => t.spaceId === activeSpaceId)

    return t
  }, [todos, activeSpaceId, activeListId, checklistIds])

  return <TodoList todos={filtered} emptyTitle="All clear" emptySubtitle="Nothing to do — enjoy it" />
}

// Upcoming = tasks with future dates
function UpcomingView() {
  const todos = useTodoStore((s) => s.todos)
  const { activeSpaceId, activeListId } = useUiStore()

  const filtered = useMemo(() => {
    let t = todos.filter((t) => t.type !== 'note' && t.status === 'active' && isFuture(t.dueDate) && !isToday(t.dueDate))
    if (activeListId) t = t.filter((t) => t.listId === activeListId)
    else if (activeSpaceId) t = t.filter((t) => t.spaceId === activeSpaceId)
    return t.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
  }, [todos, activeSpaceId, activeListId])

  return <TodoList todos={filtered} emptyTitle="Horizon is clear" emptySubtitle="Future tasks will show up here" />
}

// Notes = all notes, newest first, optionally filtered by space
function NotesView() {
  const todos = useTodoStore((s) => s.todos)
  const { activeSpaceId } = useUiStore()

  const notes = useMemo(() => {
    let n = todos.filter((t) => t.type === 'note')
    if (activeSpaceId) n = n.filter((t) => t.spaceId === activeSpaceId)
    return n.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }, [todos, activeSpaceId])

  return <NotesList notes={notes} />
}

// Space = full picture: overdue + today + upcoming, grouped by date section
function SpaceView() {
  const todos = useTodoStore((s) => s.todos)
  const lists = useListStore((s) => s.lists)
  const { activeSpaceId, activeListId } = useUiStore()
  const initialSynced = useUiStore((s) => s.initialSynced)

  const checklistIds = useMemo(() => new Set(lists.filter(l => l.type === 'checklist').map(l => l.id)), [lists])

  const { overdue, today, upcoming, done } = useMemo(() => {
    let t = todos.filter(t => t.type !== 'note')
    t = t.filter(t => !t.listId || !checklistIds.has(t.listId) || t.listId === activeListId || !!t.dueDate)
    if (activeListId) t = t.filter(t => t.listId === activeListId)
    else if (activeSpaceId) t = t.filter(t => t.spaceId === activeSpaceId)

    const active = t.filter(t => t.status === 'active')
    const nowDate = new Date(new Date().toDateString())

    return {
      overdue: active.filter(t => t.dueDate && !isToday(t.dueDate) && new Date(t.dueDate + 'T23:59:59') < nowDate).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)),
      today: active.filter(t => !t.dueDate || isToday(t.dueDate)).sort((a, b) => a.position - b.position),
      upcoming: active.filter(t => t.dueDate && isFuture(t.dueDate) && !isToday(t.dueDate)).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)),
      done: t.filter(t => t.status === 'done'),
    }
  }, [todos, activeSpaceId, activeListId, checklistIds])

  const total = overdue.length + today.length + upcoming.length
  if (!initialSynced) return null
  if (total === 0 && done.length === 0) return <EmptyState title="Empty space" subtitle="Add some tasks to get started" />

  const SectionLabel = ({ label, count, color }) => (
    <div className="flex items-center gap-3" style={{ padding: '16px 20px 6px' }}>
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: color || 'var(--text-secondary)' }}>{label}</span>
      {count > 0 && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-ghost)' }}>{count}</span>}
      <div className="flex-1 h-px" style={{ background: 'var(--border-subtle)' }} />
    </div>
  )

  return (
    <div className="animate-view-enter">
      {overdue.length > 0 && (
        <>
          <SectionLabel label="Overdue" count={overdue.length} color="var(--color-danger)" />
          {overdue.map((t, i) => <TodoItem key={t.id} todo={t} isLast={i === overdue.length - 1} />)}
        </>
      )}

      {today.length > 0 && (
        <>
          <SectionLabel label="Today" count={today.length} />
          {today.map((t, i) => <TodoItem key={t.id} todo={t} isLast={i === today.length - 1} />)}
        </>
      )}

      {upcoming.length > 0 && (
        <>
          <SectionLabel label="Upcoming" count={upcoming.length} />
          {upcoming.map((t, i) => <TodoItem key={t.id} todo={t} isLast={i === upcoming.length - 1} />)}
        </>
      )}

      {total === 0 && done.length > 0 && <EmptyState title="All clear" subtitle="Everything's done" />}

      {done.length > 0 && <SpaceDone done={done} />}
    </div>
  )
}

function SpaceDone({ done }) {
  const [show, setShow] = useState(false)
  return (
    <div style={{ marginTop: 24 }}>
      <button onClick={() => setShow(!show)} className="w-full flex items-center gap-3"
        style={{ padding: '8px 20px', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>
        <div className="flex-1 h-px" style={{ background: 'var(--border-subtle)' }} />
        <span style={{ letterSpacing: '0.08em' }}>Completed · {done.length} {show ? '▴' : '▾'}</span>
        <div className="flex-1 h-px" style={{ background: 'var(--border-subtle)' }} />
      </button>
      {show && done.map((t, i) => <TodoItem key={t.id} todo={t} isLast={i === done.length - 1} />)}
    </div>
  )
}

const VIEWS = { today: TodayView, upcoming: UpcomingView, notes: NotesView, space: SpaceView, list: SpaceView }

function AppContent({ userId = null }) {
  const activeView = useUiStore((s) => s.activeView)
  const ViewComponent = VIEWS[activeView] || TodayView
  useKeyboardShortcuts()
  useNotifications(userId)

  return <AppShell><ViewComponent /></AppShell>
}

export default function App() {
  const { user, loading, signIn } = useAuth()
  const [showLegal, setShowLegal] = useState(false)
  const scopedRef = useRef(null)

  // Scope localStorage by user ID BEFORE useSync runs
  if (user && scopedRef.current !== user.id) {
    storage.setUserId(user.id)
    useTodoStore.getState().reloadFromStorage()
    useListStore.getState().reloadFromStorage()
    useSpaceStore.getState().reloadFromStorage()
    scopedRef.current = user.id
  }

  useSync(user?.id ?? null)

  useEffect(() => { if (!isSupabaseConfigured()) useUiStore.setState({ initialSynced: true }) }, [])
  if (!isSupabaseConfigured()) return <AppContent />
  if (loading) return <div className="h-full flex items-center justify-center" style={{ background: 'var(--bg-deep)' }}><div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Loading...</div></div>
  if (showLegal) return <Legal onBack={() => setShowLegal(false)} />
  if (!user) return <Login onSignIn={signIn} onLegal={() => setShowLegal(true)} />
  return <AppContent userId={user.id} />
}
