// Recuperação de vendas PixUp presas em "pending".
//
// MODO LISTAR (padrão): mostra invites PixUp pendentes recentes com e-mail.
//   node --env-file-if-exists=/vercel/share/.env.project scripts/recover_pixup.mjs
//
// MODO RECUPERAR: marca um invite específico como "paid" (após confirmação
// manual de que a PixUp aprovou). Dispara a conciliação chamando o endpoint
// /api/pix/status em produção (roda os safety nets: e-mail, FB, Utmify, push,
// e desbloqueios de chat/boost/presentes/verificação).
//   node ... scripts/recover_pixup.mjs --pay <INVITE_ID>

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://lunaprive.live').replace(/\/+$/, '')

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('Faltam SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false },
})

const siteBase = /^https?:\/\//i.test(SITE_URL) ? SITE_URL : `https://${SITE_URL}`

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
    .select('*')
    .eq('id', inviteId)
    .single()
  if (error || !inv) throw new Error(`Invite não encontrado: ${inviteId}`)

  const { error: upErr } = await supabase
    .from('invites')
    .update({ status: 'paid', paid_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', inviteId)
  if (upErr) throw new Error(`Falha ao marcar paid: ${upErr.message}`)
  console.log(`Invite ${inviteId} marcado como PAID.`)

  // Dispara os safety nets em produção (idempotentes).
  const url = `${siteBase}/api/pix/status?id=${encodeURIComponent(inviteId)}&email=${encodeURIComponent(inv.email)}`
  try {
    const res = await fetch(url)
    console.log(`Conciliação /api/pix/status: HTTP ${res.status}`)
  } catch (e) {
    console.log(`Não foi possível chamar /api/pix/status automaticamente: ${e.message}`)
    console.log('Abra a página de status do comprador ou aguarde o próximo polling.')
  }
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
