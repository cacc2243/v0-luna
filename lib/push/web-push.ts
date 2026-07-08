import 'server-only'
import webpush from 'web-push'
import { createAdminClient } from '@/lib/supabase/admin'

const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY || ''
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || ''
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:contato@lunaprive.com'

let configured = false

/** Configura o VAPID uma unica vez. Retorna false se faltar chave. */
function ensureConfigured(): boolean {
  if (configured) return true
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
    console.log('[v0] Web Push: VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY ausentes.')
    return false
  }
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE)
  configured = true
  return true
}

export function isPushConfigured(): boolean {
  return Boolean(VAPID_PUBLIC && VAPID_PRIVATE)
}

export function getVapidPublicKey(): string {
  return VAPID_PUBLIC
}

export type PushPayload = {
  title: string
  body: string
  url?: string
  tag?: string
  icon?: string
}

type SubscriptionRow = {
  id: string
  endpoint: string
  p256dh: string
  auth: string
}

/**
 * Envia uma notificacao push para todos os dispositivos do admin inscritos.
 * Remove inscricoes expiradas (404/410) automaticamente.
 * Retorna quantos envios tiveram sucesso.
 */
export async function sendAdminPush(payload: PushPayload): Promise<{ sent: number; total: number }> {
  if (!ensureConfigured()) return { sent: 0, total: 0 }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('admin_push_subscriptions')
    .select('id, endpoint, p256dh, auth')

  if (error) {
    console.log('[v0] Web Push: erro ao carregar inscricoes:', error.message)
    return { sent: 0, total: 0 }
  }

  const subs = (data || []) as SubscriptionRow[]
  if (subs.length === 0) return { sent: 0, total: 0 }

  const body = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url || '/painel',
    tag: payload.tag,
    icon: payload.icon,
  })

  let sent = 0
  const staleIds: string[] = []

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          body,
          { TTL: 3600, urgency: 'high' },
        )
        sent++
      } catch (e) {
        const statusCode = (e as { statusCode?: number })?.statusCode
        if (statusCode === 404 || statusCode === 410) {
          // Inscricao expirada/cancelada: remover.
          staleIds.push(sub.id)
        } else {
          const msg = e instanceof Error ? e.message : 'erro desconhecido'
          console.log(`[v0] Web Push: falha ao enviar (${statusCode || '?'}):`, msg)
        }
      }
    }),
  )

  if (staleIds.length > 0) {
    await supabase.from('admin_push_subscriptions').delete().in('id', staleIds)
    console.log(`[v0] Web Push: ${staleIds.length} inscricao(oes) expirada(s) removida(s).`)
  }

  return { sent, total: subs.length }
}
