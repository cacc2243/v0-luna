import { createAdminClient } from '@/lib/supabase/admin'
import { sendTemplateEmail } from '@/lib/email/send'
import { getSiteUrl } from '@/lib/site-url'

interface PaidInviteLike {
  id: string
  email: string | null
  type: string | null
}

/**
 * Envia o e-mail "Bem-vinda ao Luna" (invite_paid) uma unica vez.
 *
 * Idempotencia via CLAIM ATOMICO na coluna invite_paid_email_sent da tabela
 * invites. O webhook e o polling de /api/pix/status (alem de retries do
 * gateway) podem confirmar o pagamento quase ao mesmo tempo; a antiga
 * verificacao "checa depois envia" no email_logs nao era atomica e permitia
 * dois envios concorrentes. Aqui, apenas quem consegue virar a flag de
 * false -> true prossegue com o envio. Se o envio falhar, revertemos a flag
 * para que uma nova tentativa (polling) possa reenviar.
 *
 * So envia para o Convite de Acesso (type='invite'), unico fluxo com template.
 * Nunca lanca: qualquer falha e apenas logada.
 */
export async function sendInvitePaidEmailOnce(invite: PaidInviteLike): Promise<void> {
  try {
    if (!invite?.email || invite.type !== 'invite' || !invite.id) return

    const supabase = createAdminClient()

    // Claim atomico: so prossegue quem conseguir virar a flag de false -> true.
    const { data: claimed, error: claimError } = await supabase
      .from('invites')
      .update({ invite_paid_email_sent: true })
      .eq('id', invite.id)
      .eq('invite_paid_email_sent', false)
      .select('id')

    if (claimError) {
      console.error('[v0] Erro ao reservar envio de invite_paid:', claimError.message)
      return
    }
    if (!claimed || claimed.length === 0) {
      // Outro processo (webhook/polling) ja reservou o envio.
      return
    }

    const siteUrl = getSiteUrl()

    // Tenta usar o display_name do perfil para personalizar.
    let name: string | undefined
    try {
      const { data: authList } = await supabase.auth.admin.listUsers()
      const matched = authList?.users?.find(
        (u) => (u.email || '').toLowerCase() === invite.email!.toLowerCase(),
      )
      const meta = matched?.user_metadata as Record<string, unknown> | undefined
      const dn = (meta?.display_name || meta?.username) as string | undefined
      if (dn && dn.trim()) name = dn.trim()
    } catch {
      // segue sem nome
    }

    const result = await sendTemplateEmail('invite_paid', invite.email, {
      name,
      accessUrl: `${siteUrl}/minha-conta`,
    })

    // Se o envio nao foi bem-sucedido, libera a flag para uma nova tentativa
    // (ex.: o polling reprocessa). Evita perder o e-mail por falha transitoria.
    if (result.status !== 'sent') {
      await supabase
        .from('invites')
        .update({ invite_paid_email_sent: false })
        .eq('id', invite.id)
    }
  } catch (e) {
    console.error('[v0] Falha ao enviar e-mail invite_paid:', (e as Error)?.message)
  }
}
