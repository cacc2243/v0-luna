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

/**
 * URL de webhook que e ENVIADA aos gateways de pagamento (SigiloPay, Bynet).
 *
 * Importante: usamos a Edge Function do Supabase como ponto de recebimento,
 * NAO o dominio do site. Assim o dominio real (lunaprive.live) nao fica
 * exposto no painel dos gateways. A Edge Function apenas repassa (proxy) o
 * evento para a rota interna do site, onde toda a logica e executada.
 *
 * Deriva automaticamente de NEXT_PUBLIC_SUPABASE_URL:
 *   "https://kbiaaf....supabase.co" -> "https://kbiaaf....supabase.co/functions/v1/pix-webhook"
 *
 * Pode ser sobrescrita por PIX_WEBHOOK_URL caso necessario.
 */
export function getWebhookUrl(): string {
  const override = (process.env.PIX_WEBHOOK_URL || '').trim()
  if (override) {
    return override.replace(/\/+$/, '')
  }

  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
  if (supabaseUrl) {
    const base = supabaseUrl.replace(/\/+$/, '')
    return `${base}/functions/v1/pix-webhook`
  }

  // Fallback: se nao houver Supabase configurado, cai na rota interna do site.
  return `${getSiteUrl()}/api/pix/webhook`
}
