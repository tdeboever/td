const DEFAULT_PREFIX = 'todo_app_'
let storagePrefix = DEFAULT_PREFIX

export const storage = {
  setUserId(id) {
    storagePrefix = id ? `todo_app_${id}_` : DEFAULT_PREFIX
  },

  get(key) {
    try {
      const raw = localStorage.getItem(storagePrefix + key)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(storagePrefix + key, JSON.stringify(value))
    } catch (e) {
      console.error('Storage write failed:', e)
    }
  },

  remove(key) {
    localStorage.removeItem(storagePrefix + key)
  },

  clear() {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(storagePrefix))
      .forEach((k) => localStorage.removeItem(k))
  },
}
