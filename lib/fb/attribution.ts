'use client'

/**
 * Captura e persistencia de atribuicao de marketing (UTMs + fbclid).
 *
 * O Facebook injeta os parametros na URL de destino com o padrao configurado
 * no Gerenciador de Anuncios (formato exigido pela Utmify):
 *   utm_source=FB
 *   utm_campaign={{campaign.name}}|{{campaign.id}}
 *   utm_medium={{adset.name}}|{{adset.id}}
 *   utm_content={{ad.name}}|{{ad.id}}
 *   utm_term={{placement}}
 *   fbclid=...
 *
 * Como o usuario costuma navegar entre varias telas antes de pagar, gravamos a
 * primeira atribuicao capturada (first-touch) para nao perder a origem ao
 * chegar no checkout. Persistimos em DOIS lugares:
 *   1) cookie (principal) — sobrevive a navegacao e funciona melhor em
 *      navegadores in-app (Instagram/TikTok/Facebook) e no iOS, onde o
 *      localStorage costuma ser limpo ou bloqueado.
 *   2) localStorage (secundario) — redundancia.
 *
 * Assim, mesmo que a usuaria abra o /convite sem os parametros na URL (porque
 * navegou por outra pagina antes), as UTMs originais continuam disponiveis no
 * momento de gerar o PIX e sao enviadas ao backend -> Utmify.
 */

const STORAGE_KEY = 'luna_attribution'
const COOKIE_KEY = 'luna_attr'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 dias

export interface Attribution {
  utm_source?: string | null
  utm_campaign?: string | null
  utm_medium?: string | null
  utm_content?: string | null
  utm_term?: string | null
  fbclid?: string | null
  /** Click ID do TikTok (?ttclid=...) injetado no link do anuncio. */
  ttclid?: string | null
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

/**
 * Um registro so tem valor de campanha se tiver source, campaign ou um click
 * id de plataforma (fbclid do Facebook ou ttclid do TikTok).
 */
function hasCampaignSignal(a: Attribution | null | undefined): boolean {
  return Boolean(a && (a.utm_source || a.utm_campaign || a.fbclid || a.ttclid))
}

function isEmpty(a: Attribution): boolean {
  return !hasCampaignSignal(a)
}

// ---------------------------------------------------------------------------
// Cookie helpers (persistencia principal — resiliente a in-app browsers/iOS)
// ---------------------------------------------------------------------------

function writeCookie(name: string, value: string): void {
  if (typeof document === 'undefined') return
  try {
    const secure = window.location.protocol === 'https:' ? '; Secure' : ''
    document.cookie =
      `${name}=${encodeURIComponent(value)}; Max-Age=${COOKIE_MAX_AGE}; Path=/; SameSite=Lax${secure}`
  } catch {
    // ignore
  }
}

function readCookieRaw(name: string): string | null {
  if (typeof document === 'undefined') return null
  try {
    const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'))
    return match ? decodeURIComponent(match[1]) : null
  } catch {
    return null
  }
}

function parseAttr(raw: string | null): Attribution | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Attribution
    if (parsed && typeof parsed === 'object') return parsed
  } catch {
    // ignore
  }
  return null
}

/**
 * Le a atribuicao da URL atual. Retorna apenas os campos presentes.
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
  const ttclid = params.get('ttclid')
  if (ttclid) attribution.ttclid = ttclid
  return attribution
}

/**
 * Persiste a atribuicao em cookie + localStorage.
 */
function persist(attr: Attribution): void {
  const raw = JSON.stringify(attr)
  writeCookie(COOKIE_KEY, raw)
  try {
    window.localStorage.setItem(STORAGE_KEY, raw)
  } catch {
    // localStorage pode estar indisponivel (modo privado etc.) — cookie cobre.
  }
}

/**
 * Captura a atribuicao da URL (se houver) e grava como first-touch.
 * Idempotente: nao sobrescreve uma atribuicao de campanha ja existente,
 * preservando a origem original do lead. Se ja existe um registro salvo mas
 * SEM campanha (ex.: so landing/referrer) e a URL atual traz UTMs, atualiza.
 */
export function captureAttribution(): void {
  if (typeof window === 'undefined') return
  try {
    const fromUrl = readAttributionFromUrl()
    // Sem nenhum sinal de campanha na URL: nao sobrescreve first-touch.
    if (isEmpty(fromUrl)) return

    const existing = getStoredAttribution()
    // First-touch: se ja ha origem de campanha salva, mantem a original.
    if (hasCampaignSignal(existing)) return

    persist(fromUrl)
  } catch {
    // silencioso
  }
}

/**
 * Recupera a atribuicao salva (first-touch), tentando cookie e depois
 * localStorage. Prioriza o registro que tiver sinal de campanha.
 */
export function getStoredAttribution(): Attribution | null {
  if (typeof window === 'undefined') return null
  const fromCookie = parseAttr(readCookieRaw(COOKIE_KEY))
  let fromStorage: Attribution | null = null
  try {
    fromStorage = parseAttr(window.localStorage.getItem(STORAGE_KEY))
  } catch {
    // ignore
  }

  // Prefere o que tiver campanha; se ambos tiverem (ou nenhum), usa o cookie.
  if (hasCampaignSignal(fromCookie)) return fromCookie
  if (hasCampaignSignal(fromStorage)) return fromStorage
  return fromCookie || fromStorage
}

/**
 * Atribuicao efetiva para enviar ao backend no momento da compra.
 *
 * Combina first-touch salvo com a URL atual, garantindo que cada campo de UTM
 * seja preenchido pela PRIMEIRA fonte que o tiver (first-touch salvo tem
 * prioridade; a URL atual complementa lacunas). Isso evita perder a origem
 * quando a usuaria navegou varias telas e a URL ja nao tem mais os parametros.
 */
export function getAttributionForCheckout(): Attribution {
  const stored = getStoredAttribution() || {}
  const fromUrl = readAttributionFromUrl()

  const pick = (key: keyof Attribution): string | null => {
    const s = stored[key]
    if (typeof s === 'string' && s.trim()) return s
    const u = fromUrl[key]
    if (typeof u === 'string' && u.trim()) return u
    return null
  }

  const merged: Attribution = {
    utm_source: pick('utm_source'),
    utm_campaign: pick('utm_campaign'),
    utm_medium: pick('utm_medium'),
    utm_content: pick('utm_content'),
    utm_term: pick('utm_term'),
    fbclid: pick('fbclid'),
    ttclid: pick('ttclid'),
    // landing_url/referrer do first-touch sao mais relevantes p/ relatorio.
    landing_url: (stored.landing_url as string) || fromUrl.landing_url || null,
    referrer: (stored.referrer as string) || fromUrl.referrer || null,
  }

  // Garante persistencia caso a captura inicial tenha falhado mas agora
  // tenhamos sinal de campanha (ex.: primeira interacao veio direto no modal).
  if (hasCampaignSignal(merged) && !hasCampaignSignal(stored)) {
    try {
      persist(merged)
    } catch {
      // ignore
    }
  }

  return merged
}
