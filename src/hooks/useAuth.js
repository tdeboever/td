import { useState, useEffect, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { useTodoStore } from '../stores/todoStore'
import { useListStore } from '../stores/listStore'
import { useSpaceStore } from '../stores/spaceStore'
import { useUiStore } from '../stores/uiStore'
import { storage } from '../lib/storage'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false)
      return
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
      }
    )

    // Refresh token before expiry (every 50 min)
    const refreshInterval = setInterval(async () => {
      await supabase.auth.refreshSession()
    }, 50 * 60 * 1000)

    return () => { subscription.unsubscribe(); clearInterval(refreshInterval) }
  }, [])

  const signIn = useCallback(async () => {
    if (!isSupabaseConfigured()) return
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    })
    if (error) console.error('Sign in error:', error.message)
  }, [])

  const signOut = useCallback(async () => {
    if (!isSupabaseConfigured()) return
    const { error } = await supabase.auth.signOut()
    if (error) console.error('Sign out error:', error.message)
    // Clear all user data from memory and storage
    storage.clear()
    useTodoStore.setState({ todos: [] })
    useListStore.setState({ lists: [] })
    useSpaceStore.setState({ spaces: [] })
    useUiStore.setState({ activeSpaceId: null, activeListId: null, initialSynced: false })
  }, [])

  return { user, loading, signIn, signOut }
}
