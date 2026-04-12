import { create } from 'zustand'

export const useUiStore = create((set, get) => ({
  // Navigation
  activeView: 'today', // 'today' | 'upcoming'
  activeSpaceId: null,  // filter — null means show all
  activeListId: null,   // filter — null means show all in space

  // Sidebar
  sidebarOpen: false,

  // Input focus
  inputFocused: false,
  setInputFocused: (v) => set({ inputFocused: v }),

  // Sync state — hides empty states until first sync completes
  initialSynced: false,

  // Completion ball — drops from checkbox, sits at bottom, optionally play basketball
  completionBall: null, // { x, y, startTime }
  spawnBall: (x, y) => set({ completionBall: { x, y, startTime: Date.now() } }),
  clearBall: () => set({ completionBall: null }),

  // Undo
  undoAction: null, // { message, onUndo, timeout }
  undoTimer: null,

  setView: (view, { spaceId = null, listId = null } = {}) => {
    set({ activeView: view, activeSpaceId: spaceId, activeListId: listId })
  },

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  closeSidebar: () => set({ sidebarOpen: false }),

  showUndo: (message, onUndo) => {
    const prev = get().undoTimer
    if (prev) clearTimeout(prev)

    const timer = setTimeout(() => {
      set({ undoAction: null, undoTimer: null })
    }, 4000)

    set({ undoAction: { message, onUndo }, undoTimer: timer })
  },

  executeUndo: () => {
    const { undoAction, undoTimer } = get()
    if (undoTimer) clearTimeout(undoTimer)
    if (undoAction?.onUndo) undoAction.onUndo()
    set({ undoAction: null, undoTimer: null })
  },

  dismissUndo: () => {
    const { undoTimer } = get()
    if (undoTimer) clearTimeout(undoTimer)
    set({ undoAction: null, undoTimer: null })
  },

  // Focused todo (shows edit icon)
  focusedTodoId: null,
  setFocusedTodo: (id) => set((s) => ({ focusedTodoId: s.focusedTodoId === id ? null : id })),
  clearFocusedTodo: () => set({ focusedTodoId: null }),

  // Multi-select
  selectedIds: {},
  multiSelectMode: false,

  enterMultiSelect: (todoId) => set({
    multiSelectMode: true,
    selectedIds: { [todoId]: true },
  }),

  toggleSelect: (todoId) => {
    const { selectedIds } = get()
    const next = { ...selectedIds }
    if (next[todoId]) delete next[todoId]
    else next[todoId] = true
    if (Object.keys(next).length === 0) set({ multiSelectMode: false, selectedIds: {} })
    else set({ selectedIds: next })
  },

  clearMultiSelect: () => set({ multiSelectMode: false, selectedIds: {} }),
}))
