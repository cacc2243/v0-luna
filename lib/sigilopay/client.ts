const SIGILOPAY_API_URL = 'https://app.sigilopay.com.br/api/v1'

export interface SigilopayClient {
  name: string
  email: string
  phone: string
  document: string
}

export interface SigilopayReceiveInput {
  /** Identificador unico da transacao (gerado pela nossa aplicacao). */
  identifier: string
  /** Valor em reais (decimal). */
  amount: number
  client: SigilopayClient
  callbackUrl?: string
}

export interface SigilopayReceiveResult {
  ok: boolean
  status: number
  /** ID da transacao na SigiloPay. */
  transactionId: string | null
  /** Codigo PIX copia e cola. */
  pixCode: string | null
  /** Mensagem de erro legivel, se houver. */
  errorMessage: string | null
  raw: any
}

/**
 * Cria uma cobranca PIX (cash-in) na SigiloPay.
 *
 * Autenticacao por headers x-public-key / x-secret-key.
 * As credenciais ficam exclusivamente no servidor.
 */
export async function createSigilopayPixCharge(
  input: SigilopayReceiveInput
): Promise<SigilopayReceiveResult> {
  const publicKey = process.env.SIGILOPAY_PUBLIC_KEY
  const secretKey = process.env.SIGILOPAY_SECRET_KEY

  if (!publicKey || !secretKey) {
    throw new Error('SIGILOPAY_PUBLIC_KEY ou SIGILOPAY_SECRET_KEY não configurados')
  }

  const body = {
    identifier: input.identifier,
    amount: input.amount,
    client: {
      name: input.client.name,
      email: input.client.email,
      phone: input.client.phone,
      document: input.client.document,
    },
    ...(input.callbackUrl ? { callbackUrl: input.callbackUrl } : {}),
  }

  const res = await fetch(`${SIGILOPAY_API_URL}/gateway/pix/receive`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-public-key': publicKey,
      'x-secret-key': secretKey,
    },
    body: JSON.stringify(body),
  })

  let data: any = {}
  try {
    data = await res.json()
  } catch {
    data = {}
  }

  // Status de sucesso no cash-in PIX: OK / PENDING (aguardando pagamento).
  const statusStr = String(data?.status || '').toUpperCase()
  const pixCode = data?.pix?.code || null
  const success =
    res.ok &&
    statusStr !== 'FAILED' &&
    Boolean(pixCode)

  const errorMessage = success
    ? null
    : data?.errorDescription ||
      data?.message ||
      data?.issue ||
      `Falha ao gerar PIX na SigiloPay (status ${res.status})`

  return {
    ok: success,
    status: res.status,
    transactionId: data?.transactionId || null,
    pixCode,
    errorMessage,
    raw: data,
  }
}
