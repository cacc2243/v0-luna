'use client'

/**
 * Credenciais salvas no dispositivo para permitir o LOGIN AUTOMATICO na conta
 * (apenas contas com convite pago). Guardamos no localStorage para que, mesmo
 * que a sessao do Supabase expire, a usuaria volte a entrar sem digitar nada.
 *
 * Observacao de seguranca: isto e uma decisao de produto (conveniencia de
 * login) e fica restrito ao dispositivo da propria usuaria. Os dados sao
 * apagados no logout.
 */

const KEY = 'luna_creds'

export type SavedCreds = {
  email: string
  password: string
}

export function saveCreds(creds: SavedCreds) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(KEY, JSON.stringify(creds))
  } catch {
    // ignore storage errors (modo privado, quota, etc.)
  }
}

export function readCreds(): SavedCreds | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<SavedCreds>
    if (parsed?.email && parsed?.password) {
      return { email: parsed.email, password: parsed.password }
    }
    return null
  } catch {
    return null
  }
}

export function clearCreds() {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(KEY)
  } catch {
    // ignore
  }
}
