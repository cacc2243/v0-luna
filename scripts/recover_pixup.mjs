// Recuperação de vendas PixUp presas em "pending".
//
// MODO LISTAR (padrão): mostra invites PixUp pendentes recentes com e-mail.
//   node --env-file-if-exists=/vercel/share/.env.project scripts/recover_pixup.mjs
//
// MODO RECUPERAR: reprocessa um invite pelo MESMO caminho de produção,
// enviando um POST no /api/pix/webhook com o payload no formato da PixUp
// (Envelope V2 + campos na raiz). O processamento é idempotente e dispara todos
// os efeitos colaterais reais: FB Purchase, push, e-mail, Utmify e os
// desbloqueios de chat/boost/presentes/verificação.
//   node ... scripts/recover_pixup.mjs --pay <INVITE_ID>
//
// Por padrão envia para o webhook LOCAL (localhost:3000), que já roda o código
// corrigido. Para mirar produção use RECOVER_BASE_URL=https://lunaprive.live

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY
const BASE_URL = (process.env.RECOVER_BASE_URL || 'http://localhost:3000').replace(/\/+$/, '')

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('Faltam SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false },
})

async function listPending() {
  const since = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString()
  const { data, error } = await supabase
    .from('invites')
    .select('id, email, type, amount, status, transaction_id, created_at')
    .eq('gateway', 'pixup')
    .eq('status', 'pending')
    .gte('created_at', since)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  console.log(`\nInvites PixUp pendentes (últimas 72h): ${data?.length || 0}\n`)
  for (const inv of data || []) {
    console.log(
      `  id=${inv.id}\n    email=${inv.email} | tipo=${inv.type} | R$ ${inv.amount} | criado=${inv.created_at}\n`,
    )
  }
  console.log('Para recuperar uma venda confirmada: --pay <INVITE_ID>\n')
}

async function pay(inviteId) {
  const { data: inv, error } = await supabase
    .from('invites')
    .select('id, email, type, amount, status, transaction_id')
    .eq('id', inviteId)
    .single()
  if (error || !inv) throw new Error(`Invite não encontrado: ${inviteId}`)

  console.log('Convite alvo:')
  console.log('  id:', inv.id)
  console.log('  email:', inv.email)
  console.log('  tipo:', inv.type)
  console.log('  R$:', inv.amount)
  console.log('  status atual:', inv.status)
  console.log('  transaction_id:', inv.transaction_id)

  if (inv.status === 'paid') {
    console.log('\nConvite já está pago. Nada a fazer.')
    return
  }
  if (!inv.transaction_id) {
    throw new Error('Convite sem transaction_id — não é possível reprocessar via webhook.')
  }

  // Payload no formato PixUp, cobrindo as duas variações documentadas:
  // (1) campos na raiz e (2) Envelope V2 aninhado em `data`.
  const payload = {
    event: 'cashin.confirmed',
    transaction_id: inv.transaction_id,
    external_id: inv.transaction_id,
    amount: Number(inv.amount),
    status: 'paid',
    data: {
      transaction_id: inv.transaction_id,
      external_id: inv.transaction_id,
      status: 'confirmed',
      amount: Number(inv.amount),
      confirmed_at: new Date().toISOString(),
    },
  }

  const webhookUrl = `${BASE_URL}/api/pix/webhook`
  console.log('\nEnviando payload PixUp para', webhookUrl, '...')
  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const text = await res.text()
  console.log('Resposta do webhook:', res.status, text)

  const { data: after } = await supabase
    .from('invites')
    .select('status, paid_at')
    .eq('id', inviteId)
    .maybeSingle()
  console.log('\nStatus após reprocessamento:', after?.status, '| paid_at:', after?.paid_at)
}

async function main() {
  const payIdx = process.argv.indexOf('--pay')
  if (payIdx !== -1 && process.argv[payIdx + 1]) {
    await pay(process.argv[payIdx + 1])
  } else {
    await listPending()
  }
}

main().catch((e) => {
  console.error('Erro:', e.message)
  process.exit(1)
})
