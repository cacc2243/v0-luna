'use client'

/**
 * Captura e persistencia de atribuicao de marketing (UTMs + fbclid).
 *
 * O Facebook injeta os parametros na URL de destino com o padrao configurado
 * no Gerenciador de Anuncios:
 *   utm_source=FB
 *   utm_campaign={{campaign.name}}|{{campaign.id}}
 *   utm_medium={{adset.name}}|{{adset.id}}
 *   utm_content={{ad.name}}|{{ad.id}}
 *   utm_term={{placement}}
 *   fbclid=...
 *
 * Como o usuario costuma navegar entre paginas antes de pagar, gravamos a
 * primeira atribuicao capturada (first-touch) no localStorage para nao perder
 * a origem ao chegar no checkout. O Facebook prioriza o _fbc (derivado do
 * fbclid) para casar a conversao, e as UTMs ficam registradas para relatorios.
 */

const STORAGE_KEY = 'luna_attribution'

export interface Attribution {
  utm_source?: string | null
  utm_campaign?: string | null
  utm_medium?: string | null
  utm_content?: string | null
  utm_term?: string | null
  fbclid?: string | null
  referrer?: string | null
  landing_url?: string | null
}

const UTM_KEYS = [
  'utm_source',
  'utm_campaign',
  'utm_medium',
  'utm_content',
  'utm_term',
] as const

function isEmpty(a: Attribution): boolean {
  return !a.utm_source && !a.utm_campaign && !a.fbclid
}

/**
 * Le a atribuicao da URL atual. Retorna undefined nos campos ausentes.
 */
export function readAttributionFromUrl(): Attribution {
  if (typeof window === 'undefined') return {}
  const params = new URLSearchParams(window.location.search)
  const attribution: Attribution = {
    landing_url: window.location.href,
    referrer: document.referrer || null,
  }
  for (const key of UTM_KEYS) {
    const value = params.get(key)
    if (value) attribution[key] = value
  }
  const fbclid = params.get('fbclid')
  if (fbclid) attribution.fbclid = fbclid
  return attribution
}

/**
 * Captura a atribuicao da URL (se houver) e grava como first-touch no
 * localStorage. Idempotente: nao sobrescreve uma atribuicao ja existente,
 * preservando a origem original do lead.
 */
export function captureAttribution(): void {
  if (typeof window === 'undefined') return
  try {
    const fromUrl = readAttributionFromUrl()
    // Sem nenhum sinal de campanha na URL: nao sobrescreve nada.
    if (isEmpty(fromUrl)) return

    const existing = getStoredAttribution()
    // First-touch: so grava se ainda nao houver origem de campanha salva.
    if (existing && !isEmpty(existing)) return

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fromUrl))
  } catch {
    // localStorage pode estar indisponivel (modo privado etc.) — silencioso.
  }
}

/**
 * Recupera a atribuicao salva (first-touch). Faz fallback para a URL atual
 * caso nao haja nada salvo, garantindo que o checkout sempre tenha algo a
 * enviar quando a campanha estiver presente.
 */
export function getStoredAttribution(): Attribution | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Attribution
      if (parsed && typeof parsed === 'object') return parsed
    }
  } catch {
    // ignore
  }
  return null
}

/**
 * Atribuicao efetiva para enviar ao backend no momento da compra:
 * prioriza o first-touch salvo; complementa com a URL atual.
 */
export function getAttributionForCheckout(): Attribution {
  const stored = getStoredAttribution()
  const fromUrl = readAttributionFromUrl()
  const merged: Attribution = { ...fromUrl, ...(stored || {}) }
  // landing_url/referrer do first-touch sao mais relevantes; manter se houver.
  if (stored?.landing_url) merged.landing_url = stored.landing_url
  if (stored?.referrer) merged.referrer = stored.referrer
  return merged
}
