import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req) => {
  try {
    // Get the calling user from JWT
    const authHeader = req.headers.get('authorization')
    if (!authHeader) return json({ error: 'No auth token' }, 401)

    const userClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Verify JWT and get user
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authErr } = await createClient(
      SUPABASE_URL,
      Deno.env.get('SUPABASE_ANON_KEY')!
    ).auth.getUser(token)

    if (authErr || !user) return json({ error: 'Invalid token' }, 401)

    const { action, listId, email, shareId } = await req.json()

    // --- INVITE ---
    if (action === 'invite') {
      if (!listId || !email) return json({ error: 'Missing listId or email' }, 400)

      // Verify caller owns the list
      const { data: list } = await userClient.from('lists').select('id, name, user_id').eq('id', listId).single()
      if (!list || list.user_id !== user.id) return json({ error: 'Not your list' }, 403)

      // Look up target user by email
      const { data: target } = await userClient.from('user_profiles').select('id, email, display_name').eq('email', email.toLowerCase().trim()).single()
      if (!target) return json({ error: 'User not found. They need to sign up first.' }, 404)
      if (target.id === user.id) return json({ error: "Can't share with yourself" }, 400)

      // Create or update the share
      const { data: share, error: shareErr } = await userClient.from('list_shares').upsert({
        list_id: listId,
        owner_id: user.id,
        shared_with_id: target.id,
        status: 'pending',
        role: 'editor',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'list_id,shared_with_id' }).select().single()

      if (shareErr) return json({ error: shareErr.message }, 500)
      return json({ ok: true, share, targetName: target.display_name })
    }

    // --- ACCEPT ---
    if (action === 'accept') {
      if (!shareId) return json({ error: 'Missing shareId' }, 400)

      const { error } = await userClient.from('list_shares').update({
        status: 'accepted',
        updated_at: new Date().toISOString(),
      }).eq('id', shareId).eq('shared_with_id', user.id)

      if (error) return json({ error: error.message }, 500)
      return json({ ok: true })
    }

    // --- DECLINE ---
    if (action === 'decline') {
      if (!shareId) return json({ error: 'Missing shareId' }, 400)

      const { error } = await userClient.from('list_shares').update({
        status: 'declined',
        updated_at: new Date().toISOString(),
      }).eq('id', shareId).eq('shared_with_id', user.id)

      if (error) return json({ error: error.message }, 500)
      return json({ ok: true })
    }

    // --- REVOKE ---
    if (action === 'revoke') {
      if (!shareId) return json({ error: 'Missing shareId' }, 400)

      const { error } = await userClient.from('list_shares').delete()
        .eq('id', shareId).eq('owner_id', user.id)

      if (error) return json({ error: error.message }, 500)
      return json({ ok: true })
    }

    // --- LIST SHARES (for a given list or for the user) ---
    if (action === 'list') {
      // Shares I own + shares shared with me
      const { data: owned } = await userClient.from('list_shares')
        .select('*, shared_user:user_profiles!list_shares_shared_with_id_fkey(email, display_name)')
        .eq('owner_id', user.id)

      const { data: incoming } = await userClient.from('list_shares')
        .select('*, owner:user_profiles!list_shares_owner_id_fkey(email, display_name), list:lists!list_shares_list_id_fkey(name)')
        .eq('shared_with_id', user.id)

      return json({ owned: owned || [], incoming: incoming || [] })
    }

    return json({ error: 'Unknown action' }, 400)
  } catch (err) {
    return json({ error: String(err) }, 500)
  }
})

function json(data: object, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
