import { create } from 'zustand'
import { storage } from '../lib/storage'
import { uid } from '../lib/utils'

const STORAGE_KEY = 'spaces'

const loadSpaces = () => storage.get(STORAGE_KEY) || []

export const useSpaceStore = create((set, get) => ({
  spaces: loadSpaces(),

  addSpace: (name, icon = null, color = null, userId = null) => {
    const PALETTE = ['#ff7b54', '#f472b6', '#60a5fa', '#4ade80', '#fbbf24', '#a78bfa']
    if (!color) color = PALETTE[get().spaces.length % PALETTE.length]
    if (!icon) icon = name.charAt(0).toUpperCase()
    const space = {
      id: uid(),
      name,
      icon,
      color,
      position: get().spaces.length,
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    set((state) => {
      const spaces = [...state.spaces, space]
      storage.set(STORAGE_KEY, spaces)
      return { spaces }
    })
    return space
  },

  updateSpace: (id, updates) => {
    set((state) => {
      const spaces = state.spaces.map((s) =>
        s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s
      )
      storage.set(STORAGE_KEY, spaces)
      return { spaces }
    })
  },

  deleteSpace: (id) => {
    set((state) => {
      const spaces = state.spaces.filter((s) => s.id !== id)
      storage.set(STORAGE_KEY, spaces)
      return { spaces }
    })
  },

  reorderSpaces: (spaces) => {
    const reordered = spaces.map((s, i) => ({ ...s, position: i }))
    storage.set(STORAGE_KEY, reordered)
    set({ spaces: reordered })
  },
}))
