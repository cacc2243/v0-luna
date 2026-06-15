import crypto from 'node:crypto'

const PIXUP_API_URL = 'https://api.pixupbr.com'

// Cache simples do access token em memoria (vive enquanto a lambda estiver quente).
let cachedToken: { token: string; expiresAt: number } | null = null

/**
 * Gera (ou reaproveita) um access token OAuth2 client_credentials.
 * As credenciais ficam exclusivamente no servidor.
 */
export async function getPixupAccessToken(): Promise<string> {
  const clientId = process.env.PIXUP_CLIENT_ID
  const clientSecret = process.env.PIXUP_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('PIXUP_CLIENT_ID ou PIXUP_CLIENT_SECRET não configurados')
  }

  // Reaproveita token valido (com 60s de folga antes de expirar).
  const now = Date.now()
  if (cachedToken && cachedToken.expiresAt - 60_000 > now) {
    return cachedToken.token
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const res = await fetch(`${PIXUP_API_URL}/v2/oauth/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ grant_type: 'client_credentials' }),
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok || !data?.access_token) {
    const msg = data?.error?.message || data?.message || `status ${res.status}`
    throw new Error(`Falha ao autenticar na PixUp: ${msg}`)
  }

  const expiresIn = typeof data.expires_in === 'number' ? data.expires_in : 3600
  cachedToken = {
    token: data.access_token,
    expiresAt: now + expiresIn * 1000,
  }

  return data.access_token
}

export interface PixupCashoutInput {
  externalId: string
  amount: number
  key: string
  keyType?: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random'
  name?: string
  description?: string
  postbackUrl?: string
}

export interface PixupCashoutResult {
  ok: boolean
  status: number
  data: any
  /** Mensagem de erro legivel da gateway, se houver. */
  errorMessage: string | null
}

/**
 * Executa um cash-out (PIX out) na PixUp.
 *
 * Esta rota exige assinatura HMAC. A string assinada e
 * `{timestamp}.{nonce}.{rawBody}` com HMAC-SHA256 usando o signing_key.
 * O MESMO rawBody assinado e enviado no corpo (nao re-serializar).
 */
export async function createPixupCashout(
  input: PixupCashoutInput
): Promise<PixupCashoutResult> {
  const signingKey = process.env.PIXUP_SIGNING_KEY
  if (!signingKey) {
    throw new Error('PIXUP_SIGNING_KEY não configurado')
  }

  const token = await getPixupAccessToken()

  // Monta o corpo exatamente uma vez (raw string usada na assinatura E no envio).
  const bodyObj: Record<string, unknown> = {
    external_id: input.externalId,
    amount: input.amount,
    currency: 'BRL',
    key: input.key,
  }
  if (input.keyType) bodyObj.key_type = input.keyType
  if (input.name) bodyObj.name = input.name
  if (input.description) bodyObj.description = input.description
  if (input.postbackUrl) bodyObj.postback_url = input.postbackUrl

  const rawBody = JSON.stringify(bodyObj)

  const timestamp = Math.floor(Date.now() / 1000).toString()
  const nonce = crypto.randomUUID()
  const signature = crypto
    .createHmac('sha256', signingKey)
    .update(`${timestamp}.${nonce}.${rawBody}`)
    .digest('hex')

  const res = await fetch(`${PIXUP_API_URL}/v2/transactions/cashout`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-Signature': signature,
      'X-Timestamp': timestamp,
      'X-Nonce': nonce,
    },
    body: rawBody, // raw exato - NAO re-stringify
  })

  let data: any = {}
  try {
    data = await res.json()
  } catch {
    data = {}
  }

  // A PixUp retorna 202 Accepted em sucesso (status: pending).
  const success = res.ok && data?.success !== false
  const errorMessage = success
    ? null
    : data?.error?.message ||
      data?.message ||
      `Falha no cashout (status ${res.status})`

  return { ok: success, status: res.status, data, errorMessage }
}

/**
 * Valida a assinatura HMAC de um webhook da PixUp.
 * X-Webhook-Signature = hex(hmac_sha256(rawBody, webhook_secret)).
 * Usa o body RAW (string exata recebida).
 */
export function verifyPixupWebhookSignature(
  rawBody: string,
  signature: string | null,
  webhookSecret: string
): boolean {
  if (!signature) return false
  const expected = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex')

  const a = Buffer.from(expected)
  const b = Buffer.from(signature)
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}
