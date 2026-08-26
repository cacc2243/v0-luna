import { createHash } from 'crypto'
import { getTiktokPixelsWithToken } from './pixels'

const EVENTS_API_URL = 'https://business-api.tiktok.com/open_api/v1.3/event/track/'

interface ServerEventUser {
  email?: string | null
  phone?: string | null
  /** Pode ser um unico id ou varios (ex.: user_id + CPF) para mais matches. */
  externalId?: string | string[] | null
  /** Click ID que o TikTok injeta na URL do anuncio (?ttclid=...). */
  ttclid?: string | null
  /** Valor do cookie first-party _ttp criado pelo pixel no navegador. */
  ttp?: string | null
  clientIp?: string | null
  clientUa?: string | null
  firstName?: string | null
  lastName?: string | null
  city?: string | null
  state?: string | null
  zip?: string | null
  country?: string | null
}

interface SendTiktokEventArgs {
  /** Nome do evento padrao do TikTok (ex.: CompletePayment). */
  eventName: string
  /** Mesmo event_id usado no navegador, para deduplicacao. */
  eventId: string
  eventSourceUrl?: string | null
  referrer?: string | null
  value?: number
  currency?: string
  properties?: Record<string, unknown>
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

/** Telefone em E.164 (assume Brasil quando falta o DDI) e depois hasheado. */
function normalizePhone(phone: string | null | undefined): string | undefined {
  if (!phone) return undefined
  let digits = String(phone).replace(/\D/g, '')
  if (!digits) return undefined
  if (digits.length <= 11) digits = `55${digits}`
  return sha256(`+${digits}`)
}

/**
 * Monta o objeto `user` da Events API. O TikTok exige SHA-256 em email,
 * telefone, external_id e nos campos de endereco; ttclid, ttp, ip e user_agent
 * NAO sao hasheados.
 */
function buildUser(user: ServerEventUser): Record<string, unknown> {
  const data: Record<string, unknown> = {}

  const email = normalizeAndHash(user.email)
  if (email) data.email = email

  const phone = normalizePhone(user.phone)
  if (phone) data.phone = phone

  const firstName = normalizeAndHash(user.firstName)
  if (firstName) data.first_name = firstName

  const lastName = normalizeAndHash(user.lastName)
  if (lastName) data.last_name = lastName

  const city = normalizeAndHash(user.city?.replace(/\s+/g, ''))
  if (city) data.city = city

  const state = normalizeAndHash(user.state?.replace(/\s+/g, ''))
  if (state) data.state = state

  const zip = normalizeAndHash(user.zip?.replace(/\D/g, ''))
  if (zip) data.zip_code = zip

  const country = normalizeAndHash(user.country)
  if (country) data.country = country

  // external_id: aceita varios identificadores estaveis (user_id, CPF).
  const rawIds = Array.isArray(user.externalId)
    ? user.externalId
    : user.externalId
      ? [user.externalId]
      : []
  const externalIds = rawIds
    .map((id) => normalizeAndHash(id, false))
    .filter((v): v is string => Boolean(v))
  if (externalIds.length > 0) data.external_id = externalIds

  // Sinais nao-hasheados (identificadores do proprio TikTok).
  if (user.ttclid) data.ttclid = user.ttclid
  if (user.ttp) data.ttp = user.ttp
  if (user.clientIp) data.ip = user.clientIp
  if (user.clientUa) data.user_agent = user.clientUa

  return data
}

/**
 * Envia um evento server-side (Events API 2.0) para TODOS os pixels do TikTok
 * habilitados que possuem access_token. Cada pixel usa seu proprio token e os
 * erros sao capturados por pixel, para que um pixel com problema nao afete os
 * demais nem bloqueie o fluxo de pagamento.
 *
 * Importante: o TikTok responde HTTP 200 mesmo em erro de negocio, sinalizando
 * a falha no campo `code` do corpo (0 = sucesso). Por isso validamos o code.
 */
export async function sendTiktokServerEvent(
  args: SendTiktokEventArgs,
): Promise<{ attempted: number; succeeded: number }> {
  const pixels = await getTiktokPixelsWithToken()
  if (pixels.length === 0) {
    console.log(
      '[v0] TikTok Events API: nenhum pixel com Access Token, evento nao enviado:',
      args.eventName,
    )
    return { attempted: 0, succeeded: 0 }
  }

  const user = buildUser(args.user)

  const properties: Record<string, unknown> = { ...(args.properties || {}) }
  if (typeof args.value === 'number') {
    properties.value = args.value
    properties.currency = args.currency || 'BRL'
  }

  const page: Record<string, unknown> = {}
  if (args.eventSourceUrl) page.url = args.eventSourceUrl
  if (args.referrer) page.referrer = args.referrer

  const baseEvent: Record<string, unknown> = {
    event: args.eventName,
    event_time: Math.floor(Date.now() / 1000),
    event_id: args.eventId,
    user,
    properties,
  }
  if (Object.keys(page).length > 0) baseEvent.page = page

  const results = await Promise.all(
    pixels.map(async (pixel) => {
      try {
        const body: Record<string, unknown> = {
          event_source: 'web',
          event_source_id: pixel.pixel_id,
          data: [baseEvent],
        }
        if (pixel.test_event_code) body.test_event_code = pixel.test_event_code

        const res = await fetch(EVENTS_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Access-Token': pixel.access_token as string,
          },
          body: JSON.stringify(body),
        })

        const text = await res.text().catch(() => '')
        if (!res.ok) {
          console.log(
            `[v0] TikTok erro HTTP pixel ${pixel.pixel_id} (${args.eventName}): ${res.status} ${text.slice(0, 300)}`,
          )
          return false
        }

        // O TikTok devolve 200 com code != 0 quando ha erro de negocio.
        let code: number | null = null
        let message = ''
        try {
          const json = JSON.parse(text) as { code?: number; message?: string }
          code = typeof json.code === 'number' ? json.code : null
          message = json.message || ''
        } catch {
          // resposta inesperada: trata como falha para permitir reenvio
        }

        if (code !== 0) {
          console.log(
            `[v0] TikTok erro pixel ${pixel.pixel_id} (${args.eventName}): code=${code} ${message.slice(0, 200)}`,
          )
          return false
        }

        console.log(`[v0] TikTok ${args.eventName} enviado para pixel ${pixel.pixel_id}`)
        return true
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'erro desconhecido'
        console.log(`[v0] TikTok exception pixel ${pixel.pixel_id}: ${msg}`)
        return false
      }
    }),
  )

  return { attempted: pixels.length, succeeded: results.filter(Boolean).length }
}

/**
 * Envia um evento de teste para um pixel especifico (usado no painel).
 * Retorna a resposta crua da Events API para feedback ao admin.
 */
export async function sendTiktokTestEvent(
  pixelId: string,
  accessToken: string,
  testEventCode?: string | null,
): Promise<{ ok: boolean; status: number; body: string }> {
  const body: Record<string, unknown> = {
    event_source: 'web',
    event_source_id: pixelId,
    data: [
      {
        event: 'ViewContent',
        event_time: Math.floor(Date.now() / 1000),
        event_id: `test_${Date.now()}`,
        user: { email: sha256('teste@luna-prive.example') },
        page: { url: 'https://lunaprive.com/painel' },
        properties: { content_type: 'product', currency: 'BRL', value: 1 },
      },
    ],
  }
  if (testEventCode) body.test_event_code = testEventCode

  try {
    const res = await fetch(EVENTS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Access-Token': accessToken,
      },
      body: JSON.stringify(body),
    })
    const text = await res.text()

    // Sucesso real exige code === 0 no corpo da resposta.
    let ok = false
    try {
      const json = JSON.parse(text) as { code?: number }
      ok = res.ok && json.code === 0
    } catch {
      ok = false
    }

    return { ok, status: res.status, body: text.slice(0, 600) }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'erro desconhecido'
    return { ok: false, status: 0, body: msg }
  }
}
