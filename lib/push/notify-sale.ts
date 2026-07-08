import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendAdminPush } from '@/lib/push/web-push'

type InviteLike = {
  id?: string | null
  status?: string | null
  type?: string | null
  amount?: number | string | null
  admin_push_sent?: boolean | null
}

const SALE_LABEL: Record<string, string> = {
  invite: 'Novo Convite de Acesso',
  chat: 'Chat Exclusivo desbloqueado',
  gift_unlock: 'Habilitação de Presentes',
  boost: 'Impulsionamento contratado',
  verification: 'Verificação de Conta',
}

function brl(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

/**
 * Notifica o admin (via Web Push) quando uma venda e aprovada.
 * Idempotente: usa a flag admin_push_sent, reservada atomicamente, para que
 * webhook e polling nao enviem a notificacao em duplicidade.
 */
export async function notifyAdminSale(invite: InviteLike): Promise<void> {
  try {
    if (!invite?.id) return
    if (invite.status !== 'paid') return
    if (invite.admin_push_sent) return

    const supabase = createAdminClient()

    // Guarda atomica: so prossegue quem virar a flag de false -> true.
    const { data: claimed, error: claimError } = await supabase
      .from('invites')
      .update({ admin_push_sent: true })
      .eq('id', invite.id)
      .eq('admin_push_sent', false)
      .select('id')

    if (claimError) {
      console.log('[v0] notifyAdminSale: erro ao reservar flag:', claimError.message)
      return
    }
    if (!claimed || claimed.length === 0) {
      // Outra requisicao ja notificou.
      return
    }

    const type = invite.type || 'invite'
    const value = Number(invite.amount) || 0
    const label = SALE_LABEL[type] || 'Nova venda'
    const title = 'Venda aprovada!'
    const body = value > 0 ? `${label} — ${brl(value)}` : label

    const result = await sendAdminPush({
      title,
      body,
      url: '/painel',
      tag: `venda-${invite.id}`,
    })

    console.log(
      '[v0] notifyAdminSale: push de venda enviado',
      invite.id,
      `(${result.sent}/${result.total} dispositivos)`,
    )
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'erro desconhecido'
    console.log('[v0] notifyAdminSale: exception:', msg)
  }
}
