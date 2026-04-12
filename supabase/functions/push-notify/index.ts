import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webPush from 'npm:web-push@3.6.7'

const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')!
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

webPush.setVapidDetails('mailto:whim@whim.app', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

Deno.serve(async (req) => {

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Get all push subscriptions with timezone info
    const { data: subs, error: subErr } = await supabase
      .from('push_subscriptions')
      .select('id, user_id, endpoint, keys, timezone')

    if (subErr || !subs || subs.length === 0) {
      return json({ sent: 0, reason: subErr?.message || 'no subscriptions' })
    }

    // Get all active todos with due_time that haven't been notified yet
    const { data: todos, error: todoErr } = await supabase
      .from('todos')
      .select('id, text, due_date, due_time, user_id, last_notified_at')
      .eq('status', 'active')
      .not('due_time', 'is', null)
      .is('last_notified_at', null)

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
    const debug: any = {}

    for (const [userId, userSubs] of subsByUser) {
      // Get user's timezone from their first subscription
      const tz = userSubs[0]?.timezone || 'America/New_York'

      // Get current time in user's timezone
      let userToday: string
      let userHour: number
      let userMinute: number
      try {
        const formatter = new Intl.DateTimeFormat('en-CA', {
          timeZone: tz,
          year: 'numeric', month: '2-digit', day: '2-digit',
          hour: '2-digit', minute: '2-digit', hour12: false,
        })
        const parts = formatter.formatToParts(new Date())
        const get = (t: string) => parts.find(p => p.type === t)?.value || '0'
        userToday = `${get('year')}-${get('month')}-${get('day')}`
        userHour = parseInt(get('hour'))
        userMinute = parseInt(get('minute'))
      } catch {
        continue
      }

      const userMinutes = userHour * 60 + userMinute

      // Find todos for this user that are due now
      const matchingTodos = todos.filter(t => t.user_id === userId && t.due_time)
      const userTodos = matchingTodos.filter(t => {
        // due_date must be today or null (null = today implied)
        if (t.due_date && t.due_date !== userToday) return false

        const [h, m] = t.due_time.split(':').map(Number)
        const dueMinutes = h * 60 + m

        // Within 10 minute window — generous to catch tasks
        return userMinutes >= dueMinutes && userMinutes <= dueMinutes + 10
      })

      debug[userId] = {
        tz, userToday, userTime: `${userHour}:${userMinute}`, userMinutes,
        todosWithTime: matchingTodos.map(t => ({ text: t.text, date: t.due_date, time: t.due_time })),
        matched: userTodos.length,
      }

      if (userTodos.length === 0) continue

      for (const todo of userTodos) {
        const payload = JSON.stringify({
          title: 'Whim',
          body: todo.text,
          tag: `todo-${todo.id}`,
          todoId: todo.id,
          userId: todo.user_id,
        })

        let didSend = false
        for (const sub of userSubs) {
          try {
            await webPush.sendNotification(
              { endpoint: sub.endpoint, keys: sub.keys },
              payload
            )
            sent++
            didSend = true
          } catch (err: any) {
            if (err.statusCode === 410 || err.statusCode === 404) {
              await supabase.from('push_subscriptions').delete().eq('id', sub.id)
              expired++
            } else {
              console.error(`Push failed: ${err.statusCode} ${err.message}`)
            }
          }
        }

        // Mark as notified so we don't send again
        if (didSend) {
          await supabase.from('todos').update({ last_notified_at: new Date().toISOString() }).eq('id', todo.id)
        }
      }
    }

    return json({ sent, expired, debug })
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
