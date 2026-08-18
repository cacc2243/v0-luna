const BSPAY_API_URL = 'https://api.bspay.co'

// Cache simples do access token em memoria (vive enquanto a lambda estiver quente).
let cachedToken: { token: string; expiresAt: number } | null = null

/**
 * Gera (ou reaproveita) um access token OAuth2 client_credentials da BSPay.
 * Autenticacao Basic (client_id:client_secret em base64) -> Bearer token.
 * O token e valido por 1 hora. As credenciais ficam apenas no servidor.
 */
export async function getBspayAccessToken(): Promise<string> {
  const clientId = process.env.BSPAY_CLIENT_ID
  const clientSecret = process.env.BSPAY_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('BSPAY_CLIENT_ID ou BSPAY_CLIENT_SECRET não configurados')
  }

  // Reaproveita token valido (com 60s de folga antes de expirar).
  const now = Date.now()
  if (cachedToken && cachedToken.expiresAt - 60_000 > now) {
    return cachedToken.token
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const res = await fetch(`${BSPAY_API_URL}/v2/oauth/token`, {
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
    throw new Error(`Falha ao autenticar na BSPay: ${msg}`)
  }

  const expiresIn = typeof data.expires_in === 'number' ? data.expires_in : 3600
  cachedToken = {
    token: data.access_token,
    expiresAt: now + expiresIn * 1000,
  }

  return data.access_token
}

export interface BspayCashinInput {
  /** Identificador unico gerado pela nossa aplicacao. */
  externalId: string
  /** Valor em reais (decimal). */
  amount: number
  /** URL de notificacao (webhook) do pagamento. */
  postbackUrl?: string
  client?: {
    name?: string
    email?: string
    document?: string
  }
}

export interface BspayCashinResult {
  ok: boolean
  status: number
  /** ID da transacao no gateway. */
  transactionId: string | null
  /** Codigo PIX copia e cola (EMV). */
  pixCode: string | null
  errorMessage: string | null
  raw: any
}

/**
 * Gera uma cobranca PIX (cash-in) na BSPay.
 *
 * POST /v2/transactions/cashin (Authorization: Bearer token). Nao exige HMAC.
 * O QR Code (copia e cola) volta em `data.payment_info.qrcode`. O webhook de
 * confirmacao chega no "Envelope V2" (event `cashin.confirmed`), ja tratado
 * genericamente pela rota de webhook.
 */
export async function createBspayPixCharge(
  input: BspayCashinInput
): Promise<BspayCashinResult> {
  const token = await getBspayAccessToken()

  const bodyObj: Record<string, unknown> = {
    amount: input.amount,
    currency: 'BRL',
    external_id: input.externalId,
  }
  if (input.postbackUrl) bodyObj.postback_url = input.postbackUrl
  if (input.client?.name || input.client?.email || input.client?.document) {
    bodyObj.payer = {
      ...(input.client?.name ? { name: input.client.name } : {}),
      ...(input.client?.email ? { email: input.client.email } : {}),
      ...(input.client?.document ? { document: input.client.document } : {}),
    }
  }

  const res = await fetch(`${BSPAY_API_URL}/v2/transactions/cashin`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(bodyObj),
  })

  let data: any = {}
  try {
    data = await res.json()
  } catch {
    data = {}
  }

  // A resposta pode vir em `data` ou na raiz, conforme o ambiente.
  const payload = data?.data || data
  const info = payload?.payment_info || payload?.paymentInfo || {}
  const pixCode =
    info.qrcode ||
    info.qrCode ||
    info.copy_paste ||
    info.emv ||
    payload?.qrcode ||
    null
  const transactionId =
    payload?.transaction_id || payload?.transactionId || payload?.id || null

  const success = res.ok && Boolean(pixCode)
  const errorMessage = success
    ? null
    : data?.error?.message ||
      data?.message ||
      `Falha ao gerar PIX na BSPay (status ${res.status})`

  return {
    ok: success,
    status: res.status,
    transactionId: transactionId ? String(transactionId) : null,
    pixCode,
    errorMessage,
    raw: payload,
  }
}
