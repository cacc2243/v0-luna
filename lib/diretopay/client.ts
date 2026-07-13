const DIRETOPAY_API_URL = 'https://api.diretopay.com.br/payment/v1'

export interface DiretopayClient {
  name: string
  email: string
  phone: string
  /** CPF/CNPJ (so digitos). */
  document: string
  documentType?: 'cpf' | 'cnpj'
}

export interface DiretopayReceiveInput {
  /** Identificador unico da transacao (gerado pela nossa aplicacao). */
  identifier: string
  /** Valor em reais (decimal). */
  amount: number
  /** Titulo do item exibido na cobranca. */
  itemTitle: string
  client: DiretopayClient
  callbackUrl?: string
}

export interface DiretopayReceiveResult {
  ok: boolean
  status: number
  /** ID da transacao na DiretoPay. */
  transactionId: string | null
  /** Codigo PIX copia e cola (EMV). */
  pixCode: string | null
  /** Mensagem de erro legivel, se houver. */
  errorMessage: string | null
  raw: any
}

/**
 * Separa um nome completo em firstName / lastName. A DiretoPay exige ambos.
 * Quando so ha um termo, usa um sobrenome padrao para nao quebrar a cobranca.
 */
function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = (fullName || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (parts.length === 0) return { firstName: 'Cliente', lastName: 'Luna' }
  if (parts.length === 1) return { firstName: parts[0], lastName: 'Silva' }
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') }
}

/**
 * Cria uma cobranca PIX (cash-in) na DiretoPay.
 *
 * POST /payment/v1/create (Authorization: Bearer sk-api-...)
 * body: { amount, currency, paymentMethod: 'pix', paymentDetails, items, postbackURL }
 * resposta: { id, pix (EMV copia e cola), status, amount, ... }
 *
 * A DiretoPay trabalha com valores em REAIS (decimal), ex.: 24.8 = R$ 24,80.
 * O identifier da nossa aplicacao e conciliado no webhook via `data.id`, que
 * corresponde ao `id` retornado nesta criacao (salvo como transaction_id).
 */
export async function createDiretopayPixCharge(
  input: DiretopayReceiveInput
): Promise<DiretopayReceiveResult> {
  const apiKey = process.env.DIRETOPAY_API_KEY
  if (!apiKey) {
    return {
      ok: false,
      status: 500,
      transactionId: null,
      pixCode: null,
      errorMessage: 'DIRETOPAY_API_KEY não configurada',
      raw: null,
    }
  }

  const { firstName, lastName } = splitName(input.client.name)
  const phone = (input.client.phone || '').replace(/\D/g, '') || '11999999999'

  const body: Record<string, unknown> = {
    amount: input.amount,
    currency: 'BRL',
    paymentMethod: 'pix',
    paymentDetails: {
      firstName,
      lastName,
      email: input.client.email,
      phoneNumber: phone,
      document: input.client.document,
      documentType: input.client.documentType || 'cpf',
    },
    items: [
      {
        title: input.itemTitle,
        unitPrice: input.amount,
        quantity: 1,
        tangible: false,
      },
    ],
  }
  if (input.callbackUrl) body.postbackURL = input.callbackUrl

  let res: Response
  try {
    res = await fetch(`${DIRETOPAY_API_URL}/create`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro de conexão com a DiretoPay'
    return { ok: false, status: 502, transactionId: null, pixCode: null, errorMessage: msg, raw: null }
  }

  let data: any = {}
  try {
    data = await res.json()
  } catch {
    data = {}
  }

  // A resposta pode vir na raiz ou aninhada em `data`, conforme o ambiente.
  const payload = data?.data || data
  const pixCode =
    payload?.pix ||
    payload?.pixCode ||
    payload?.qrcode ||
    payload?.qr_code ||
    payload?.copyPaste ||
    null
  const transactionId =
    payload?.id !== undefined && payload?.id !== null ? String(payload.id) : null

  const success = res.ok && Boolean(pixCode)
  const errorMessage = success
    ? null
    : data?.message ||
      data?.error?.message ||
      payload?.message ||
      `Falha ao gerar PIX na DiretoPay (status ${res.status})`

  return {
    ok: success,
    status: res.status,
    transactionId,
    pixCode,
    errorMessage,
    raw: payload,
  }
}
