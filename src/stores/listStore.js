import { create } from 'zustand'
import { storage } from '../lib/storage'
import { uid } from '../lib/utils'

const STORAGE_KEY = 'lists'

const loadLists = () => storage.get(STORAGE_KEY) || []

export const useListStore = create((set, get) => ({
  lists: loadLists(),

  addList: (name, spaceId, type = 'tasks', userId = null) => {
    const list = {
      id: uid(),
      name,
      type,
      spaceId,
      position: get().lists.filter((l) => l.spaceId === spaceId).length,
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    set((state) => {
      const lists = [...state.lists, list]
      storage.set(STORAGE_KEY, lists)
      return { lists }
    })
    return list
  },

  updateList: (id, updates) => {
    set((state) => {
      const lists = state.lists.map((l) =>
        l.id === id ? { ...l, ...updates, updatedAt: new Date().toISOString() } : l
      )
      storage.set(STORAGE_KEY, lists)
      return { lists }
    })
  },

  deleteList: (id) => {
    set((state) => {
      const lists = state.lists.filter((l) => l.id !== id)
      storage.set(STORAGE_KEY, lists)
      return { lists }
    })
  },

  getSpaceLists: (spaceId) => {
    return get()
      .lists.filter((l) => l.spaceId === spaceId)
      .sort((a, b) => a.position - b.position)
  },
}))
