import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Simple in-memory rate limiter: max 30 requests per minute per IP
const rateMap = new Map<string, { count: number; reset: number }>()
function rateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateMap.get(ip)
  if (!entry || now > entry.reset) {
    rateMap.set(ip, { count: 1, reset: now + 60000 })
    return true
  }
  entry.count++
  return entry.count <= 30
}

Deno.serve(async (req) => {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  if (!rateLimit(ip)) {
    return json({ error: 'Too many requests' }, 429)
  }

  try {
    const { todoId, action } = await req.json()
    if (!todoId || !action) {
      return json({ error: 'Missing todoId or action' }, 400)
    }

    // Validate UUID format
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(todoId)) {
      return json({ error: 'Invalid todoId' }, 400)
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    if (action === 'complete') {
      const { error } = await supabase.from('todos').update({
        status: 'done',
        updated_at: new Date().toISOString(),
      }).eq('id', todoId)

      if (error) return json({ error: error.message }, 500)
      return json({ ok: true, action: 'completed' })
    }

    if (action === 'snooze') {
      const { data: todo } = await supabase.from('todos').select('user_id').eq('id', todoId).single()
      let tz = 'America/New_York'
      if (todo?.user_id) {
        const { data: sub } = await supabase.from('push_subscriptions').select('timezone').eq('user_id', todo.user_id).limit(1).single()
        if (sub?.timezone) tz = sub.timezone
      }

      const now = new Date()
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', hour12: false,
      })
      const parts = formatter.formatToParts(new Date(now.getTime() + 60 * 60 * 1000))
      const get = (t: string) => parts.find(p => p.type === t)?.value || '0'
      const dueTime = `${get('hour')}:${get('minute')}`
      const today = `${get('year')}-${get('month')}-${get('day')}`

      const { error } = await supabase.from('todos').update({
        due_time: dueTime,
        due_date: today,
        last_notified_at: null,
        updated_at: new Date().toISOString(),
      }).eq('id', todoId)

      if (error) return json({ error: error.message }, 500)
      return json({ ok: true, action: 'snoozed', dueTime })
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
