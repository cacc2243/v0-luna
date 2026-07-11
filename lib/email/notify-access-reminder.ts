import { createAdminClient } from '@/lib/supabase/admin'
import { sendTemplateEmail } from '@/lib/email/send'
import { getSiteUrl } from '@/lib/site-url'

/**
 * Reforço de acesso: e-mail enviado ~1h após o pagamento do convite quando a
 * usuária ainda NÃO fez login na plataforma.
 *
 * Como identificamos "não logou":
 * - A maioria dos invites pagos NÃO tem user_id preenchido, então a chave de
 *   ligação com a conta é o e-mail.
 * - Consultamos auth.users (via admin API) e comparamos last_sign_in_at com o
 *   paid_at do convite. Se a usuária não tem conta encontrada, nunca logou, ou
 *   o último login foi ANTES do pagamento, consideramos que ela ainda não
 *   acessou a plataforma após comprar — e mandamos o reforço.
 *
 * Idempotência: claim atômico na coluna invite_access_reminder_sent, mesmo
 * padrão do e-mail de pagamento (invite_paid_email_sent).
 */

// Janela de elegibilidade: pago há mais de 1h e há no máximo N dias. Evita
// disparar reforço retroativo para toda a base histórica de convites pagos.
const MIN_AGE_MS = 60 * 60 * 1000 // 1 hora
const MAX_AGE_MS = 3 * 24 * 60 * 60 * 1000 // 3 dias

interface EligibleInvite {
  id: string
  email: string
  paid_at: string
}

export interface AccessReminderResult {
  scanned: number
  sent: number
  skipped: number
  errors: number
}

/**
 * Constrói um mapa email -> last_sign_in_at (ISO ou null) para os e-mails
 * informados, paginando a listagem de usuários do Supabase Auth.
 */
async function buildLastSignInMap(
  supabase: ReturnType<typeof createAdminClient>,
  neededEmails: Set<string>,
): Promise<Map<string, string | null>> {
  const map = new Map<string, string | null>()
  const perPage = 200
  const maxPages = 50 // teto de segurança (até 10k usuários por execução)

  for (let page = 1; page <= maxPages; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage })
    if (error) {
      console.error('[v0] Erro ao listar usuários (access reminder):', error.message)
      break
    }
    const users = data?.users ?? []
    for (const u of users) {
      const email = (u.email || '').toLowerCase()
      if (email && neededEmails.has(email)) {
        map.set(email, u.last_sign_in_at ?? null)
      }
    }
    // Para cedo se já encontramos todos os e-mails ou acabou a paginação.
    if (users.length < perPage) break
    if (map.size >= neededEmails.size) break
  }

  return map
}

/**
 * Verifica os convites pagos elegíveis e envia o reforço para quem ainda não
 * logou. Nunca lança: falhas são apenas logadas. Retorna um resumo.
 */
export async function runAccessReminders(): Promise<AccessReminderResult> {
  const result: AccessReminderResult = { scanned: 0, sent: 0, skipped: 0, errors: 0 }

  try {
    const supabase = createAdminClient()
    const now = Date.now()
    const maxPaidAt = new Date(now - MIN_AGE_MS).toISOString() // pago há >= 1h
    const minPaidAt = new Date(now - MAX_AGE_MS).toISOString() // pago há <= 3 dias

    const { data: invites, error } = await supabase
      .from('invites')
      .select('id, email, paid_at')
      .eq('status', 'paid')
      .eq('type', 'invite')
      .eq('invite_access_reminder_sent', false)
      .not('email', 'is', null)
      .not('paid_at', 'is', null)
      .lte('paid_at', maxPaidAt)
      .gte('paid_at', minPaidAt)
      .order('paid_at', { ascending: true })
      .limit(200)

    if (error) {
      console.error('[v0] Erro ao buscar convites elegíveis (access reminder):', error.message)
      return result
    }

    const eligible = (invites ?? []) as EligibleInvite[]
    result.scanned = eligible.length
    if (eligible.length === 0) return result

    // Mapa de login por e-mail.
    const neededEmails = new Set(eligible.map((i) => i.email.toLowerCase()))
    const lastSignInMap = await buildLastSignInMap(supabase, neededEmails)
    const siteUrl = getSiteUrl()

    for (const invite of eligible) {
      const emailKey = invite.email.toLowerCase()
      const lastSignIn = lastSignInMap.get(emailKey) // undefined = usuária não encontrada
      const paidAtMs = new Date(invite.paid_at).getTime()

      // Já logou APÓS o pagamento? Então acessou — não precisa de reforço.
      const loggedInAfterPaying =
        lastSignIn != null && new Date(lastSignIn).getTime() > paidAtMs
      if (loggedInAfterPaying) {
        // Marca como "tratado" para não reprocessar toda execução.
        await supabase
          .from('invites')
          .update({ invite_access_reminder_sent: true })
          .eq('id', invite.id)
          .eq('invite_access_reminder_sent', false)
        result.skipped++
        continue
      }

      // Claim atômico: só prossegue quem virar a flag false -> true.
      const { data: claimed, error: claimError } = await supabase
        .from('invites')
        .update({
          invite_access_reminder_sent: true,
          invite_access_reminder_at: new Date().toISOString(),
        })
        .eq('id', invite.id)
        .eq('invite_access_reminder_sent', false)
        .select('id')

      if (claimError) {
        console.error('[v0] Erro ao reservar reforço de acesso:', claimError.message)
        result.errors++
        continue
      }
      if (!claimed || claimed.length === 0) {
        // Outro processo já reservou.
        result.skipped++
        continue
      }

      // Nome opcional a partir do metadata da conta.
      let name: string | undefined
      try {
        const { data: authList } = await supabase.auth.admin.listUsers()
        const matched = authList?.users?.find(
          (u) => (u.email || '').toLowerCase() === emailKey,
        )
        const meta = matched?.user_metadata as Record<string, unknown> | undefined
        const dn = (meta?.display_name || meta?.username) as string | undefined
        if (dn && dn.trim()) name = dn.trim()
      } catch {
        // segue sem nome
      }

      const sendResult = await sendTemplateEmail('invite_access_reminder', invite.email, {
        name,
        accessUrl: `${siteUrl}/minha-conta`,
      })

      if (sendResult.status === 'sent') {
        result.sent++
      } else {
        // Libera a flag para nova tentativa numa próxima execução.
        await supabase
          .from('invites')
          .update({ invite_access_reminder_sent: false, invite_access_reminder_at: null })
          .eq('id', invite.id)
        result.errors++
      }
    }
  } catch (e) {
    console.error('[v0] Falha na rotina de reforço de acesso:', (e as Error)?.message)
  }

  return result
}
