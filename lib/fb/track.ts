'use client'

/**
 * Helpers de tracking client-side para o Facebook Pixel (fbq).
 * Funcionam de forma silenciosa: se o fbq nao estiver carregado, nada quebra.
 */

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
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
