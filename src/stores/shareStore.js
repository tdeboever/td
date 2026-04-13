import { create } from 'zustand'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

export const useShareStore = create((set, get) => ({
  // Shares I created (my lists shared with others)
  outgoing: [],
  // Shares others created (shared with me)
  incoming: [],
  // Shared lists + their todos (accepted shares)
  sharedLists: [],
  sharedTodos: [],
  loading: false,

  fetchShares: async () => {
    if (!isSupabaseConfigured()) return
    set({ loading: true })
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/share-list`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ action: 'list' }),
      })
      const data = await res.json()
      if (data.owned) set({ outgoing: data.owned })
      if (data.incoming) set({ incoming: data.incoming })

      // Fetch shared lists and todos for accepted incoming shares
      const accepted = (data.incoming || []).filter(s => s.status === 'accepted')
      if (accepted.length > 0) {
        const listIds = accepted.map(s => s.list_id)

        const { data: lists } = await supabase.from('lists').select('*').in('id', listIds)
        const { data: todos } = await supabase.from('todos').select('*').in('list_id', listIds)

        set({
          sharedLists: lists || [],
          sharedTodos: todos || [],
        })
      }
    } catch (err) {
      console.error('Fetch shares error:', err)
    } finally {
      set({ loading: false })
    }
  },

  inviteUser: async (listId, email) => {
    if (!isSupabaseConfigured()) return { error: 'Not configured' }
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return { error: 'Not signed in' }

    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/share-list`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ action: 'invite', listId, email }),
    })
    const data = await res.json()
    if (data.ok) get().fetchShares()
    return data
  },

  acceptShare: async (shareId) => {
    if (!isSupabaseConfigured()) return
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/share-list`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ action: 'accept', shareId }),
    })
    const data = await res.json()
    if (data.ok) get().fetchShares()
    return data
  },

  declineShare: async (shareId) => {
    if (!isSupabaseConfigured()) return
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/share-list`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ action: 'decline', shareId }),
    })
    get().fetchShares()
  },

  revokeShare: async (shareId) => {
    if (!isSupabaseConfigured()) return
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/share-list`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ action: 'revoke', shareId }),
    })
    get().fetchShares()
  },

  // Subscribe to realtime changes on shared lists
  subscribeToSharedLists: () => {
    if (!isSupabaseConfigured()) return () => {}
    const accepted = get().incoming.filter(s => s.status === 'accepted')
    const channels = []

    for (const share of accepted) {
      const ch = supabase
        .channel(`shared-${share.list_id}`)
        .on('postgres_changes', {
          event: '*', schema: 'public', table: 'todos',
          filter: `list_id=eq.${share.list_id}`,
        }, () => {
          // Re-fetch shared todos on any change
          get().fetchShares()
        })
        .subscribe()
      channels.push(ch)
    }

    // Return cleanup function
    return () => { channels.forEach(ch => supabase.removeChannel(ch)) }
  },

  getPendingInvites: () => get().incoming.filter(s => s.status === 'pending'),
  getAcceptedShares: () => get().incoming.filter(s => s.status === 'accepted'),
}))
