import { createPixupCashout, type PixupCashoutInput } from '@/lib/pixup/client'

/**
 * Entrada normalizada de cashout, independente do gateway.
 */
export interface CashoutInput {
  externalId: string
  amountCents: number
  pixKey: string
  pixType: 'CPF' | 'CNPJ' | 'EMAIL' | 'PHONE' | 'RANDOM'
  beneficiaryName?: string | null
  description?: string
  postbackUrl?: string
}

export interface CashoutResult {
  ok: boolean
  status: number
  /** ID da transacao no gateway, se houver. */
  transactionId: string | null
  /** end-to-end id do PIX, se houver. */
  endToEndId: string | null
  /** Mensagem de erro legivel da gateway, se houver. */
  errorMessage: string | null
  /** Resposta crua para auditoria/log. */
  raw: any
}

/**
 * Contrato que todo gateway de cashout deve implementar.
 */
export interface CashoutGateway {
  /** Identificador estavel usado no banco e nas configuracoes. */
  id: string
  /** Nome exibido no painel. */
  label: string
  /** Descricao curta exibida no painel. */
  description: string
  /**
   * Indica se as variaveis de ambiente necessarias estao presentes.
   * Usado pelo painel para sinalizar gateways nao configurados.
   */
  isConfigured: () => boolean
  /** Executa o cashout. */
  send: (input: CashoutInput) => Promise<CashoutResult>
}

function mapPixTypeToPixup(
  type: CashoutInput['pixType']
): PixupCashoutInput['keyType'] {
  switch (type) {
    case 'CPF':
      return 'cpf'
    case 'CNPJ':
      return 'cnpj'
    case 'EMAIL':
      return 'email'
    case 'PHONE':
      return 'phone'
    default:
      return 'random'
  }
}

/**
 * Gateway PixUp (OAuth2 + HMAC). Valores em reais decimais.
 */
const pixupGateway: CashoutGateway = {
  id: 'pixup',
  label: 'PixUp',
  description: 'Cash-out PIX via PixUp (OAuth2 + assinatura HMAC).',
  isConfigured: () =>
    Boolean(
      process.env.PIXUP_CLIENT_ID &&
        process.env.PIXUP_CLIENT_SECRET &&
        process.env.PIXUP_SIGNING_KEY
    ),
  send: async (input) => {
    const result = await createPixupCashout({
      externalId: input.externalId,
      amount: input.amountCents / 100, // PixUp usa reais decimais
      key: input.pixKey,
      keyType: mapPixTypeToPixup(input.pixType),
      name: input.beneficiaryName || undefined,
      description: input.description,
      postbackUrl: input.postbackUrl,
    })

    const data = result.data || {}
    return {
      ok: result.ok,
      status: result.status,
      transactionId:
        data.transactionId || data.id || data.transaction_id || null,
      endToEndId: data.e2e_id || data.endToEndId || data.end_to_end_id || null,
      errorMessage: result.errorMessage,
      raw: data,
    }
  },
}

/**
 * Registro central de gateways. Para adicionar um novo gateway,
 * implemente CashoutGateway e registre-o aqui — ele aparece
 * automaticamente no painel de configuracoes.
 */
const GATEWAYS: CashoutGateway[] = [pixupGateway]

export function listCashoutGateways(): CashoutGateway[] {
  return GATEWAYS
}

export function getCashoutGateway(id: string): CashoutGateway | null {
  return GATEWAYS.find((g) => g.id === id) || null
}

/** Metadados leves para o painel (sem expor logica/segredos). */
export interface CashoutGatewayMeta {
  id: string
  label: string
  description: string
  configured: boolean
}

export function listCashoutGatewayMeta(): CashoutGatewayMeta[] {
  return GATEWAYS.map((g) => ({
    id: g.id,
    label: g.label,
    description: g.description,
    configured: g.isConfigured(),
  }))
}
