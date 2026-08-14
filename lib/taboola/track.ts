'use client'

import { getTaboolaUnifiedId } from '@/lib/taboola/identity'

/**
 * Helpers de tracking client-side para o Taboola Pixel (_tfa).
 *
 * O Taboola trabalha com uma fila global `window._tfa` na qual empurramos
 * eventos no formato `{ notify: 'event', name, id, ...params }`. Cada evento
 * precisa do `id` (Account ID) do Taboola; como suportamos varios pixels, o
 * componente TaboolaPixel publica a lista de accounts habilitados em
 * `window.__tfaAccounts` e aqui disparamos o evento uma vez por account.
 *
 * Tudo e silencioso: se o Taboola nao estiver configurado, nada quebra.
 */

declare global {
  interface Window {
    _tfa?: Array<Record<string, unknown>>
    /** Account IDs do Taboola habilitados (definido pelo TaboolaPixel). */
    __tfaAccounts?: string[]
    /** Sinaliza que os accounts ja foram carregados da API publica. */
    __tfaReady?: boolean
    /** Fila de eventos disparados antes dos accounts carregarem. */
    __tfaQueue?: Array<() => void>
  }
}

/** Empurra um evento do Taboola para cada Account ID habilitado. */
export function tfaTrack(name: string, params: Record<string, unknown> = {}): void {
  try {
    if (typeof window === 'undefined') return
    const accounts = Array.isArray(window.__tfaAccounts) ? window.__tfaAccounts : []
    if (accounts.length === 0) return
    window._tfa = window._tfa || []

    // Anexa o unified_id (SHA-256 do e-mail) quando disponivel: e a
    // correspondencia first-party que substitui o cookie de terceiros e
    // resolve o aviso de "Cookie ID" do Taboola.
    const unifiedId = getTaboolaUnifiedId()
    const withIdentity = unifiedId ? { unified_id: unifiedId, ...params } : params

    for (const id of accounts) {
      window._tfa.push({ notify: 'event', name, id: Number(id), ...withIdentity })
    }
  } catch {
    // nunca quebrar o fluxo por causa do pixel
  }
}

/**
 * Dispara um evento do Taboola assim que os Account IDs estiverem disponiveis.
 *
 * Eventos disparados muito cedo (antes de a lista de accounts chegar da API)
 * seriam perdidos pelo tfaTrack normal. Aqui, se ainda nao estiver pronto, o
 * evento e enfileirado e disparado quando o TaboolaPixel sinaliza
 * window.__tfaReady. Se nenhum pixel estiver configurado, nada e enviado.
 */
export function tfaTrackWhenReady(name: string, params: Record<string, unknown> = {}): void {
  if (typeof window === 'undefined') return

  // Accounts ja carregados: dispara imediatamente.
  if (window.__tfaReady) {
    tfaTrack(name, params)
    return
  }

  // Ainda nao pronto: enfileira para o TaboolaPixel disparar apos carregar.
  const fire = () => tfaTrack(name, params)
  if (!Array.isArray(window.__tfaQueue)) {
    window.__tfaQueue = []
  }
  window.__tfaQueue.push(fire)

  // Rede de seguranca: caso o sinal __tfaReady nao chegue, tenta por ~6s.
  let attempts = 0
  const retry = () => {
    if (window.__tfaReady) {
      // ja foi disparado pela fila; remove daqui para nao duplicar
      if (Array.isArray(window.__tfaQueue)) {
        window.__tfaQueue = window.__tfaQueue.filter((fn) => fn !== fire)
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
