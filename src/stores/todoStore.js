import { create } from 'zustand'
import { storage } from '../lib/storage'
import { uid, isToday, isFuture } from '../lib/utils'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

const STORAGE_KEY = 'todos'

const loadTodos = () => storage.get(STORAGE_KEY) || []

// Push a single todo update to Supabase immediately (fire-and-forget)
const SNAKE_MAP = { listId: 'list_id', spaceId: 'space_id', dueDate: 'due_date', dueTime: 'due_time', snoozedUntil: 'snoozed_until', completionCount: 'completion_count', lastCompletedAt: 'last_completed_at', lastNotifiedAt: 'last_notified_at', createdAt: 'created_at', updatedAt: 'updated_at', userId: 'user_id' }
const VALID_COLS = new Set(['id', 'text', 'type', 'status', 'priority', 'list_id', 'space_id', 'due_date', 'due_time', 'subtasks', 'snoozed_until', 'position', 'completion_count', 'last_completed_at', 'last_notified_at', 'user_id', 'created_at', 'updated_at'])

const pushToSupabase = (todo) => {
  if (!isSupabaseConfigured()) return
  const snake = {}
  for (const [k, v] of Object.entries(todo)) {
    const col = SNAKE_MAP[k] || k
    if (VALID_COLS.has(col)) snake[col] = v
  }
  supabase.from('todos').upsert(snake, { onConflict: 'id' }).then(({ error }) => {
    if (error) console.error('Push todo error:', error.message, snake.id)
  })
}

export const useTodoStore = create((set, get) => ({
  todos: loadTodos(),

  addTodo: (text, { type = 'task', listId = null, spaceId = null, priority = 0, dueDate = null, dueTime = null, userId = null } = {}) => {
    const todo = {
      id: uid(),
      text,
      type,
      status: 'active',
      priority: type === 'note' ? 0 : priority,
      listId,
      spaceId,
      dueDate,
      dueTime,
      subtasks: [],
      snoozedUntil: null,
      position: get().todos.filter((t) => t.status === 'active').length,
      completionCount: 0,
      lastCompletedAt: null,
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    set((state) => {
      const todos = [...state.todos, todo]
      storage.set(STORAGE_KEY, todos)
      return { todos }
    })
    pushToSupabase(todo)
    return todo
  },

  updateTodo: (id, updates) => {
    set((state) => {
      // Clear last_notified_at when time changes so notifications re-fire
      const extra = (updates.dueTime !== undefined) ? { lastNotifiedAt: null } : {}
      const todos = state.todos.map((t) =>
        t.id === id ? { ...t, ...updates, ...extra, updatedAt: new Date().toISOString() } : t
      )
      storage.set(STORAGE_KEY, todos)
      const updated = todos.find(t => t.id === id)
      if (updated) pushToSupabase(updated)
      return { todos }
    })
  },

  completeTodo: (id) => {
    set((state) => {
      const todos = state.todos.map((t) => {
        if (t.id !== id) return t
        return {
          ...t,
          status: 'done',
          completionCount: t.completionCount + 1,
          lastCompletedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      })
      storage.set(STORAGE_KEY, todos)
      return { todos }
    })
  },

  uncompleteTodo: (id) => {
    set((state) => {
      const todos = state.todos.map((t) =>
        t.id === id
          ? { ...t, status: 'active', lastCompletedAt: null, updatedAt: new Date().toISOString() }
          : t
      )
      storage.set(STORAGE_KEY, todos)
      return { todos }
    })
  },

  // For checklist mode: complete → ghost
  ghostTodo: (id) => {
    set((state) => {
      const todos = state.todos.map((t) => {
        if (t.id !== id) return t
        return {
          ...t,
          status: 'ghost',
          completionCount: t.completionCount + 1,
          lastCompletedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      })
      storage.set(STORAGE_KEY, todos)
      return { todos }
    })
  },

  reactivateTodo: (id) => {
    set((state) => {
      const todos = state.todos.map((t) =>
        t.id === id ? { ...t, status: 'active', updatedAt: new Date().toISOString() } : t
      )
      storage.set(STORAGE_KEY, todos)
      return { todos }
    })
  },

  snoozeTodo: (id, snoozedUntil) => {
    set((state) => {
      const todos = state.todos.map((t) =>
        t.id === id ? { ...t, snoozedUntil, updatedAt: new Date().toISOString() } : t
      )
      storage.set(STORAGE_KEY, todos)
      return { todos }
    })
  },

  deleteTodo: (id) => {
    set((state) => {
      const todos = state.todos.filter((t) => t.id !== id)
      storage.set(STORAGE_KEY, todos)
      return { todos }
    })
    if (isSupabaseConfigured()) {
      supabase.from('todos').delete().eq('id', id).then(({ error }) => {
        if (error) console.error('Delete todo error:', error.message)
      })
    }
  },

  reorderTodos: (orderedIds) => {
    set((state) => {
      const todos = state.todos.map((t) => {
        const idx = orderedIds.indexOf(t.id)
        return idx !== -1 ? { ...t, position: idx, updatedAt: new Date().toISOString() } : t
      })
      storage.set(STORAGE_KEY, todos)
      return { todos }
    })
  },

  resetList: (listId) => {
    set((state) => {
      const todos = state.todos.map((t) =>
        t.listId === listId && t.status !== 'active'
          ? { ...t, status: 'active', updatedAt: new Date().toISOString() }
          : t
      )
      storage.set(STORAGE_KEY, todos)
      return { todos }
    })
  },

  // Selectors
  getVisibleTodos: () => {
    const now = new Date().toISOString()
    return get().todos.filter(
      (t) => !t.snoozedUntil || t.snoozedUntil <= now
    )
  },

  getInboxTodos: () => {
    return get()
      .getVisibleTodos()
      .filter((t) => !t.listId && !t.spaceId && t.status === 'active')
  },

  getTodayTodos: () => {
    return get()
      .getVisibleTodos()
      .filter((t) => t.status === 'active' && isToday(t.dueDate))
  },

  getUpcomingTodos: () => {
    return get()
      .getVisibleTodos()
      .filter((t) => t.status === 'active' && isFuture(t.dueDate) && !isToday(t.dueDate))
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
  },

  getListTodos: (listId) => {
    return get()
      .getVisibleTodos()
      .filter((t) => t.listId === listId)
  },

  getSpaceTodos: (spaceId) => {
    return get()
      .getVisibleTodos()
      .filter((t) => t.spaceId === spaceId)
  },

  getAutocompleteItems: (listId) => {
    return get()
      .todos.filter((t) => t.listId === listId && t.completionCount > 0)
      .sort((a, b) => b.completionCount - a.completionCount)
      .map((t) => t.text)
      .filter((text, i, arr) => arr.indexOf(text) === i)
  },

  reloadFromStorage: () => {
    set({ todos: loadTodos() })
  },
}))
