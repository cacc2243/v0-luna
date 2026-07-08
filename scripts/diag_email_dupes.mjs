import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(url, key, { auth: { persistSession: false } })

// Busca logs das ultimas 48h e agrupa por (template, recipient) para achar duplicados.
const since = new Date(Date.now() - 48 * 3600 * 1000).toISOString()
const { data, error } = await supabase
  .from('email_logs')
  .select('template_id, recipient, status, provider_id, created_at')
  .gte('created_at', since)
  .order('created_at', { ascending: true })

if (error) {
  console.error('erro:', error.message)
  process.exit(1)
}

const groups = {}
for (const r of data || []) {
  if (r.status !== 'sent') continue
  const k = `${r.template_id} | ${r.recipient}`
  groups[k] = groups[k] || []
  groups[k].push(r.created_at)
}

console.log(`Total logs (48h): ${data?.length || 0}`)
console.log('--- Duplicados (mesmo template+destinatario enviados >1x) ---')
let found = 0
for (const [k, times] of Object.entries(groups)) {
  if (times.length > 1) {
    found++
    const deltas = times.slice(1).map((t, i) => (new Date(t) - new Date(times[i])) / 1000)
    console.log(`${k}  x${times.length}  intervalos(s): ${deltas.join(', ')}`)
  }
}
if (!found) console.log('nenhum duplicado encontrado')
