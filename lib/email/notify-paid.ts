import { createAdminClient } from '@/lib/supabase/admin'
import { sendTemplateEmail } from '@/lib/email/send'
import { getSiteUrl } from '@/lib/site-url'

interface PaidInviteLike {
  id: string
  email: string | null
  type: string | null
}

/**
 * Envia o e-mail "Acesso liberado" (invite_paid) uma unica vez.
 *
 * Idempotencia: antes de enviar, verifica em email_logs se ja existe um envio
 * bem-sucedido (status='sent') do template invite_paid para este destinatario.
 * Como o webhook e o polling de /api/pix/status podem disparar este caminho
 * varias vezes, essa checagem evita e-mails duplicados sem precisar de uma nova
 * coluna no banco. O Convite de Acesso e unico por pessoa, entao casar por
 * (template + destinatario) e suficiente.
 *
 * So envia para o Convite de Acesso (type='invite'), unico fluxo com template.
 * Nunca lanca: qualquer falha e apenas logada.
 */
export async function sendInvitePaidEmailOnce(invite: PaidInviteLike): Promise<void> {
  try {
    if (!invite?.email || invite.type !== 'invite') return

    const supabase = createAdminClient()

    // Ja foi enviado com sucesso para este destinatario?
    const { data: existing } = await supabase
      .from('email_logs')
      .select('id')
      .eq('template_id', 'invite_paid')
      .eq('recipient', invite.email)
      .eq('status', 'sent')
      .limit(1)
      .maybeSingle()

    if (existing) return

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

    await sendTemplateEmail('invite_paid', invite.email, {
      name,
      accessUrl: `${siteUrl}/minha-conta`,
    })
  } catch (e) {
    console.error('[v0] Falha ao enviar e-mail invite_paid:', (e as Error)?.message)
  }
}
