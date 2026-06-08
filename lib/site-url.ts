/**
 * Resolve a URL base publica do site de forma robusta.
 *
 * Aceita NEXT_PUBLIC_SITE_URL em qualquer formato comum e normaliza:
 * - "lunaprive.live"          -> "https://lunaprive.live"
 * - "http://lunaprive.live"   -> "https://lunaprive.live"
 * - "https://lunaprive.live/" -> "https://lunaprive.live"
 *
 * Isso evita callbackUrl/links quebrados quando a env var e cadastrada
 * sem o protocolo (erro comum em paineis de hospedagem).
 */
export function getSiteUrl(): string {
  const raw = (process.env.NEXT_PUBLIC_SITE_URL || '').trim()

  if (!raw) {
    return 'https://lunaprive.live'
  }

  let url = raw

  // Garante protocolo https.
  if (/^https?:\/\//i.test(url)) {
    url = url.replace(/^http:\/\//i, 'https://')
  } else {
    url = `https://${url}`
  }

  // Remove barras finais.
  return url.replace(/\/+$/, '')
}

/** Monta uma URL absoluta a partir de um path relativo (ex.: "/api/pix/webhook"). */
export function siteUrl(path = ''): string {
  const base = getSiteUrl()
  if (!path) return base
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`
}
