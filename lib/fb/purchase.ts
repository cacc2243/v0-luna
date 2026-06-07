import { createAdminClient } from '@/lib/supabase/admin'
import { sendServerEvent } from './capi'

interface InviteLike {
  id: string
  type?: string | null
  status?: string | null
  amount?: number | string | null
  email?: string | null
  user_id?: string | null
  fbp?: string | null
  fbc?: string | null
  client_ip?: string | null
  client_ua?: string | null
  event_source_url?: string | null
  fb_event_id?: string | null
  fb_purchase_sent?: boolean | null
}

const CONTENT_NAME: Record<string, string> = {
  invite: 'Convite Luna Privé',
  chat: 'Chat Exclusivo Luna Privé',
  gift_unlock: 'Habilitação de Presentes Luna Privé',
  boost: 'Impulsionamento Luna Privé',
}

/**
 * Envia o evento Purchase para todos os pixels habilitados quando um invite
 * pago e detectado. Garante idempotencia via flag fb_purchase_sent (marcada
 * de forma atomica antes do envio), evitando eventos duplicados quando tanto
 * o webhook quanto o polling de status disparam.
 *
 * A verificacao de saque (type='verification') NUNCA envia Purchase.
 */
export async function maybeSendPurchase(invite: InviteLike): Promise<void> {
  try {
    if (!invite?.id) return
    if (invite.status !== 'paid') return
    if (invite.type === 'verification') return
    if (invite.fb_purchase_sent) return

    const supabase = createAdminClient()

    // Guarda atomica: so prossegue quem conseguir virar a flag de false -> true.
    const { data: claimed, error: claimError } = await supabase
      .from('invites')
      .update({ fb_purchase_sent: true })
      .eq('id', invite.id)
      .eq('fb_purchase_sent', false)
      .select('id')

    if (claimError) {
      console.log('[v0] Purchase: erro ao reservar flag', claimError.message)
      return
    }
    if (!claimed || claimed.length === 0) {
      // Outro processo ja enviou.
      return
    }

    const value = Number(invite.amount) || 0
    const type = invite.type || 'invite'
    const eventId = invite.fb_event_id || `purchase_${invite.id}`

    await sendServerEvent({
      eventName: 'Purchase',
      eventId,
      eventSourceUrl: invite.event_source_url || null,
      actionSource: 'website',
      value,
      currency: 'BRL',
      customData: {
        content_name: CONTENT_NAME[type] || 'Compra Luna Privé',
        content_type: 'product',
        order_id: invite.id,
        transaction_type: type,
      },
      user: {
        email: invite.email,
        externalId: invite.user_id,
        fbp: invite.fbp,
        fbc: invite.fbc,
        clientIp: invite.client_ip,
        clientUa: invite.client_ua,
      },
    })

    console.log('[v0] Purchase enviado ao Facebook para invite', invite.id, 'valor', value)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'erro desconhecido'
    console.log('[v0] Purchase: exception', msg)
  }
}
