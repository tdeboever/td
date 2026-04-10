import { useEffect, useRef, useState, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { useTodoStore } from '../stores/todoStore'
import { useListStore } from '../stores/listStore'
import { useSpaceStore } from '../stores/spaceStore'
import { useUiStore } from '../stores/uiStore'
import { storage } from '../lib/storage'

const TABLES = ['todos', 'lists', 'spaces']
const LAST_SYNC_KEY = 'last_sync'

// Map local camelCase keys to DB snake_case
const toSnake = (obj) => {
  const map = {
    listId: 'list_id',
    spaceId: 'space_id',
    dueDate: 'due_date',
    dueTime: 'due_time',
    snoozedUntil: 'snoozed_until',
    completionCount: 'completion_count',
    lastCompletedAt: 'last_completed_at',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    userId: 'user_id',
  }
  const out = {}
  for (const [k, v] of Object.entries(obj)) {
    out[map[k] || k] = v
  }
  return out
}

const toCamel = (obj) => {
  const map = {
    list_id: 'listId',
    space_id: 'spaceId',
    due_date: 'dueDate',
    due_time: 'dueTime',
    snoozed_until: 'snoozedUntil',
    completion_count: 'completionCount',
    last_completed_at: 'lastCompletedAt',
    created_at: 'createdAt',
    updated_at: 'updatedAt',
    user_id: 'userId',
  }
  const out = {}
  for (const [k, v] of Object.entries(obj)) {
    out[map[k] || k] = v
  }
  return out
}

export function useSync(userId) {
  const [syncing, setSyncing] = useState(false)
  const [lastSynced, setLastSynced] = useState(storage.get(LAST_SYNC_KEY))
  const [error, setError] = useState(null)
  const channelRef = useRef(null)

  // Store references
  const todoStore = useTodoStore
  const listStore = useListStore
  const spaceStore = useSpaceStore

  const storeMap = {
    todos: {
      getState: () => todoStore.getState().todos,
      setState: (items) => {
        todoStore.setState({ todos: items })
        storage.set('todos', items)
      },
    },
    lists: {
      getState: () => listStore.getState().lists,
      setState: (items) => {
        listStore.setState({ lists: items })
        storage.set('lists', items)
      },
    },
    spaces: {
      getState: () => spaceStore.getState().spaces,
      setState: (items) => {
        spaceStore.setState({ spaces: items })
        storage.set('spaces', items)
      },
    },
  }

  // Push all local data to Supabase (upsert)
  const isUUID = (s) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)

  const pushAll = useCallback(async () => {
    if (!isSupabaseConfigured() || !userId) return

    for (const table of TABLES) {
      const localItems = storeMap[table].getState()
      if (localItems.length === 0) continue

      // Only sync items with valid UUID ids
      const validItems = localItems.filter((item) => isUUID(item.id))
      if (validItems.length === 0) continue

      // Only include columns that exist in the DB
      const TODO_COLS = ['id','text','type','status','priority','list_id','space_id','due_date','due_time','subtasks','snoozed_until','position','completion_count','last_completed_at','user_id','created_at','updated_at']
      const SPACE_COLS = ['id','name','icon','color','position','user_id','created_at','updated_at']
      const LIST_COLS = ['id','name','type','space_id','position','user_id','created_at','updated_at']
      const colMap = { todos: TODO_COLS, spaces: SPACE_COLS, lists: LIST_COLS }
      const cols = colMap[table] || TODO_COLS

      const rows = validItems.map((item) => {
        const snake = toSnake({ ...item, userId })
        // Strip unknown columns
        const clean = {}
        for (const k of cols) { if (snake[k] !== undefined) clean[k] = snake[k] }
        return clean
      })
      const { error: err } = await supabase
        .from(table)
        .upsert(rows, { onConflict: 'id' })

      if (err) {
        console.error(`Push ${table} error:`, err.message, err.details)
        setError(err.message)
      }
    }
  }, [userId])

  // Pull remote data and reconcile with local (last-write-wins)
  const pullAll = useCallback(async () => {
    if (!isSupabaseConfigured() || !userId) return

    for (const table of TABLES) {
      const { data: remoteItems, error: err } = await supabase
        .from(table)
        .select('*')
        .eq('user_id', userId)

      if (err) {
        console.error(`Pull ${table} error:`, err.message)
        setError(err.message)
        continue
      }

      // Remote is source of truth — use remote items, add any local-only items (not yet synced)
      const localItems = storeMap[table].getState()
      const localMap = new Map(localItems.map(i => [i.id, i]))
      const remoteConverted = (remoteItems || []).map(item => {
        const camel = toCamel(item)
        // Preserve local-only fields that may not exist in DB yet (e.g. subtasks)
        if (table === 'todos') {
          const local = localMap.get(camel.id)
          if (local?.subtasks?.length > 0 && !camel.subtasks?.length) {
            camel.subtasks = local.subtasks
          }
        }
        return camel
      })
      const remoteIds = new Set(remoteConverted.map(i => i.id))
      // Keep local items that don't exist remotely yet (new, unsynced)
      const localOnly = localItems.filter(i => !remoteIds.has(i.id) && isUUID(i.id))
      storeMap[table].setState([...remoteConverted, ...localOnly])
    }
  }, [userId])

  // Full sync: push local, then pull remote
  const sync = useCallback(async () => {
    if (!isSupabaseConfigured() || !userId) return

    setSyncing(true)
    setError(null)
    try {
      await pushAll()
      await pullAll()
      const now = new Date().toISOString()
      setLastSynced(now)
      storage.set(LAST_SYNC_KEY, now)
      useUiStore.setState({ initialSynced: true })
    } catch (e) {
      console.error('Sync error:', e)
      setError(e.message)
      useUiStore.setState({ initialSynced: true }) // still mark done so UI isn't stuck
    } finally {
      setSyncing(false)
    }
  }, [userId, pushAll, pullAll])

  // Subscribe to real-time changes
  useEffect(() => {
    if (!isSupabaseConfigured() || !userId) return

    // Initial sync on mount
    sync()

    // Real-time subscription
    const channel = supabase
      .channel('db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'todos', filter: `user_id=eq.${userId}` }, (payload) => {
        handleRealtimeChange('todos', payload)
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lists', filter: `user_id=eq.${userId}` }, (payload) => {
        handleRealtimeChange('lists', payload)
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'spaces', filter: `user_id=eq.${userId}` }, (payload) => {
        handleRealtimeChange('spaces', payload)
      })
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [userId])

  const handleRealtimeChange = (table, payload) => {
    const { eventType, new: newRow, old: oldRow } = payload
    const localItems = storeMap[table].getState()

    if (eventType === 'DELETE') {
      storeMap[table].setState(localItems.filter((item) => item.id !== oldRow.id))
      return
    }

    const incoming = toCamel(newRow)
    const idx = localItems.findIndex((item) => item.id === incoming.id)

    if (idx === -1) {
      // New item from another device
      storeMap[table].setState([...localItems, incoming])
    } else {
      // Update — last-write-wins
      const local = localItems[idx]
      if (new Date(incoming.updatedAt) > new Date(local.updatedAt)) {
        const updated = [...localItems]
        updated[idx] = incoming
        storeMap[table].setState(updated)
      }
    }
  }

  return { syncing, lastSynced, error, sync }
}

// Last-write-wins reconciliation
function reconcile(local, remote) {
  const map = new Map()

  for (const item of local) {
    map.set(item.id, item)
  }

  for (const item of remote) {
    const existing = map.get(item.id)
    if (!existing || new Date(item.updatedAt) > new Date(existing.updatedAt)) {
      map.set(item.id, item)
    }
  }

  return Array.from(map.values())
}
