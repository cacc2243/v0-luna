'use client'

/**
 * Helpers de tracking client-side para o TikTok Pixel (ttq).
 *
 * O snippet oficial do TikTok cria a fila global `window.ttq`. Como suportamos
 * varios pixels, o componente TiktokPixel chama `ttq.load(<pixel_id>)` para
 * cada um e aqui usamos `ttq.track(nome, props, { event_id })` — o TikTok
 * entrega o evento para todos os pixels carregados na pagina.
 *
 * O `event_id` e o mesmo enviado pela Events API server-side, o que permite ao
 * TikTok deduplicar a conversao contada duas vezes (navegador + servidor).
 *
 * Tudo e silencioso: se o TikTok nao estiver configurado, nada quebra.
 */

interface TtqQueue {
  track: (event: string, properties?: Record<string, unknown>, options?: Record<string, unknown>) => void
  page: () => void
  identify: (data: Record<string, unknown>) => void
  load: (pixelId: string, options?: Record<string, unknown>) => void
  instance?: (pixelId: string) => unknown
}

declare global {
  interface Window {
    ttq?: TtqQueue
    TiktokAnalyticsObject?: string
    /** Pixel IDs do TikTok habilitados (definido pelo TiktokPixel). */
    __ttqPixels?: string[]
    /** Sinaliza que os pixels ja foram carregados da API publica. */
    __ttqReady?: boolean
    /** Fila de eventos disparados antes dos pixels carregarem. */
    __ttqQueue?: Array<() => void>
  }
}

/** Dispara um evento no ttq. O TikTok replica para todos os pixels carregados. */
export function ttqTrack(
  event: string,
  properties: Record<string, unknown> = {},
  eventId?: string,
): void {
  try {
    if (typeof window === 'undefined') return
    const pixels = Array.isArray(window.__ttqPixels) ? window.__ttqPixels : []
    if (pixels.length === 0) return
    if (!window.ttq || typeof window.ttq.track !== 'function') return

    const options = eventId ? { event_id: eventId } : undefined
    window.ttq.track(event, properties, options)
  } catch {
    // nunca quebrar o fluxo por causa do pixel
  }
}

/**
 * Envia os dados de identificacao (email/telefone) para o ttq. O proprio
 * pixel do TikTok faz o hash SHA-256 no navegador antes de transmitir, o que
 * melhora a correspondencia (Advanced Matching) sem expor PII.
 */
export function ttqIdentify(user: {
  email?: string | null
  phone?: string | null
  externalId?: string | null
}): void {
  try {
    if (typeof window === 'undefined') return
    if (!window.ttq || typeof window.ttq.identify !== 'function') return

    const payload: Record<string, unknown> = {}
    if (user.email) payload.email = String(user.email).trim().toLowerCase()
    if (user.phone) {
      // TikTok espera E.164; assume Brasil quando o DDI nao vem informado.
      let digits = String(user.phone).replace(/\D/g, '')
      if (digits && digits.length <= 11) digits = `55${digits}`
      if (digits) payload.phone_number = `+${digits}`
    }
    if (user.externalId) payload.external_id = String(user.externalId).trim()

    if (Object.keys(payload).length > 0) window.ttq.identify(payload)
  } catch {
    // silencioso
  }
}

/**
 * Dispara um evento do TikTok assim que os pixels estiverem disponiveis.
 *
 * Eventos disparados muito cedo (antes de a lista de pixels chegar da API)
 * seriam perdidos pelo ttqTrack normal. Aqui, se ainda nao estiver pronto, o
 * evento e enfileirado e disparado quando o TiktokPixel sinaliza
 * window.__ttqReady. Se nenhum pixel estiver configurado, nada e enviado.
 */
export function ttqTrackWhenReady(
  event: string,
  properties: Record<string, unknown> = {},
  eventId?: string,
): void {
  if (typeof window === 'undefined') return

  // Pixels ja carregados: dispara imediatamente.
  if (window.__ttqReady) {
    ttqTrack(event, properties, eventId)
    return
  }

  // Ainda nao pronto: enfileira para o TiktokPixel disparar apos carregar.
  const fire = () => ttqTrack(event, properties, eventId)
  if (!Array.isArray(window.__ttqQueue)) {
    window.__ttqQueue = []
  }
  window.__ttqQueue.push(fire)

  // Rede de seguranca: caso o sinal __ttqReady nao chegue, tenta por ~6s.
  let attempts = 0
  const retry = () => {
    if (window.__ttqReady) {
      // ja foi disparado pela fila; remove daqui para nao duplicar
      if (Array.isArray(window.__ttqQueue)) {
        window.__ttqQueue = window.__ttqQueue.filter((fn) => fn !== fire)
      }
      return
    }
    attempts += 1
    if (attempts < 60) {
      setTimeout(retry, 100)
    }
  }
  setTimeout(retry, 100)
}

/** Le o cookie first-party _ttp criado pelo pixel (usado na Events API). */
export function getTtp(): string | null {
  if (typeof document === 'undefined') return null
  try {
    const match = document.cookie.match(/(?:^|; )_ttp=([^;]*)/)
    return match ? decodeURIComponent(match[1]) : null
  } catch {
    return null
  }
}
