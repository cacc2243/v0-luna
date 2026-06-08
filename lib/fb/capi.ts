import { createHash } from 'crypto'
import { getEnabledPixels } from './pixels'

const GRAPH_VERSION = 'v21.0'

interface ServerEventUser {
  email?: string | null
  phone?: string | null
  externalId?: string | null
  fbp?: string | null
  fbc?: string | null
  clientIp?: string | null
  clientUa?: string | null
  firstName?: string | null
  lastName?: string | null
}

interface SendServerEventArgs {
  eventName: string
  eventId: string
  eventSourceUrl?: string | null
  actionSource?: 'website' | 'app' | 'other'
  value?: number
  currency?: string
  customData?: Record<string, unknown>
  user: ServerEventUser
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function normalizeAndHash(value: string | null | undefined, lower = true): string | undefined {
  if (!value) return undefined
  const trimmed = String(value).trim()
  if (!trimmed) return undefined
  return sha256(lower ? trimmed.toLowerCase() : trimmed)
}

/** Apenas digitos, com codigo do pais para telefones (assume BR se faltar). */
function normalizePhone(phone: string | null | undefined): string | undefined {
  if (!phone) return undefined
  let digits = String(phone).replace(/\D/g, '')
  if (!digits) return undefined
  if (digits.length <= 11) digits = `55${digits}`
  return sha256(digits)
}

/**
 * Monta o objeto user_data da Conversions API com a PII devidamente
 * normalizada e com hash SHA-256. Campos como fbp/fbc/IP/UA NAO sao hasheados.
 */
function buildUserData(user: ServerEventUser): Record<string, unknown> {
  const data: Record<string, unknown> = {}

  const em = normalizeAndHash(user.email)
  if (em) data.em = [em]

  const ph = normalizePhone(user.phone)
  if (ph) data.ph = [ph]

  const fn = normalizeAndHash(user.firstName)
  if (fn) data.fn = [fn]

  const ln = normalizeAndHash(user.lastName)
  if (ln) data.ln = [ln]

  // external_id pode ser hasheado; usamos o id interno do usuario.
  const externalId = normalizeAndHash(user.externalId, false)
  if (externalId) data.external_id = [externalId]

  // Sinais nao-hasheados.
  if (user.fbp) data.fbp = user.fbp
  if (user.fbc) data.fbc = user.fbc
  if (user.clientIp) data.client_ip_address = user.clientIp
  if (user.clientUa) data.client_user_agent = user.clientUa

  return data
}

/**
 * Envia um evento server-side (Conversions API) para TODOS os pixels
 * habilitados. Cada pixel usa seu proprio access token. Erros sao capturados
 * por pixel para que um pixel com problema nao afete os demais nem bloqueie o
 * fluxo de pagamento.
 */
export async function sendServerEvent(args: SendServerEventArgs): Promise<void> {
  const pixels = await getEnabledPixels()
  if (pixels.length === 0) return

  const userData = buildUserData(args.user)

  const customData: Record<string, unknown> = { ...(args.customData || {}) }
  if (typeof args.value === 'number') {
    customData.value = args.value
    customData.currency = args.currency || 'BRL'
  }

  const baseEvent: Record<string, unknown> = {
    event_name: args.eventName,
    event_time: Math.floor(Date.now() / 1000),
    event_id: args.eventId,
    action_source: args.actionSource || 'website',
    user_data: userData,
    custom_data: customData,
  }
  if (args.eventSourceUrl) baseEvent.event_source_url = args.eventSourceUrl

  await Promise.all(
    pixels.map(async (pixel) => {
      try {
        const body: Record<string, unknown> = { data: [baseEvent] }
        if (pixel.test_event_code) body.test_event_code = pixel.test_event_code

        const res = await fetch(
          `https://graph.facebook.com/${GRAPH_VERSION}/${pixel.pixel_id}/events?access_token=${encodeURIComponent(
            pixel.access_token,
          )}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          },
        )

        if (!res.ok) {
          const text = await res.text().catch(() => '')
          console.log(
            `[v0] CAPI erro pixel ${pixel.pixel_id} (${args.eventName}): ${res.status} ${text.slice(0, 300)}`,
          )
        } else {
          console.log(`[v0] CAPI ${args.eventName} enviado para pixel ${pixel.pixel_id}`)
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'erro desconhecido'
        console.log(`[v0] CAPI exception pixel ${pixel.pixel_id}: ${msg}`)
      }
    }),
  )
}

/**
 * Envia um evento de teste para um pixel especifico (usado no painel).
 * Retorna a resposta crua da Graph API para feedback ao admin.
 */
export async function sendTestEvent(
  pixelId: string,
  accessToken: string,
  testEventCode?: string | null,
): Promise<{ ok: boolean; status: number; body: string }> {
  const event: Record<string, unknown> = {
    event_name: 'TestEvent',
    event_time: Math.floor(Date.now() / 1000),
    event_id: `test_${Date.now()}`,
    action_source: 'website',
    event_source_url: 'https://luna-prive.example/painel',
    user_data: {
      em: [sha256('teste@luna-prive.example')],
    },
  }

  const body: Record<string, unknown> = { data: [event] }
  if (testEventCode) body.test_event_code = testEventCode

  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${pixelId}/events?access_token=${encodeURIComponent(
        accessToken,
      )}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
    )
    const text = await res.text()
    return { ok: res.ok, status: res.status, body: text.slice(0, 600) }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'erro desconhecido'
    return { ok: false, status: 0, body: msg }
  }
}
