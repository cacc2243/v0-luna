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
  // Atribuicao de marketing (UTMs do Facebook + fbclid)
  utm_source?: string | null
  utm_campaign?: string | null
  utm_medium?: string | null
  utm_content?: string | null
  utm_term?: string | null
  fbclid?: string | null
}

/**
 * Deriva o parametro _fbc a partir do fbclid quando o cookie _fbc nao foi
 * capturado no navegador. Formato exigido pelo Facebook:
 *   fb.<subdomainIndex>.<creationTime>.<fbclid>
 * Sem o timestamp exato de criacao do click, usamos o momento atual — e o
 * comportamento recomendado quando so se tem o fbclid.
 */
function deriveFbc(fbc: string | null | undefined, fbclid: string | null | undefined): string | null {
  if (fbc) return fbc
  if (!fbclid) return null
  return `fb.1.${Date.now()}.${fbclid}`
}

const CONTENT_NAME: Record<string, string> = {
  invite: 'Convite Luna Privé',
  chat: 'Chat Exclusivo Luna Privé',
  gift_unlock: 'Habilitação de Presentes Luna Privé',
  boost: 'Impulsionamento Luna Privé',
  verification: 'Verificação de Conta Luna Privé',
}

/**
 * Envia o evento Purchase para todos os pixels habilitados quando um invite
 * pago e detectado. Garante idempotencia via flag fb_purchase_sent (marcada
 * de forma atomica antes do envio), evitando eventos duplicados quando tanto
 * o webhook quanto o polling de status disparam.
 *
 * Todos os tipos pagos (convite, chat, presentes, impulsionamento e
 * verificacao de saque) disparam Purchase com os dados do cliente.
 */
export async function maybeSendPurchase(invite: InviteLike): Promise<void> {
  try {
    if (!invite?.id) return
    if (invite.status !== 'paid') return
    if (invite.fb_purchase_sent) return

    const supabase = createAdminClient()

    const value = Number(invite.amount) || 0
    const type = invite.type || 'invite'
    const eventId = invite.fb_event_id || `purchase_${invite.id}`

    // _fbc derivado do fbclid quando o cookie nao foi capturado, melhorando a
    // taxa de correspondencia da conversao com a campanha de origem.
    const fbc = deriveFbc(invite.fbc, invite.fbclid)

    // Anexa as UTMs ao custom_data para que a origem do lead (campanha, conjunto
    // e anuncio configurados no Facebook) acompanhe a conversao nos relatorios.
    const attributionData: Record<string, unknown> = {}
    if (invite.utm_source) attributionData.utm_source = invite.utm_source
    if (invite.utm_campaign) attributionData.utm_campaign = invite.utm_campaign
    if (invite.utm_medium) attributionData.utm_medium = invite.utm_medium
    if (invite.utm_content) attributionData.utm_content = invite.utm_content
    if (invite.utm_term) attributionData.utm_term = invite.utm_term

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
        ...attributionData,
      },
      user: {
        email: invite.email,
        externalId: invite.user_id,
        fbp: invite.fbp,
        fbc,
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
