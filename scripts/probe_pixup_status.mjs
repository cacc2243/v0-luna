// SOMENTE LEITURA: descobre o endpoint de consulta de status da PixUp.
// Pega uma transação pendente real e testa vários caminhos GET conhecidos,
// mostrando qual retorna 200 e o corpo. Não altera nada no banco.
import { createClient } from '@supabase/supabase-js'

const PIXUP_API_URL = 'https://api.pixupbr.com'
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY

async function token() {
  const basic = Buffer.from(
    `${process.env.PIXUP_CLIENT_ID}:${process.env.PIXUP_CLIENT_SECRET}`,
  ).toString('base64')
  const res = await fetch(`${PIXUP_API_URL}/v2/oauth/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${basic}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ grant_type: 'client_credentials' }),
  })
  const d = await res.json()
  if (!d?.access_token) throw new Error('sem token: ' + JSON.stringify(d))
  return d.access_token
}

async function main() {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } })
  const { data } = await supabase
    .from('invites')
    .select('id, transaction_id, amount, status, created_at')
    .eq('gateway', 'pixup')
    .eq('status', 'pending')
    .not('transaction_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)

  if (!data?.length) {
    console.log('Nenhuma pendente com transaction_id.')
    return
  }
  const inv = data[0]
  const txId = inv.transaction_id
  console.log('Testando com invite pendente:')
  console.log('  id:', inv.id, '| tx:', txId, '| R$', inv.amount, '| criado:', inv.created_at)

  const t = await token()
  const candidates = [
    `/v2/transactions/${txId}`,
    `/v2/transactions/cashin/${txId}`,
    `/v2/transactions?external_id=${txId}`,
    `/v2/transactions?transaction_id=${txId}`,
    `/v2/transactions/${txId}/status`,
  ]

  for (const path of candidates) {
    try {
      const res = await fetch(`${PIXUP_API_URL}${path}`, {
        headers: { Authorization: `Bearer ${t}` },
      })
      const body = await res.text()
      const short = body.length > 400 ? body.slice(0, 400) + '…' : body
      console.log(`\n[${res.status}] GET ${path}\n  ${short}`)
    } catch (e) {
      console.log(`\n[ERR] GET ${path} -> ${e.message}`)
    }
  }
}

main().catch((e) => {
  console.error('Erro:', e.message)
  process.exit(1)
})
