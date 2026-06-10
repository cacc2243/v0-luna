import crypto from 'node:crypto'

const HORSEPAY_API_URL = 'https://api.horsepay.io'

// Cache simples do access token em memoria (vive enquanto a lambda estiver quente).
// A HorsePay emite tokens que expiram em 4 horas.
let cachedToken: { token: string; expiresAt: number } | null = null

/**
 * Gera (ou reaproveita) um access token da HorsePay.
 *
 * POST /auth/token { client_key, client_secret } -> { access_token }
 * As credenciais ficam exclusivamente no servidor. O token expira em 4h.
 */
export async function getHorsepayAccessToken(): Promise<string> {
  const clientKey = process.env.HORSEPAY_CLIENT_KEY
  const clientSecret = process.env.HORSEPAY_CLIENT_SECRET

  if (!clientKey || !clientSecret) {
    throw new Error('HORSEPAY_CLIENT_KEY ou HORSEPAY_CLIENT_SECRET não configurados')
  }

  // Reaproveita token valido (com 60s de folga antes de expirar).
  const now = Date.now()
  if (cachedToken && cachedToken.expiresAt - 60_000 > now) {
    return cachedToken.token
  }

  const res = await fetch(`${HORSEPAY_API_URL}/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_key: clientKey, client_secret: clientSecret }),
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok || !data?.access_token) {
    const msg = data?.error?.message || data?.message || `status ${res.status}`
    throw new Error(`Falha ao autenticar na HorsePay: ${msg}`)
  }

  // A doc indica expiracao de 4h. Guardamos com folga (4h fixas).
  cachedToken = {
    token: data.access_token,
    expiresAt: now + 4 * 60 * 60 * 1000,
  }

  return data.access_token
}

// ---------------------------------------------------------------------------
// Cash-in (geracao de cobranca PIX)
// ---------------------------------------------------------------------------

export interface HorsepayClient {
  name: string
  email: string
  phone: string
  document: string
}

export interface HorsepayReceiveInput {
  /** Identificador unico da transacao (gerado pela nossa aplicacao). */
  identifier: string
  /** Valor em reais (decimal). */
  amount: number
  client: HorsepayClient
  callbackUrl?: string
}

export interface HorsepayReceiveResult {
  ok: boolean
  status: number
  /** ID da transacao na HorsePay (external_id). */
  transactionId: string | null
  /** Codigo PIX copia e cola (EMV). */
  pixCode: string | null
  /** Mensagem de erro legivel, se houver. */
  errorMessage: string | null
  raw: any
}

/**
 * Cria uma cobranca PIX (cash-in) na HorsePay.
 *
 * POST /transaction/neworder (Bearer token)
 * body: { payer_name, amount, callback_url, client_reference_id, phone }
 * resposta: { copy_past, external_id, payer_name, payment, status }
 */
export async function createHorsepayPixCharge(
  input: HorsepayReceiveInput
): Promise<HorsepayReceiveResult> {
  let token: string
  try {
    token = await getHorsepayAccessToken()
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro ao autenticar na HorsePay'
    return { ok: false, status: 401, transactionId: null, pixCode: null, errorMessage: msg, raw: null }
  }

  const body: Record<string, unknown> = {
    payer_name: input.client.name,
    amount: input.amount,
  }
  // client_reference_id e retornado no callback — usamos nosso identifier para
  // conciliar o webhook com o registro local.
  if (input.identifier) body.client_reference_id = input.identifier
  if (input.callbackUrl) body.callback_url = input.callbackUrl
  if (input.client.phone) body.phone = input.client.phone

  const res = await fetch(`${HORSEPAY_API_URL}/transaction/neworder`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  let data: any = {}
  try {
    data = await res.json()
  } catch {
    data = {}
  }

  // O codigo PIX copia-e-cola vem em `copy_past`.
  const pixCode = data?.copy_past || data?.copy_paste || data?.pix?.code || null
  const externalId =
    data?.external_id !== undefined && data?.external_id !== null
      ? String(data.external_id)
      : null
  const success = res.ok && Boolean(pixCode)

  const errorMessage = success
    ? null
    : data?.error?.message ||
      data?.message ||
      `Falha ao gerar PIX na HorsePay (status ${res.status})`

  return {
    ok: success,
    status: res.status,
    transactionId: externalId,
    pixCode,
    errorMessage,
    raw: data,
  }
}

// ---------------------------------------------------------------------------
// Cash-out (saque PIX)
// ---------------------------------------------------------------------------

export interface HorsepayWithdrawInput {
  externalId: string
  /** Valor em reais (decimal). */
  amount: number
  pixKey: string
  pixType: 'CPF' | 'CNPJ' | 'EMAIL' | 'PHONE' | 'RANDOM'
  description?: string
  callbackUrl?: string
}

export interface HorsepayWithdrawResult {
  ok: boolean
  status: number
  transactionId: string | null
  endToEndId: string | null
  errorMessage: string | null
  raw: any
}

/**
 * Executa um saque (cash-out) PIX na HorsePay.
 *
 * POST /transaction/withdraw (Bearer token)
 * body: { amount, pix_key, pix_type, callback_url, client_reference_id }
 * resposta: { message, external_id, end_to_end_id, amount, status }
 *
 * IMPORTANTE: a HorsePay exige que o IP do servidor esteja na lista de
 * IPs Autorizados (painel HorsePay -> Configuracoes -> IPs Autorizados).
 */
export async function createHorsepayWithdraw(
  input: HorsepayWithdrawInput
): Promise<HorsepayWithdrawResult> {
  let token: string
  try {
    token = await getHorsepayAccessToken()
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro ao autenticar na HorsePay'
    return { ok: false, status: 401, transactionId: null, endToEndId: null, errorMessage: msg, raw: null }
  }

  const body: Record<string, unknown> = {
    amount: input.amount,
    pix_key: input.pixKey,
    pix_type: input.pixType,
  }
  if (input.callbackUrl) body.callback_url = input.callbackUrl
  if (input.externalId) body.client_reference_id = input.externalId

  const res = await fetch(`${HORSEPAY_API_URL}/transaction/withdraw`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  let data: any = {}
  try {
    data = await res.json()
  } catch {
    data = {}
  }

  const externalId =
    data?.external_id !== undefined && data?.external_id !== null
      ? String(data.external_id)
      : null
  const endToEndId = data?.end_to_end_id || data?.endtoendid || data?.end_to_end || null

  // Sucesso: HTTP ok e ausencia de erro explicito. status 0 = criado/pendente.
  const success = res.ok && data?.error === undefined && externalId !== null

  const errorMessage = success
    ? null
    : data?.error?.message ||
      data?.message ||
      `Falha no saque HorsePay (status ${res.status})`

  return {
    ok: success,
    status: res.status,
    transactionId: externalId,
    endToEndId,
    errorMessage,
    raw: data,
  }
}

// ---------------------------------------------------------------------------
// Seguranca — verificacao de assinatura HMAC dos callbacks
// ---------------------------------------------------------------------------

/**
 * Valida a assinatura HMAC de um callback da HorsePay.
 *
 * Header: X-Signature: sha256=<hex>
 * O hash e HMAC-SHA256 do body RAW (bytes exatos recebidos) usando o
 * Webhook Secret HMAC gerado no painel HorsePay.
 *
 * Usa comparacao em tempo constante contra timing attacks.
 */
export function verifyHorsepayWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  webhookSecret: string
): boolean {
  if (!signatureHeader) return false

  // Aceita tanto "sha256=<hex>" quanto apenas "<hex>".
  const received = signatureHeader.startsWith('sha256=')
    ? signatureHeader.slice('sha256='.length)
    : signatureHeader

  const expected = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex')

  const a = Buffer.from(expected)
  const b = Buffer.from(received)
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}
