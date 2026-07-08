import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(url, key, { auth: { persistSession: false } })

const sha256 = (v) => createHash('sha256').update(v).digest('hex')

const { data: pixels } = await supabase.from('fb_pixels').select('*').eq('enabled', true)
console.log('pixels habilitados:', pixels.map((p) => p.pixel_id))

for (const pixel of pixels) {
  const event = {
    event_name: 'TestEvent',
    event_time: Math.floor(Date.now() / 1000),
    event_id: `diag_${Date.now()}`,
    action_source: 'website',
    event_source_url: 'https://lunaprive.com/diag',
    user_data: { em: [sha256('diag@lunaprive.com')] },
  }
  const body = { data: [event] }
  const res = await fetch(
    `https://graph.facebook.com/v21.0/${pixel.pixel_id}/events?access_token=${encodeURIComponent(pixel.access_token)}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
  )
  const text = await res.text()
  console.log(`\n=== pixel ${pixel.pixel_id} => HTTP ${res.status} ===`)
  console.log(text)
}
