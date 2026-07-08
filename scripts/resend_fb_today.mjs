// Reenvia o evento Purchase ao Facebook (CAPI) para as vendas PAGAS de hoje.
// Seguro para reexecutar: o event_id estavel (purchase_<id>) faz o Facebook
// deduplicar, entao nenhuma conversao e contada em dobro.
//
// Uso:
//   node --env-file-if-exists=/vercel/share/.env.project scripts/resend_fb_today.mjs

import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE || ''

if (!url || !serviceKey) {
  console.error('Faltam SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY no ambiente.')
  process.exit(1)
}

const GRAPH_VERSION = 'v21.0'
const supabase = createClient(url, serviceKey, { auth: { persistSession: false } })

const CONTENT_NAME = {
  invite: 'Convite Luna Privé',
  chat: 'Chat Exclusivo Luna Privé',
  gift_unlock: 'Habilitação de Presentes Luna Privé',
  boost: 'Impulsionamento Luna Privé',
  verification: 'Verificação de Conta Luna Privé',
}

import crypto from 'node:crypto'
const sha256 = (v) =>
  v ? crypto.createHash('sha256').update(String(v).trim().toLowerCase()).digest('hex') : undefined

async function main() {
  // Pixels habilitados
  const { data: pixels, error: pxErr } = await supabase
    .from('fb_pixels')
    .select('pixel_id, access_token, test_event_code, enabled')
    .eq('enabled', true)
  if (pxErr) throw pxErr
  if (!pixels || pixels.length === 0) {
    console.error('Nenhum pixel habilitado. Habilite um pixel no painel antes de reenviar.')
    process.exit(1)
  }
  console.log(`Pixels habilitados: ${pixels.map((p) => p.pixel_id).join(', ')}`)

  // Inicio do dia (horario do servidor / UTC)
  const start = new Date()
  start.setHours(0, 0, 0, 0)

  const { data: invites, error: invErr } = await supabase
    .from('invites')
    .select('*')
    .eq('status', 'paid')
    .gte('paid_at', start.toISOString())
    .order('paid_at', { ascending: true })
  if (invErr) throw invErr

  const rows = invites || []
  console.log(`Vendas pagas hoje: ${rows.length}`)

  let ok = 0
  for (const inv of rows) {
    const value = Number(inv.amount) || 0
    const type = inv.type || 'invite'
    const eventId = inv.fb_event_id || `purchase_${inv.id}`
    const fbc = inv.fbc || (inv.fbclid ? `fb.1.${Date.now()}.${inv.fbclid}` : undefined)

    const userData = {}
    if (inv.email) userData.em = [sha256(inv.email)]
    if (inv.user_id) userData.external_id = [sha256(inv.user_id)]
    if (inv.fbp) userData.fbp = inv.fbp
    if (fbc) userData.fbc = fbc
    if (inv.client_ip) userData.client_ip_address = inv.client_ip
    if (inv.client_ua) userData.client_user_agent = inv.client_ua

    const customData = {
      value,
      currency: 'BRL',
      content_name: CONTENT_NAME[type] || 'Compra Luna Privé',
      content_type: 'product',
      order_id: inv.id,
      transaction_type: type,
    }
    if (inv.utm_source) customData.utm_source = inv.utm_source
    if (inv.utm_campaign) customData.utm_campaign = inv.utm_campaign
    if (inv.utm_medium) customData.utm_medium = inv.utm_medium
    if (inv.utm_content) customData.utm_content = inv.utm_content
    if (inv.utm_term) customData.utm_term = inv.utm_term

    const event = {
      event_name: 'Purchase',
      event_time: Math.floor(new Date(inv.paid_at || Date.now()).getTime() / 1000),
      event_id: eventId,
      action_source: 'website',
      event_source_url: inv.event_source_url || undefined,
      user_data: userData,
      custom_data: customData,
    }

    let anySuccess = false
    for (const px of pixels) {
      const body = { data: [event] }
      if (px.test_event_code) body.test_event_code = px.test_event_code
      const res = await fetch(
        `https://graph.facebook.com/${GRAPH_VERSION}/${px.pixel_id}/events?access_token=${encodeURIComponent(px.access_token)}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
      )
      const text = await res.text().catch(() => '')
      if (res.ok) {
        anySuccess = true
        console.log(`  [ok] invite ${inv.id} -> pixel ${px.pixel_id}: ${text.slice(0, 160)}`)
      } else {
        console.log(`  [ERRO] invite ${inv.id} -> pixel ${px.pixel_id}: ${res.status} ${text.slice(0, 200)}`)
      }
    }

    if (anySuccess) {
      await supabase.from('invites').update({ fb_purchase_sent: true }).eq('id', inv.id)
      ok++
    }
  }

  console.log(`\nConcluido. ${ok}/${rows.length} vendas confirmadas no Facebook.`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
