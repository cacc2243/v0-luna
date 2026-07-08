import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(url, key, { auth: { persistSession: false } })

const startOfDay = new Date()
startOfDay.setHours(0, 0, 0, 0)

// 1) Pixels
const { data: pixels, error: pErr } = await supabase.from('fb_pixels').select('*')
console.log('=== PIXELS ===')
if (pErr) console.log('erro pixels:', pErr.message)
else {
  console.log('total pixels:', pixels.length)
  for (const p of pixels) {
    console.log(
      `- ${p.label} | pixel_id=${p.pixel_id} | enabled=${p.enabled} | token_len=${(p.access_token || '').length} | test_code=${p.test_event_code || '-'}`,
    )
  }
}

// 2) Vendas pagas hoje
const { data: paid, error: iErr } = await supabase
  .from('invites')
  .select('id,type,status,amount,paid_at,created_at,fb_purchase_sent,fb_event_id,email,user_id,fbp,fbc,fbclid,client_ip,client_ua')
  .eq('status', 'paid')
  .gte('paid_at', startOfDay.toISOString())
  .order('paid_at', { ascending: false })

console.log('\n=== VENDAS PAGAS HOJE ===')
if (iErr) console.log('erro invites:', iErr.message)
else {
  console.log('total pagas hoje:', paid.length)
  for (const inv of paid) {
    console.log(
      `- ${inv.id} | tipo=${inv.type} | valor=${inv.amount} | fb_purchase_sent=${inv.fb_purchase_sent} | fbp=${!!inv.fbp} fbc=${!!inv.fbc} fbclid=${!!inv.fbclid} ip=${!!inv.client_ip} ua=${!!inv.client_ua} email=${!!inv.email}`,
    )
  }
  const sent = paid.filter((i) => i.fb_purchase_sent).length
  console.log(`\nmarcadas como enviadas (fb_purchase_sent=true): ${sent}/${paid.length}`)
}
