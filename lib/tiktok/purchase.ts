import { createAdminClient } from '@/lib/supabase/admin'
import { sendTiktokServerEvent } from './events-api'

interface InviteLike {
  id: string
  type?: string | null
  status?: string | null
  amount?: number | string | null
  email?: string | null
  user_id?: string | null
  // Identificacao do pagador (para correspondencia avancada)
  payer_name?: string | null
  payer_phone?: string | null
  payer_document?: string | null
  client_ip?: string | null
  client_ua?: string | null
  event_source_url?: string | null
  referrer?: string | null
  // Sinais do TikTok
  ttclid?: string | null
  ttp?: string | null
  tt_event_id?: string | null
  tt_purchase_sent?: boolean | null
  // Atribuicao de marketing
  utm_source?: string | null
  utm_campaign?: string | null
  utm_medium?: string | null
  utm_content?: string | null
  utm_term?: string | null
}

const CONTENT_NAME: Record<string, string> = {
  invite: 'Convite Luna Privé',
  chat: 'Chat Exclusivo Luna Privé',
  gift_unlock: 'Habilitação de Presentes Luna Privé',
  boost: 'Impulsionamento Luna Privé',
  verification: 'Verificação de Conta Luna Privé',
}

/**
 * Envia o evento CompletePayment (equivalente ao Purchase) para todos os pixels
 * do TikTok com Access Token quando um invite pago e detectado.
 *
 * A flag tt_purchase_sent so e marcada como true APOS pelo menos um pixel
 * confirmar o recebimento, garantindo que falhas de envio (token invalido,
 * rede, nenhum pixel com token) nao percam a conversao — o safety-net
 * (webhook/polling) reenvia enquanto a flag estiver false. O event_id estavel
 * (tt_purchase_<id>) garante que o TikTok deduplica reenvios e tambem o evento
 * disparado pelo navegador na tela de confirmacao.
 */
export async function maybeSendTiktokPurchase(invite: InviteLike): Promise<void> {
  try {
    if (!invite?.id) return
    if (invite.status !== 'paid') return
    if (invite.tt_purchase_sent) return

    const supabase = createAdminClient()

    const value = Number(invite.amount) || 0
    const type = invite.type || 'invite'
    const eventId = invite.tt_event_id || `tt_purchase_${invite.id}`
    const contentName = CONTENT_NAME[type] || 'Compra Luna Privé'

    // Nome/sobrenome derivados do nome do pagador (quando informado).
    const fullName = (invite.payer_name || '').trim()
    const parts = fullName ? fullName.split(/\s+/) : []
    const firstName = parts.length > 0 ? parts[0] : null
    const lastName = parts.length > 1 ? parts.slice(1).join(' ') : null

    // external_id: id interno do usuario E o CPF (quando houver). Mais
    // identificadores estaveis => maior qualidade de correspondencia.
    const externalIds = [invite.user_id, invite.payer_document].filter(
      (v): v is string => Boolean(v && String(v).trim()),
    )

    // Anexa as UTMs para que a origem do lead acompanhe a conversao.
    const attributionData: Record<string, unknown> = {}
    if (invite.utm_source) attributionData.utm_source = invite.utm_source
    if (invite.utm_campaign) attributionData.utm_campaign = invite.utm_campaign
    if (invite.utm_medium) attributionData.utm_medium = invite.utm_medium
    if (invite.utm_content) attributionData.utm_content = invite.utm_content
    if (invite.utm_term) attributionData.utm_term = invite.utm_term

    const result = await sendTiktokServerEvent({
      eventName: 'CompletePayment',
      eventId,
      eventSourceUrl: invite.event_source_url || null,
      referrer: invite.referrer || null,
      value,
      currency: 'BRL',
      properties: {
        content_type: 'product',
        content_id: type,
        content_name: contentName,
        contents: [
          {
            content_id: type,
            content_name: contentName,
            content_type: 'product',
            price: value,
            quantity: 1,
          },
        ],
        order_id: invite.id,
        transaction_type: type,
        ...attributionData,
      },
      user: {
        email: invite.email,
        phone: invite.payer_phone,
        firstName,
        lastName,
        externalId: externalIds.length > 0 ? externalIds : null,
        country: 'br',
        ttclid: invite.ttclid,
        ttp: invite.ttp,
        clientIp: invite.client_ip,
        clientUa: invite.client_ua,
      },
    })

    // So marcamos como enviado quando pelo menos um pixel confirmou. Se nenhum
    // pixel tem token ou todos falharam, deixamos tt_purchase_sent = false para
    // que o safety-net (webhook/polling) reenvie depois.
    if (result.succeeded > 0) {
      const { error: markError } = await supabase
        .from('invites')
        .update({ tt_purchase_sent: true })
        .eq('id', invite.id)
      if (markError) {
        console.log('[v0] TikTok Purchase: falha ao marcar tt_purchase_sent', markError.message)
      }
      console.log(
        '[v0] CompletePayment enviado ao TikTok para invite',
        invite.id,
        'valor',
        value,
        `(pixels ${result.succeeded}/${result.attempted})`,
      )
    } else if (result.attempted > 0) {
      console.log(
        '[v0] CompletePayment NAO confirmado no TikTok para invite',
        invite.id,
        `(pixels ${result.succeeded}/${result.attempted}) - sera reenviado`,
      )
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'erro desconhecido'
    console.log('[v0] TikTok Purchase: exception', msg)
  }
}
