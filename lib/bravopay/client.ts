const BRAVOPAY_API_URL = 'https://bravopay.club/api/v1'

/** Valor minimo aceito pela BravoPay: R$ 5,00 (500 centavos). */
const BRAVOPAY_MIN_CENTS = 500

export interface BravopayClient {
  name: string
  email: string
  phone: string
  /** CPF/CNPJ (so digitos). */
  document: string
}

export interface BravopayCashinInput {
  /** Identificador unico da transacao (gerado pela nossa aplicacao). */
  identifier: string
  /** Valor em reais (decimal). */
  amount: number
  /** Titulo do item exibido na cobranca. */
  itemTitle: string
  client: BravopayClient
  /**
   * A BravoPay NAO aceita URL de callback por transacao — o webhook e unico e
   * configurado no painel (Dashboard -> Integracoes). Recebemos o parametro
   * apenas para manter o contrato CashinGateway; ele nao e enviado na request.
   */
  callbackUrl?: string
}

export interface BravopayCashinResult {
  ok: boolean
  status: number
  /** ID da transacao na BravoPay (tx_...). */
  transactionId: string | null
  /** Codigo PIX copia e cola (EMV). */
  pixCode: string | null
  /** Mensagem de erro legivel, se houver. */
  errorMessage: string | null
  raw: any
}

/**
 * Extrai a mensagem de erro do formato de erro da BravoPay:
 * { error: { code, message, details: { campo: ["msg"] } } }
 * Quando ha `details`, concatena as mensagens de campo (mais acionavel que a
 * mensagem generica "One or more fields are invalid").
 */
function extractErrorMessage(data: any, httpStatus: number): string {
  const err = data?.error
  const details = err?.details

  if (details && typeof details === 'object') {
    const parts: string[] = []
    for (const [field, msgs] of Object.entries(details)) {
      const text = Array.isArray(msgs) ? msgs.join(', ') : String(msgs)
      parts.push(`${field}: ${text}`)
    }
    if (parts.length > 0) return parts.join(' | ')
  }

  return (
    err?.message ||
    (typeof err === 'string' ? err : null) ||
    data?.message ||
    `Falha ao gerar PIX na BravoPay (status ${httpStatus})`
  )
}

/**
 * Cria uma cobranca PIX (cash-in) na BravoPay.
 *
 * POST /api/v1/transactions
 * headers: Authorization: Bearer bp_live_..., Idempotency-Key: <identifier>
 * body: { amount_cents, method: 'pix', customer, description,
 *         external_reference, expires_in }
 * resposta 200: { id: 'tx_...', status: 'PENDING',
 *                 pix: { copy_paste, expires_at }, ... }
 *
 * Detalhes relevantes da API:
 * - Valores em CENTAVOS, minimo 500 (R$ 5,00).
 * - `Idempotency-Key` (TTL 24h) evita cobranca duplicada se a request for
 *   reenviada; usamos o nosso identifier, que e unico por cobranca.
 * - `external_reference` volta em todos os webhooks e e o que usamos para
 *   conciliar, junto do `id` (salvo como transaction_id).
 * - A resposta traz apenas `pix.copy_paste` (sem imagem de QR code). O nosso
 *   checkout gera o QR no cliente a partir do codigo, igual aos outros gateways.
 */
export async function createBravopayPixCharge(
  input: BravopayCashinInput
): Promise<BravopayCashinResult> {
  const apiKey = process.env.BRAVOPAY_API_KEY
  if (!apiKey) {
    return {
      ok: false,
      status: 500,
      transactionId: null,
      pixCode: null,
      errorMessage: 'BRAVOPAY_API_KEY não configurado',
      raw: null,
    }
  }

  const amountCents = Math.round(input.amount * 100)
  if (amountCents < BRAVOPAY_MIN_CENTS) {
    return {
      ok: false,
      status: 400,
      transactionId: null,
      pixCode: null,
      errorMessage: `Valor abaixo do mínimo da BravoPay (R$ ${(BRAVOPAY_MIN_CENTS / 100)
        .toFixed(2)
        .replace('.', ',')})`,
      raw: null,
    }
  }

  const cleanDoc = (input.client.document || '').replace(/\D/g, '')
  const cleanPhone = (input.client.phone || '').replace(/\D/g, '')

  const customer: Record<string, unknown> = { email: input.client.email }
  if (input.client.name) customer.name = input.client.name
  if (cleanDoc) customer.cpf = cleanDoc
  if (cleanPhone) customer.phone = cleanPhone

  const body: Record<string, unknown> = {
    amount_cents: amountCents,
    method: 'pix',
    customer,
    // Maximo de 300 chars conforme a doc.
    description: (input.itemTitle || 'Luna Privé').slice(0, 300),
    // Maximo de 120 chars; volta em todos os webhooks.
    external_reference: (input.identifier || '').slice(0, 120),
    expires_in: Number(process.env.BRAVOPAY_PIX_EXPIRES_IN) || 3600,
  }

  // Opcional: se a conta usa filtro por produto na UTMify, um product_id real
  // evita que a venda caia no "ghost product" e seja excluida da atribuicao.
  if (process.env.BRAVOPAY_PRODUCT_ID) {
    body.product_id = process.env.BRAVOPAY_PRODUCT_ID
  }

  let res: Response
  try {
    res = await fetch(`${BRAVOPAY_API_URL}/transactions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        // TTL de 24h no lado da BravoPay: uma retentativa com a mesma chave
        // devolve a cobranca original em vez de criar outra.
        'Idempotency-Key': input.identifier,
      },
      body: JSON.stringify(body),
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro de conexão com a BravoPay'
    return {
      ok: false,
      status: 502,
      transactionId: null,
      pixCode: null,
      errorMessage: msg,
      raw: null,
    }
  }

  let data: any = {}
  try {
    data = await res.json()
  } catch {
    data = {}
  }

  const pix = data?.pix || {}
  const pixCode = pix.copy_paste || pix.qr_code || pix.code || pix.emv || null
  const transactionId =
    data?.id !== undefined && data?.id !== null ? String(data.id) : null

  const success = res.ok && Boolean(pixCode)

  return {
    ok: success,
    status: res.status,
    transactionId,
    pixCode,
    errorMessage: success ? null : extractErrorMessage(data, res.status),
    raw: data,
  }
}
