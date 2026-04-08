import { create } from 'zustand'
import { storage } from '../lib/storage'
import { uid, isToday, isFuture } from '../lib/utils'

const STORAGE_KEY = 'todos'

const loadTodos = () => storage.get(STORAGE_KEY) || []

export const useTodoStore = create((set, get) => ({
  todos: loadTodos(),

  addTodo: (text, { listId = null, spaceId = null, priority = 0, dueDate = null, userId = null } = {}) => {
    const todo = {
      id: uid(),
      text,
      status: 'active',
      priority,
      listId,
      spaceId,
      dueDate,
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
    return todo
  },

  updateTodo: (id, updates) => {
    set((state) => {
      const todos = state.todos.map((t) =>
        t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
      )
      storage.set(STORAGE_KEY, todos)
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
}))
