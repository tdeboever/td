import { create } from 'zustand'

export const useUiStore = create((set, get) => ({
  // Navigation
  activeView: 'inbox', // 'inbox' | 'today' | 'upcoming' | 'space' | 'list'
  activeSpaceId: null,
  activeListId: null,

  // Sidebar
  sidebarOpen: false,

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
}))
