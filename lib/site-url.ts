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
    return 'https://lunapriveapp.site'
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
 * Aponta DIRETO para a rota interna do site (/api/pix/webhook), onde vive toda
 * a logica de confirmacao de pagamento. Esse endpoint e robusto: aceita os
 * formatos de todos os gateways, casa a transacao por qualquer identificador e
 * responde 2XX para pings/testes.
 *
 * Historico: antes derivavamos a URL da Edge Function do Supabase
 * (".../functions/v1/pix-webhook") como um proxy para "esconder" o dominio.
 * Essa funcao publicada estava quebrada (respondia 400 "Invalid payload"),
 * fazendo os webhooks de pagamento nunca chegarem ao site e vendas pagas
 * ficarem presas em "pending". Por isso deixamos de depender dela.
 *
 * Pode ser sobrescrita por PIX_WEBHOOK_URL caso necessario (ex.: apontar de
 * volta para um proxy caso ele seja corrigido no futuro).
 */
export function getWebhookUrl(): string {
  const override = (process.env.PIX_WEBHOOK_URL || '').trim()
  if (override) {
    return override.replace(/\/+$/, '')
  }

  // Rota interna do site — comprovadamente funcional e com toda a logica.
  return `${getSiteUrl()}/api/pix/webhook`
}
