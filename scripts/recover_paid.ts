import { createAdminClient } from '@/lib/supabase/admin'
import { sendTemplateEmail } from '@/lib/email/send'
import { getSiteUrl } from '@/lib/site-url'

/**
 * Recuperacao manual (one-off): marca convites de acesso como PAGOS e envia o
 * e-mail "Acesso liberado" (template invite_paid) para uma lista de e-mails.
 *
 * Reutiliza os helpers reais do app (mesmo template, mesmo log em email_logs).
 * Idempotente: so envia o e-mail para quem ainda nao recebeu
 * (invite_paid_email_sent = false) e so marca como pago quem ainda esta
 * pendente. Envia UM e-mail por pessoa mesmo que haja convites duplicados.
 */
const EMAILS = [
  'gleycianealmeida1990@icloud.com',
  'pedelicado@hotmail.com',
  'juliatpaixaao@gmail.com',
  'estuda.ca.estuda@gmail.com',
  'tatianamatos25@gmail.com',
  'torresvencer@gmail.com',
  'marliany164@gmail.com',
  'aurorablythewriter@gmail.com',
  'fernandes0790@outlook.com',
  'suellenlyrio@hotmail.com',
]

async function main() {
  const supabase = createAdminClient()
  const siteUrl = getSiteUrl()
  const lower = EMAILS.map((e) => e.toLowerCase())

  // Mapa email -> display_name (para personalizar o e-mail).
  const nameByEmail = new Map<string, string>()
  try {
    // Busca em ate 10 paginas (1000 usuarios) para achar os display_names.
    for (let page = 1; page <= 10; page++) {
      const { data } = await supabase.auth.admin.listUsers({ page, perPage: 1000 })
      const users = data?.users || []
      for (const u of users) {
        const email = (u.email || '').toLowerCase()
        if (!lower.includes(email)) continue
        const meta = u.user_metadata as Record<string, unknown> | undefined
        const dn = (meta?.display_name || meta?.username) as string | undefined
        if (dn && dn.trim()) nameByEmail.set(email, dn.trim())
      }
      if (users.length < 1000) break
    }
  } catch (e) {
    console.warn('[recover] Nao foi possivel carregar display_names:', (e as Error)?.message)
  }

  const nowIso = new Date().toISOString()

  for (const email of lower) {
    // Todos os convites de acesso (type=invite) dessa pessoa.
    const { data: invites, error } = await supabase
      .from('invites')
      .select('id, status, invite_paid_email_sent')
      .ilike('email', email)
      .eq('type', 'invite')

    if (error) {
      console.error(`[${email}] erro ao buscar:`, error.message)
      continue
    }
    if (!invites || invites.length === 0) {
      console.log(`[${email}] SEM CONVITE — pulado`)
      continue
    }

    // 1) Marca como pago os que ainda estao pendentes.
    const pendingIds = invites.filter((i) => i.status === 'pending').map((i) => i.id)
    if (pendingIds.length > 0) {
      const { error: upErr } = await supabase
        .from('invites')
        .update({ status: 'paid', paid_at: nowIso })
        .in('id', pendingIds)
      if (upErr) {
        console.error(`[${email}] erro ao marcar pago:`, upErr.message)
        continue
      }
      console.log(`[${email}] marcado(s) como PAGO: ${pendingIds.length} convite(s)`)
    } else {
      console.log(`[${email}] nenhum pendente para marcar (ja pago?)`)
    }

    // 2) Envia o e-mail de acesso UMA vez por pessoa.
    const alreadySent = invites.some((i) => i.invite_paid_email_sent === true)
    if (alreadySent) {
      console.log(`[${email}] e-mail ja enviado anteriormente — nao reenvia`)
      continue
    }

    const result = await sendTemplateEmail('invite_paid', email, {
      name: nameByEmail.get(email),
      accessUrl: `${siteUrl}/minha-conta`,
    })

    if (result.status === 'sent') {
      // Marca a flag em TODOS os convites da pessoa para evitar reenvio futuro
      // (ex.: se um webhook atrasado da PixUp chegar depois).
      await supabase
        .from('invites')
        .update({ invite_paid_email_sent: true })
        .in(
          'id',
          invites.map((i) => i.id),
        )
      console.log(`[${email}] E-MAIL ENVIADO (id ${result.providerId})`)
    } else {
      console.error(`[${email}] FALHA no e-mail: ${result.status} ${result.error || ''}`)
    }
  }

  console.log('\n[recover] Concluido.')
}

main().catch((e) => {
  console.error('[recover] Erro fatal:', e)
  process.exit(1)
})
