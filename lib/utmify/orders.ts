import { createAdminClient } from '@/lib/supabase/admin'
import { getAppSettings } from '@/lib/settings'

const UTMIFY_ORDERS_URL = 'https://api.utmify.com.br/api-credentials/orders'

/** Campos do invite usados para montar o pedido da Utmify. */
interface InviteLike {
  id: string
  type?: string | null
  status?: string | null
  amount?: number | string | null
  email?: string | null
  client_ip?: string | null
  created_at?: string | null
  paid_at?: string | null
  gateway?: string | null
  utm_source?: string | null
  utm_campaign?: string | null
  utm_medium?: string | null
  utm_content?: string | null
  utm_term?: string | null
  utmify_pending_sent?: boolean | null
  utmify_paid_sent?: boolean | null
  refunded_at?: string | null
}

const PRODUCT_NAME: Record<string, string> = {
  invite: 'Convite Luna Privé',
  chat: 'Chat Exclusivo Luna Privé',
  gift_unlock: 'Habilitação de Presentes Luna Privé',
  boost: 'Impulsionamento Luna Privé',
  verification: 'Verificação de Conta Luna Privé',
}

/**
 * Formata uma data para o padrao exigido pela Utmify: "YYYY-MM-DD HH:MM:SS"
 * em UTC. A API rejeita ISO com timezone, entao montamos manualmente.
 */
function formatUtmifyDate(input: string | Date | null | undefined): string {
  const d = input ? new Date(input) : new Date()
  const date = Number.isNaN(d.getTime()) ? new Date() : d
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ` +
    `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`
  )
}

/** Converte o valor do invite (em reais) para centavos inteiros. */
function toCents(amount: number | string | null | undefined): number {
  const value = Number(amount) || 0
  return Math.round(value * 100)
}

/**
 * Monta e envia um pedido para a Utmify. Idempotente por estagio (pending/paid)
 * via flags utmify_pending_sent / utmify_paid_sent, evitando envios duplicados
 * quando webhook e polling de status disparam simultaneamente.
 *
 * - stage 'waiting_payment': PIX gerado (pendente).
 * - stage 'paid': pagamento confirmado.
 * - stage 'refunded': pagamento reembolsado.
 *
 * Falhas nunca quebram o fluxo principal (apenas logam).
 */
export async function sendUtmifyOrder(
  invite: InviteLike,
  stage: 'waiting_payment' | 'paid' | 'refunded',
): Promise<void> {
  try {
    if (!invite?.id) return

    // Idempotencia: pending e paid usam flags dedicadas. 'refunded' nao tem flag
    // (evento raro) — a Utmify deduplica pelo orderId + status.
    const flagColumn =
      stage === 'paid'
        ? 'utmify_paid_sent'
        : stage === 'waiting_payment'
          ? 'utmify_pending_sent'
          : null
    if (stage === 'paid' && invite.utmify_paid_sent) return
    if (stage === 'waiting_payment' && invite.utmify_pending_sent) return

    const settings = await getAppSettings()
    const token = settings.utmifyApiToken?.trim()
    if (!token) {
      // Integração não configurada — nada a fazer.
      return
    }

    const supabase = createAdminClient()

    // Guarda atomica para os estagios com flag: so prossegue quem virar a flag
    // de false -> true.
    if (flagColumn) {
      const { data: claimed, error: claimError } = await supabase
        .from('invites')
        .update({ [flagColumn]: true })
        .eq('id', invite.id)
        .eq(flagColumn, false)
        .select('id')

      if (claimError) {
        console.log('[v0] Utmify: erro ao reservar flag', claimError.message)
        return
      }
      if (!claimed || claimed.length === 0) {
        // Outro processo ja enviou este estagio.
        return
      }
    }

    const type = invite.type || 'invite'
    const priceInCents = toCents(invite.amount)
    const productName = PRODUCT_NAME[type] || 'Compra Luna Privé'

    const trackingParameters = {
      utm_source: invite.utm_source || null,
      utm_campaign: invite.utm_campaign || null,
      utm_medium: invite.utm_medium || null,
      utm_content: invite.utm_content || null,
      utm_term: invite.utm_term || null,
      src: null as string | null,
      sck: null as string | null,
    }

    const payload = {
      orderId: invite.id,
      platform: 'LunaPrive',
      paymentMethod: 'pix',
      status: stage,
      createdAt: formatUtmifyDate(invite.created_at),
      approvedDate:
        stage === 'paid' || stage === 'refunded' ? formatUtmifyDate(invite.paid_at) : null,
      refundedAt: stage === 'refunded' ? formatUtmifyDate(invite.refunded_at) : null,
      customer: {
        name: 'Cliente Luna',
        email: invite.email || 'sememail@lunaprive.com',
        phone: null as string | null,
        document: null as string | null,
        country: 'BR',
        ip: invite.client_ip || null,
      },
      products: [
        {
          id: type,
          name: productName,
          planId: null as string | null,
          planName: null as string | null,
          quantity: 1,
          priceInCents,
        },
      ],
      trackingParameters,
      commission: {
        totalPriceInCents: priceInCents,
        gatewayFeeInCents: 0,
        userCommissionInCents: priceInCents,
      },
      isTest: false,
    }

    const res = await fetch(UTMIFY_ORDERS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-token': token,
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      console.log('[v0] Utmify: resposta não-OK', res.status, text.slice(0, 300))
      // Reverte a flag (quando houver) para permitir nova tentativa.
      if (flagColumn) {
        await supabase
          .from('invites')
          .update({ [flagColumn]: false })
          .eq('id', invite.id)
      }
      return
    }

    console.log('[v0] Utmify: pedido enviado', invite.id, 'estágio', stage, 'valor', priceInCents)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'erro desconhecido'
    console.log('[v0] Utmify: exception', msg)
  }
}
