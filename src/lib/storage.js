const STORAGE_PREFIX = 'todo_app_'

export const storage = {
  get(key) {
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + key)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value))
    } catch (e) {
      console.error('Storage write failed:', e)
    }
  },

  remove(key) {
    localStorage.removeItem(STORAGE_PREFIX + key)
  },

  clear() {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(STORAGE_PREFIX))
      .forEach((k) => localStorage.removeItem(k))
  },
}
