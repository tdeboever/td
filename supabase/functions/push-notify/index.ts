import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webPush from 'npm:web-push@3.6.7'

const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')!
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

webPush.setVapidDetails('mailto:whim@whim.app', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

Deno.serve(async (_req) => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Get all active todos with a due_time set for today
    const { data: dueTodos, error: todoErr } = await supabase
      .from('todos')
      .select('id, text, due_date, due_time, user_id')
      .eq('status', 'active')
      .not('due_time', 'is', null)
      .not('due_date', 'is', null)

    if (todoErr) {
      return new Response(JSON.stringify({ error: todoErr.message }), { status: 500 })
    }

    if (!dueTodos || dueTodos.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), { status: 200 })
    }

    // Current UTC time
    const now = new Date()
    const nowUTCMinutes = now.getUTCHours() * 60 + now.getUTCMinutes()

    // Filter: due_date is today (in any timezone) and due_time matches now
    // Since we store times in user's local time but don't know their timezone,
    // check if the due_time falls within ±1 minute of current time in ANY timezone offset
    const dueNow = dueTodos.filter(t => {
      const [h, m] = t.due_time.split(':').map(Number)
      const dueLocalMinutes = h * 60 + m

      // Check each timezone offset: does this local time correspond to "now" in UTC?
      for (let offset = -12; offset <= 14; offset++) {
        const dueUTC = (dueLocalMinutes - offset * 60 + 1440) % 1440
        if (Math.abs(dueUTC - nowUTCMinutes) <= 1 || Math.abs(dueUTC - nowUTCMinutes) >= 1438) {
          // Also check that due_date is today in that timezone
          const tzNow = new Date(now.getTime() + offset * 60 * 60 * 1000)
          const tzToday = tzNow.toISOString().split('T')[0]
          if (t.due_date === tzToday) return true
        }
      }
      return false
    })

    if (dueNow.length === 0) {
      return new Response(JSON.stringify({ sent: 0, checked: dueTodos.length }), { status: 200 })
    }

    // Group by user
    const byUser = new Map<string, typeof dueNow>()
    for (const todo of dueNow) {
      const list = byUser.get(todo.user_id) || []
      list.push(todo)
      byUser.set(todo.user_id, list)
    }

    let sent = 0
    let expired = 0

    for (const [userId, todos] of byUser) {
      const { data: subs } = await supabase
        .from('push_subscriptions')
        .select('id, endpoint, keys')
        .eq('user_id', userId)

      if (!subs || subs.length === 0) continue

      for (const todo of todos) {
        const payload = JSON.stringify({
          title: 'Whim',
          body: todo.text,
          tag: `todo-${todo.id}`,
        })

        for (const sub of subs) {
          try {
            await webPush.sendNotification(
              { endpoint: sub.endpoint, keys: sub.keys },
              payload
            )
            sent++
          } catch (err: any) {
            if (err.statusCode === 410 || err.statusCode === 404) {
              // Subscription expired — clean up
              await supabase.from('push_subscriptions').delete().eq('id', sub.id)
              expired++
            } else {
              console.error(`Push failed for ${sub.endpoint}:`, err.message)
            }
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ sent, expired, checked: dueNow.length }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Function error:', err)
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})
