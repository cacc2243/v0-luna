import crypto from 'node:crypto'

/** Janela anti-replay padrao: 5 minutos, como sugerido pela doc da BravoPay. */
const DEFAULT_TOLERANCE_SEC = 300

export type BravopayVerifyResult =
  | { verified: true }
  | { verified: false; reason: string }

/**
 * Le o header de assinatura da BravoPay. Ela envia o mesmo valor em dois
 * headers: `BravoPay-Signature` (canonico) e `X-Bravopay-Signature` (alias).
 */
export function getBravopaySignatureHeader(headers: Headers): string | null {
  return (
    headers.get('bravopay-signature') ||
    headers.get('x-bravopay-signature') ||
    null
  )
}

/**
 * Valida a assinatura HMAC-SHA256 de um webhook da BravoPay.
 *
 * Header: `BravoPay-Signature: t=<unix_ts>,v1=<hmac_hex>`
 * Payload assinado: `${t}.${rawBody}` — o corpo CRU, exatamente como recebido.
 * Por isso o handler precisa ler `request.text()` e nao `request.json()`:
 * re-serializar o JSON muda a string e invalida a assinatura.
 *
 * Retorna o motivo da falha para facilitar diagnostico no log (sem vazar o
 * secret nem a assinatura recebida).
 */
export function verifyBravopayWebhook(
  rawBody: string,
  headerValue: string,
  secret: string,
  toleranceSec: number = DEFAULT_TOLERANCE_SEC
): BravopayVerifyResult {
  // Formato "t=...,v1=..." — tolera espacos e ignora pares desconhecidos.
  const parts: Record<string, string> = {}
  for (const kv of headerValue.split(',')) {
    const idx = kv.indexOf('=')
    if (idx === -1) continue
    parts[kv.slice(0, idx).trim()] = kv.slice(idx + 1).trim()
  }

  const t = Number(parts.t)
  const v1 = parts.v1

  if (!t || !Number.isFinite(t)) {
    return { verified: false, reason: 'timestamp ausente ou inválido' }
  }
  if (!v1) {
    return { verified: false, reason: 'assinatura v1 ausente' }
  }

  // Anti-replay: rejeita eventos fora da janela de tolerancia.
  const driftSec = Math.abs(Date.now() / 1000 - t)
  if (driftSec > toleranceSec) {
    return {
      verified: false,
      reason: `timestamp fora da janela (${Math.round(driftSec)}s de diferença)`,
    }
  }

  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${t}.${rawBody}`)
    .digest('hex')

  const expectedBuf = Buffer.from(expected, 'utf8')
  const receivedBuf = Buffer.from(v1, 'utf8')

  // timingSafeEqual lanca se os buffers tiverem tamanhos diferentes, entao
  // comparamos o tamanho antes (um tamanho diferente ja e assinatura invalida).
  if (expectedBuf.length !== receivedBuf.length) {
    return { verified: false, reason: 'assinatura com formato inesperado' }
  }

  if (!crypto.timingSafeEqual(expectedBuf, receivedBuf)) {
    return { verified: false, reason: 'assinatura não corresponde' }
  }

  return { verified: true }
}
