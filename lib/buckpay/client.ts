const BUCKPAY_API_URL = 'https://api.realtechdev.com.br'

export interface BuckpayClient {
  name: string
  email: string
  phone: string
  /** CPF/CNPJ (so digitos). */
  document: string
}

export interface BuckpayCashinInput {
  /** Identificador unico da transacao (gerado pela nossa aplicacao). */
  identifier: string
  /** Valor em reais (decimal). */
  amount: number
  /** Titulo do produto exibido na cobranca. */
  itemTitle: string
  client: BuckpayClient
  callbackUrl?: string
}

export interface BuckpayCashinResult {
  ok: boolean
  status: number
  /** ID da transacao na BuckPay. */
  transactionId: string | null
  /** Codigo PIX copia e cola (EMV). */
  pixCode: string | null
  /** Mensagem de erro legivel, se houver. */
  errorMessage: string | null
  raw: any
}

/**
 * Normaliza o external_id para o formato exigido pela BuckPay:
 * apenas letras, numeros, hifen e underscore (1–255 chars).
 */
function sanitizeExternalId(id: string): string {
  const clean = (id || '').replace(/[^A-Za-z0-9_-]/g, '')
  return clean.slice(0, 255) || `luna${Date.now()}`
}

/**
 * Cria uma cobranca PIX (cash-in) na BuckPay.
 *
 * POST /v1/transactions
 * headers: Authorization: Bearer <token>, User-Agent: <fornecido pela BuckPay>
 * body: { external_id, payment_method: 'pix', amount (centavos), buyer, product, postbackUrl }
 * resposta 201: { data: { id, status, pix: { code, qrcode_base64 }, total_amount, ... } }
 *
 * A BuckPay trabalha com valores em CENTAVOS (min 600 = R$ 6,00; max
 * 300000 = R$ 3.000,00). O nosso identifier e conciliado no webhook via
 * `data.id` (salvo como transaction_id) e/ou `data.external_id`.
 */
export async function createBuckpayPixCharge(
  input: BuckpayCashinInput
): Promise<BuckpayCashinResult> {
  const token = process.env.BUCKPAY_API_TOKEN
  if (!token) {
    return {
      ok: false,
      status: 500,
      transactionId: null,
      pixCode: null,
      errorMessage: 'BUCKPAY_API_TOKEN não configurado',
      raw: null,
    }
  }

  // A BuckPay exige um User-Agent especifico fornecido pelo gerente de contas.
  // Permite sobrescrever via env; cai num valor padrao quando ausente.
  const userAgent = process.env.BUCKPAY_USER_AGENT || 'LunaPrive/1.0'

  const cleanDoc = (input.client.document || '').replace(/\D/g, '')
  const cleanPhone = (input.client.phone || '').replace(/\D/g, '')

  const buyer: Record<string, unknown> = {
    name: input.client.name,
    email: input.client.email,
  }
  if (cleanDoc) buyer.document = cleanDoc
  if (cleanPhone) buyer.phone = cleanPhone

  const body: Record<string, unknown> = {
    external_id: sanitizeExternalId(input.identifier),
    payment_method: 'pix',
    amount: Math.round(input.amount * 100), // reais -> centavos
    buyer,
    product: { name: input.itemTitle },
  }
  if (input.callbackUrl) body.postbackUrl = input.callbackUrl

  let res: Response
  try {
    res = await fetch(`${BUCKPAY_API_URL}/v1/transactions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'User-Agent': userAgent,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro de conexão com a BuckPay'
    return { ok: false, status: 502, transactionId: null, pixCode: null, errorMessage: msg, raw: null }
  }

  let data: any = {}
  try {
    data = await res.json()
  } catch {
    data = {}
  }

  const payload = data?.data || data
  const pix = payload?.pix || {}
  const pixCode = pix.code || pix.copy_paste || pix.emv || pix.qrcode || payload?.qrcode || null
  const transactionId =
    payload?.id !== undefined && payload?.id !== null ? String(payload.id) : null

  const success = res.ok && Boolean(pixCode)
  const errorMessage = success
    ? null
    : data?.message ||
      data?.error?.message ||
      data?.error ||
      payload?.message ||
      `Falha ao gerar PIX na BuckPay (status ${res.status})`

  return {
    ok: success,
    status: res.status,
    transactionId,
    pixCode,
    errorMessage,
    raw: payload,
  }
}
