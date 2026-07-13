import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'

/**
 * Backfill pontual: envia todas as vendas aprovadas (invites status=paid) como
 * eventos Purchase para a Conversions API do pixel alvo, com toda a atribuicao
 * (fbp/fbc/fbclid/IP/UA/email/UTMs) e com event_time distribuido ao longo dos
 * ultimos 7 dias (limite maximo aceito pelo Facebook para eventos passados).
 *
 * Uso:
 *   DRY_RUN=1 node --env-file=... scripts/fb-backfill-purchases.mjs   (apenas simula)
 *   node --env-file=... scripts/fb-backfill-purchases.mjs             (envia de verdade)
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
const TARGET_PIXEL = '1753197515870888'
const GRAPH_VERSION = 'v21.0'
const DRY_RUN = process.env.DRY_RUN === '1'

if (!url || !key) {
  console.error('Faltam envs NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const sha256 = (v) => createHash('sha256').update(v).digest('hex')

function hashNorm(value, lower = true) {
  if (!value) return undefined
  const t = String(value).trim()
  if (!t) return undefined
  return sha256(lower ? t.toLowerCase() : t)
}

function normalizePhone(phone) {
  if (!phone) return undefined
  let d = String(phone).replace(/\D/g, '')
  if (!d) return undefined
  if (d.length <= 11) d = `55${d}`
  return sha256(d)
}

function deriveFbc(fbc, fbclid, ts) {
  if (fbc) return fbc
  if (!fbclid) return null
  return `fb.1.${ts}.${fbclid}`
}

const CONTENT_NAME = {
  invite: 'Convite Luna Privé',
  chat: 'Chat Exclusivo Luna Privé',
  gift_unlock: 'Habilitação de Presentes Luna Privé',
  boost: 'Impulsionamento Luna Privé',
  verification: 'Verificação de Conta Luna Privé',
}

// 1) Token do pixel alvo
const { data: pixelRow, error: pixErr } = await supabase
  .from('fb_pixels')
  .select('pixel_id,access_token,test_event_code,enabled')
  .eq('pixel_id', TARGET_PIXEL)
  .single()

if (pixErr || !pixelRow) {
  console.error('Pixel alvo nao encontrado em fb_pixels:', pixErr?.message)
  process.exit(1)
}
if (!pixelRow.access_token) {
  console.error('Pixel alvo sem access_token cadastrado.')
  process.exit(1)
}

// 2) Todas as vendas pagas (paginado)
const cols =
  'id,type,status,amount,email,user_id,fbp,fbc,fbclid,client_ip,client_ua,event_source_url,utm_source,utm_campaign,utm_medium,utm_content,utm_term,created_at,paid_at'
let all = []
const pageSize = 1000
for (let from = 0; ; from += pageSize) {
  const { data, error } = await supabase
    .from('invites')
    .select(cols)
    .eq('status', 'paid')
    .order('paid_at', { ascending: true, nullsFirst: true })
    .range(from, from + pageSize - 1)
  if (error) {
    console.error('Erro ao buscar invites:', error.message)
    process.exit(1)
  }
  all = all.concat(data)
  if (data.length < pageSize) break
}

console.log(`Vendas pagas encontradas: ${all.length}`)
if (all.length === 0) process.exit(0)

// 3) event_time distribuido nos ultimos 7 dias.
//    Janela: de (agora - 6d22h) ate (agora - 1h), espalhado uniformemente na
//    ordem cronologica original das vendas (preserva a sequencia, comprimida).
const nowSec = Math.floor(Date.now() / 1000)
const windowStart = nowSec - (6 * 24 + 22) * 3600 // ~6d22h atras
const windowEnd = nowSec - 3600 // 1h atras
const span = windowEnd - windowStart

function eventTimeFor(index, total) {
  if (total <= 1) return windowEnd
  const t = windowStart + Math.round((span * index) / (total - 1))
  return t
}

// 4) Monta os eventos
const events = all.map((inv, i) => {
  const et = eventTimeFor(i, all.length)
  const value = Number(inv.amount) || 0
  const type = inv.type || 'invite'
  const fbc = deriveFbc(inv.fbc, inv.fbclid, et * 1000)

  const user_data = {}
  const em = hashNorm(inv.email)
  if (em) user_data.em = [em]
  const ext = hashNorm(inv.user_id, false)
  if (ext) user_data.external_id = [ext]
  if (inv.fbp) user_data.fbp = inv.fbp
  if (fbc) user_data.fbc = fbc
  if (inv.client_ip) user_data.client_ip_address = inv.client_ip
  if (inv.client_ua) user_data.client_user_agent = inv.client_ua

  const custom_data = {
    value,
    currency: 'BRL',
    content_name: CONTENT_NAME[type] || 'Compra Luna Privé',
    content_type: 'product',
    order_id: inv.id,
    transaction_type: type,
  }
  if (inv.utm_source) custom_data.utm_source = inv.utm_source
  if (inv.utm_campaign) custom_data.utm_campaign = inv.utm_campaign
  if (inv.utm_medium) custom_data.utm_medium = inv.utm_medium
  if (inv.utm_content) custom_data.utm_content = inv.utm_content
  if (inv.utm_term) custom_data.utm_term = inv.utm_term

  const ev = {
    event_name: 'Purchase',
    event_time: et,
    // event_id novo/distinto para o backfill: garante que o FB registre o
    // evento na nova janela de tempo (nao deduplica contra o envio original).
    event_id: `bf7d_${inv.id}`,
    action_source: 'website',
    user_data,
    custom_data,
  }
  if (inv.event_source_url) ev.event_source_url = inv.event_source_url
  return ev
})

// Diagnostico de qualidade de matching
const withFbp = events.filter((e) => e.user_data.fbp).length
const withFbc = events.filter((e) => e.user_data.fbc).length
const withEmail = events.filter((e) => e.user_data.em).length
const withIp = events.filter((e) => e.user_data.client_ip_address).length
const totalValue = all.reduce((s, i) => s + (Number(i.amount) || 0), 0)
console.log(
  `Cobertura: fbp=${withFbp} fbc=${withFbc} email=${withEmail} ip=${withIp} | valor total=R$ ${totalValue.toFixed(2)}`,
)
console.log(
  `Janela event_time: ${new Date(windowStart * 1000).toISOString()} -> ${new Date(
    windowEnd * 1000,
  ).toISOString()}`,
)

if (DRY_RUN) {
  console.log('\n[DRY_RUN] Exemplo do 1o evento:')
  console.log(JSON.stringify(events[0], null, 2))
  console.log(`\n[DRY_RUN] Nada foi enviado. ${events.length} eventos prontos para envio.`)
  process.exit(0)
}

// 5) Envia em lotes ao pixel alvo
const endpoint = `https://graph.facebook.com/${GRAPH_VERSION}/${TARGET_PIXEL}/events?access_token=${encodeURIComponent(
  pixelRow.access_token,
)}`
const chunkSize = 100
let sent = 0
let received = 0
for (let i = 0; i < events.length; i += chunkSize) {
  const chunk = events.slice(i, i + chunkSize)
  const body = { data: chunk }
  if (pixelRow.test_event_code) body.test_event_code = pixelRow.test_event_code

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const text = await res.text()
    if (!res.ok) {
      console.error(`Lote ${i / chunkSize + 1}: HTTP ${res.status} ${text.slice(0, 400)}`)
    } else {
      let parsed
      try {
        parsed = JSON.parse(text)
      } catch {
        parsed = {}
      }
      received += Number(parsed.events_received || chunk.length)
      sent += chunk.length
      console.log(
        `Lote ${i / chunkSize + 1}: enviados=${chunk.length} events_received=${
          parsed.events_received ?? '?'
        } fbtrace_id=${parsed.fbtrace_id ?? '-'}`,
      )
    }
  } catch (e) {
    console.error(`Lote ${i / chunkSize + 1}: exception ${e?.message}`)
  }
}

console.log(`\nConcluido. Enviados=${sent} events_received(FB)=${received} de ${events.length}.`)
