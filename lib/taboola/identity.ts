'use client'

/**
 * Identidade first-party do Taboola (unified_id).
 *
 * O aviso de "Cookie ID" do Taboola aparece porque o match por cookie de
 * TERCEIROS e bloqueado por Safari/iOS, modo anonimo e ad blockers. A solucao
 * recomendada pelo proprio Taboola — sem precisar de banner de consentimento —
 * e enviar o `unified_id`: o SHA-256 do e-mail do usuario (em minusculas, sem
 * espacos) junto de cada evento. Isso cria uma correspondencia deterministica
 * e first-party, independente de cookies de terceiros.
 *
 * Aqui calculamos esse hash no browser (Web Crypto), guardamos em memoria e no
 * sessionStorage (para sobreviver a navegacoes) e expomos leitura sincrona para
 * os helpers de tracking anexarem o unified_id automaticamente.
 */

const STORAGE_KEY = 'luna_tb_uid'

declare global {
  interface Window {
    /** unified_id (SHA-256 do e-mail) para correspondencia first-party. */
    __tfaUnifiedId?: string
  }
}

/** SHA-256 em hexadecimal usando a Web Crypto API (contexto seguro). */
async function sha256Hex(input: string): Promise<string | null> {
  try {
    if (typeof window === 'undefined' || !window.crypto?.subtle) return null
    const data = new TextEncoder().encode(input)
    const buf = await window.crypto.subtle.digest('SHA-256', data)
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  } catch {
    return null
  }
}

/**
 * Calcula e memoriza o unified_id a partir do e-mail. Idempotente: se o mesmo
 * e-mail ja foi processado, nao refaz o trabalho. Silencioso em qualquer erro.
 */
export async function setTaboolaEmail(email?: string | null): Promise<void> {
  try {
    if (typeof window === 'undefined') return
    const normalized = (email || '').trim().toLowerCase()
    if (!normalized || !normalized.includes('@')) return

    const hash = await sha256Hex(normalized)
    if (!hash) return

    window.__tfaUnifiedId = hash
    try {
      sessionStorage.setItem(STORAGE_KEY, hash)
    } catch {
      // storage pode estar indisponivel (modo restrito) — segue em memoria
    }
  } catch {
    // nunca quebrar o fluxo por causa do pixel
  }
}

/** Le o unified_id atual (memoria -> sessionStorage). Retorna null se ausente. */
export function getTaboolaUnifiedId(): string | null {
  try {
    if (typeof window === 'undefined') return null
    if (window.__tfaUnifiedId) return window.__tfaUnifiedId
    const stored = sessionStorage.getItem(STORAGE_KEY)
    if (stored) {
      window.__tfaUnifiedId = stored
      return stored
    }
  } catch {
    // ignore
  }
  return null
}
