import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webPush from 'npm:web-push@3.6.7'

const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')!
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const PUSH_FUNCTION_SECRET = Deno.env.get('PUSH_FUNCTION_SECRET')

webPush.setVapidDetails('mailto:whim@whim.app', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

Deno.serve(async (req) => {
  // Auth: require shared secret
  if (PUSH_FUNCTION_SECRET) {
    const secret = req.headers.get('x-function-secret')
    if (secret !== PUSH_FUNCTION_SECRET) {
      return json({ error: 'Unauthorized' }, 401)
    }
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Get all push subscriptions with timezone info
    const { data: subs, error: subErr } = await supabase
      .from('push_subscriptions')
      .select('id, user_id, endpoint, keys, timezone')

    if (subErr || !subs || subs.length === 0) {
      return json({ sent: 0, reason: subErr?.message || 'no subscriptions' })
    }

    // Get all active todos with due_time
    const { data: todos, error: todoErr } = await supabase
      .from('todos')
      .select('id, text, due_date, due_time, user_id')
      .eq('status', 'active')
      .not('due_time', 'is', null)

    if (todoErr || !todos || todos.length === 0) {
      return json({ sent: 0, reason: todoErr?.message || 'no todos with times' })
    }

    // Group subs by user
    const subsByUser = new Map<string, typeof subs>()
    for (const sub of subs) {
      const list = subsByUser.get(sub.user_id) || []
      list.push(sub)
      subsByUser.set(sub.user_id, list)
    }

    let sent = 0
    let expired = 0

    for (const [userId, userSubs] of subsByUser) {
      // Get user's timezone from their first subscription
      const tz = userSubs[0]?.timezone || 'America/New_York'

      // Get current time in user's timezone
      let userNow: Date
      try {
        const formatter = new Intl.DateTimeFormat('en-CA', {
          timeZone: tz,
          year: 'numeric', month: '2-digit', day: '2-digit',
          hour: '2-digit', minute: '2-digit', hour12: false,
        })
        const parts = formatter.formatToParts(new Date())
        const get = (t: string) => parts.find(p => p.type === t)?.value || '0'
        userNow = new Date()
        // We just need the date string and current H:M in their timezone
        var userToday = `${get('year')}-${get('month')}-${get('day')}`
        var userHour = parseInt(get('hour'))
        var userMinute = parseInt(get('minute'))
      } catch {
        continue
      }

      const userMinutes = userHour * 60 + userMinute

      // Find todos for this user that are due now
      const userTodos = todos.filter(t => {
        if (t.user_id !== userId) return false
        if (!t.due_time) return false

        // due_date must be today or null (null = today implied)
        if (t.due_date && t.due_date !== userToday) return false

        const [h, m] = t.due_time.split(':').map(Number)
        const dueMinutes = h * 60 + m

        // Within 1 minute window
        return userMinutes >= dueMinutes && userMinutes <= dueMinutes + 1
      })

      if (userTodos.length === 0) continue

      for (const todo of userTodos) {
        const payload = JSON.stringify({
          title: 'Whim',
          body: todo.text,
          tag: `todo-${todo.id}`,
          todoId: todo.id,
          userId: todo.user_id,
        })

        for (const sub of userSubs) {
          try {
            await webPush.sendNotification(
              { endpoint: sub.endpoint, keys: sub.keys },
              payload
            )
            sent++
          } catch (err: any) {
            if (err.statusCode === 410 || err.statusCode === 404) {
              await supabase.from('push_subscriptions').delete().eq('id', sub.id)
              expired++
            } else {
              console.error(`Push failed: ${err.statusCode} ${err.message}`)
            }
          }
        }
      }
    }

    return json({ sent, expired })
  } catch (err) {
    console.error('Function error:', err)
    return json({ error: String(err) }, 500)
  }
})

function json(data: object, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
