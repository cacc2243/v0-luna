const MISTICPAY_API_URL = 'https://api.misticpay.com/api'

/**
 * Monta os headers de autenticacao da MisticPay.
 * A API usa Client ID + Client Secret nos headers `ci` / `cs`.
 * As credenciais ficam exclusivamente no servidor.
 */
function misticpayHeaders(): Record<string, string> | null {
  const ci = process.env.MISTICPAY_CLIENT_ID
  const cs = process.env.MISTICPAY_CLIENT_SECRET
  if (!ci || !cs) return null
  return {
    ci,
    cs,
    'Content-Type': 'application/json',
  }
}

export function isMisticpayConfigured(): boolean {
  return Boolean(process.env.MISTICPAY_CLIENT_ID && process.env.MISTICPAY_CLIENT_SECRET)
}

// ---------------------------------------------------------------------------
// Cash-in (geracao de cobranca PIX)
// ---------------------------------------------------------------------------

export interface MisticpayReceiveInput {
  /** Identificador unico da transacao (gerado pela nossa aplicacao). */
  identifier: string
  /** Valor em reais (decimal). Ex.: 4.55 = R$ 4,55. */
  amount: number
  /** Descricao do pagamento exibida na cobranca. */
  description: string
  client: {
    name: string
    /** CPF do pagador (so digitos). Obrigatorio na MisticPay. */
    document: string
  }
  callbackUrl?: string
}

export interface MisticpayReceiveResult {
  ok: boolean
  status: number
  /** ID da transacao na MisticPay. */
  transactionId: string | null
  /** Codigo PIX copia e cola (EMV). */
  pixCode: string | null
  /** Mensagem de erro legivel, se houver. */
  errorMessage: string | null
  raw: any
}

/**
 * Cria uma cobranca PIX (cash-in) na MisticPay.
 *
 * POST /api/transactions/create (headers ci/cs)
 * body: { amount, payerName, payerDocument, transactionId, description, projectWebhook }
 * resposta: { message, data: { transactionId, copyPaste, qrCodeBase64, qrcodeUrl, transactionState } }
 *
 * A MisticPay trabalha com valores em REAIS (decimal). O `transactionId`
 * retornado e conciliado no webhook de deposito (campo `transactionId`).
 */
export async function createMisticpayPixCharge(
  input: MisticpayReceiveInput
): Promise<MisticpayReceiveResult> {
  const headers = misticpayHeaders()
  if (!headers) {
    return {
      ok: false,
      status: 500,
      transactionId: null,
      pixCode: null,
      errorMessage: 'MISTICPAY_CLIENT_ID ou MISTICPAY_CLIENT_SECRET não configurados',
      raw: null,
    }
  }

  const body: Record<string, unknown> = {
    amount: input.amount,
    payerName: input.client.name,
    payerDocument: (input.client.document || '').replace(/\D/g, ''),
    transactionId: input.identifier,
    description: input.description,
  }
  if (input.callbackUrl) body.projectWebhook = input.callbackUrl

  let res: Response
  try {
    res = await fetch(`${MISTICPAY_API_URL}/transactions/create`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro de conexão com a MisticPay'
    return { ok: false, status: 502, transactionId: null, pixCode: null, errorMessage: msg, raw: null }
  }

  let data: any = {}
  try {
    data = await res.json()
  } catch {
    data = {}
  }

  const payload = data?.data || data
  const pixCode =
    payload?.copyPaste ||
    payload?.copy_paste ||
    payload?.pixCode ||
    payload?.qrcode ||
    payload?.qr_code ||
    null
  const transactionId =
    payload?.transactionId !== undefined && payload?.transactionId !== null
      ? String(payload.transactionId)
      : null

  const success = res.ok && Boolean(pixCode)
  const errorMessage = success
    ? null
    : data?.message ||
      data?.error?.message ||
      payload?.message ||
      `Falha ao gerar PIX na MisticPay (status ${res.status})`

  return {
    ok: success,
    status: res.status,
    transactionId,
    pixCode,
    errorMessage,
    raw: payload,
  }
}

// ---------------------------------------------------------------------------
// Cash-out (saque PIX)
// ---------------------------------------------------------------------------

export type MisticpayPixKeyType =
  | 'CPF'
  | 'CNPJ'
  | 'EMAIL'
  | 'TELEFONE'
  | 'CHAVE_ALEATORIA'

export interface MisticpayWithdrawInput {
  externalId: string
  /** Valor em reais (decimal). */
  amount: number
  pixKey: string
  pixKeyType: MisticpayPixKeyType
  description?: string
  callbackUrl?: string
}

export interface MisticpayWithdrawResult {
  ok: boolean
  status: number
  transactionId: string | null
  endToEndId: string | null
  errorMessage: string | null
  raw: any
}

/**
 * Executa um saque (cash-out) PIX na MisticPay.
 *
 * POST /api/transactions/withdraw (headers ci/cs)
 * body: { amount, pixKey, pixKeyType, description, projectWebhook }
 * resposta: { message, data: { jobId, transactionId, status: "QUEUED" } }
 *
 * O saque entra em fila (status QUEUED). A confirmacao final chega via webhook
 * de saque (transactionType RETIRADA, status COMPLETO/FALHA).
 */
export async function createMisticpayWithdraw(
  input: MisticpayWithdrawInput
): Promise<MisticpayWithdrawResult> {
  const headers = misticpayHeaders()
  if (!headers) {
    return {
      ok: false,
      status: 500,
      transactionId: null,
      endToEndId: null,
      errorMessage: 'MISTICPAY_CLIENT_ID ou MISTICPAY_CLIENT_SECRET não configurados',
      raw: null,
    }
  }

  const body: Record<string, unknown> = {
    amount: input.amount,
    pixKey: input.pixKey,
    pixKeyType: input.pixKeyType,
    description: input.description || 'Saque PIX',
  }
  if (input.callbackUrl) body.projectWebhook = input.callbackUrl

  let res: Response
  try {
    res = await fetch(`${MISTICPAY_API_URL}/transactions/withdraw`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro de conexão com a MisticPay'
    return { ok: false, status: 502, transactionId: null, endToEndId: null, errorMessage: msg, raw: null }
  }

  let data: any = {}
  try {
    data = await res.json()
  } catch {
    data = {}
  }

  const payload = data?.data || data
  const transactionId =
    payload?.transactionId !== undefined && payload?.transactionId !== null
      ? String(payload.transactionId)
      : null
  const endToEndId = payload?.e2e || payload?.endToEndId || payload?.end_to_end_id || null

  // Sucesso: HTTP ok e presenca de transactionId (status QUEUED = enfileirado).
  const success = res.ok && transactionId !== null
  const errorMessage = success
    ? null
    : data?.message ||
      data?.error?.message ||
      payload?.message ||
      `Falha no saque MisticPay (status ${res.status})`

  return {
    ok: success,
    status: res.status,
    transactionId,
    endToEndId,
    errorMessage,
    raw: payload,
  }
}

// ---------------------------------------------------------------------------
// Consulta de status (verificacao de transacao)
// ---------------------------------------------------------------------------

/**
 * Consulta o status de uma transacao na MisticPay.
 *
 * POST /api/transactions/check { transactionId }
 * resposta: { message, transaction: { transactionState, ... } }
 *
 * Rate limit: 60 req/min por IP.
 */
export async function checkMisticpayTransaction(transactionId: string): Promise<{
  ok: boolean
  status: number
  state: string | null
  raw: any
}> {
  const headers = misticpayHeaders()
  if (!headers) {
    return { ok: false, status: 500, state: null, raw: null }
  }

  try {
    const res = await fetch(`${MISTICPAY_API_URL}/transactions/check`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ transactionId }),
    })
    const data = await res.json().catch(() => ({}))
    const state = data?.transaction?.transactionState || data?.data?.transactionState || null
    return { ok: res.ok, status: res.status, state, raw: data }
  } catch {
    return { ok: false, status: 502, state: null, raw: null }
  }
}
