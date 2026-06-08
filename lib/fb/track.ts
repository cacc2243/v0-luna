'use client'

/**
 * Helpers de tracking client-side para o Facebook Pixel (fbq).
 * Funcionam de forma silenciosa: se o fbq nao estiver carregado, nada quebra.
 */

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
    __fbqReady?: boolean
    __fbqQueue?: Array<() => void>
  }
}

/** Le um cookie pelo nome (ex.: _fbp, _fbc). */
export function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'))
  return match ? decodeURIComponent(match[1]) : null
}

/** Gera um event_id unico para deduplicacao Pixel <-> Conversions API. */
export function newEventId(prefix = 'evt'): string {
  const rand =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2)
  return `${prefix}_${Date.now()}_${rand}`
}

/** Dispara um evento padrao do Facebook (track). */
export function fbTrack(
  eventName: string,
  params?: Record<string, unknown>,
  eventId?: string,
): void {
  try {
    if (typeof window === 'undefined' || typeof window.fbq !== 'function') return
    if (eventId) {
      window.fbq('track', eventName, params || {}, { eventID: eventId })
    } else {
      window.fbq('track', eventName, params || {})
    }
  } catch {
    // nunca quebrar o fluxo por causa do pixel
  }
}

/**
 * Dispara um evento padrao do Facebook assim que o pixel estiver pronto.
 *
 * Eventos disparados muito cedo (logo apos a montagem da pagina, antes do
 * fbevents.js carregar e do fbq('init') rodar) se perdem com o fbTrack normal.
 * Aqui, se o pixel ainda nao estiver inicializado, o evento e enfileirado e
 * disparado assim que o FbPixel sinalizar window.__fbqReady. Se o pixel nunca
 * carregar (sem pixel configurado), o evento simplesmente nao e enviado.
 */
export function fbTrackWhenReady(
  eventName: string,
  params?: Record<string, unknown>,
  eventId?: string,
): void {
  if (typeof window === 'undefined') return

  // Pixel ja inicializado: dispara imediatamente.
  if (window.__fbqReady && typeof window.fbq === 'function') {
    fbTrack(eventName, params, eventId)
    return
  }

  // Ainda nao pronto: enfileira para o FbPixel disparar apos o init.
  const fire = () => fbTrack(eventName, params, eventId)
  if (!Array.isArray(window.__fbqQueue)) {
    window.__fbqQueue = []
  }
  window.__fbqQueue.push(fire)

  // Rede de seguranca: se por algum motivo o sinal __fbqReady nao chegar (ex.:
  // corrida de carregamento), tenta novamente por ate ~6s.
  let attempts = 0
  const retry = () => {
    if (window.__fbqReady) return // ja foi disparado pela fila
    if (typeof window.fbq === 'function') {
      // Remove da fila para evitar disparo duplicado e envia agora.
      if (Array.isArray(window.__fbqQueue)) {
        window.__fbqQueue = window.__fbqQueue.filter((fn) => fn !== fire)
      }
      fbTrack(eventName, params, eventId)
      return
    }
    attempts += 1
    if (attempts < 60) {
      setTimeout(retry, 100)
    }
  }
  setTimeout(retry, 100)
}

/** Dispara um evento personalizado do Facebook (trackCustom). */
export function fbTrackCustom(
  eventName: string,
  params?: Record<string, unknown>,
  eventId?: string,
): void {
  try {
    if (typeof window === 'undefined' || typeof window.fbq !== 'function') return
    if (eventId) {
      window.fbq('trackCustom', eventName, params || {}, { eventID: eventId })
    } else {
      window.fbq('trackCustom', eventName, params || {})
    }
  } catch {
    // nunca quebrar o fluxo por causa do pixel
  }
}
