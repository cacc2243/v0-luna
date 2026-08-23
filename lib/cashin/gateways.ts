import { createSigilopayPixCharge } from '@/lib/sigilopay/client'
import { createHorsepayPixCharge } from '@/lib/horsepay/client'
import { createPixupPixCharge } from '@/lib/pixup/client'
import { createDiretopayPixCharge } from '@/lib/diretopay/client'
import { buildAnonymousPayer } from '@/lib/diretopay/anonymize'
import { createMisticpayPixCharge, isMisticpayConfigured } from '@/lib/misticpay/client'
import { createBspayPixCharge } from '@/lib/bspay/client'
import { createBuckpayPixCharge } from '@/lib/buckpay/client'

const BYNET_API_URL = 'https://api-gateway.techbynet.com'

/**
 * Entrada normalizada de cash-in (geracao de cobranca PIX),
 * independente do gateway.
 */
export interface CashinInput {
  /** Identificador unico da transacao (gerado pela nossa aplicacao). */
  identifier: string
  /** Valor em reais (decimal). */
  amount: number
  /** Titulo do item exibido na cobranca. */
  itemTitle: string
  client: {
    name: string
    email: string
    phone: string
    /** CPF/CNPJ (so digitos). Pode vir vazio. */
    document: string
  }
  callbackUrl?: string
}

export interface CashinResult {
  ok: boolean
  status: number
  /** ID da transacao no gateway. */
  transactionId: string | null
  /** Codigo PIX copia e cola (EMV). */
  pixCode: string | null
  /** Mensagem de erro legivel da gateway, se houver. */
  errorMessage: string | null
  /** Resposta crua para auditoria/log. */
  raw: any
}

/**
 * Contrato que todo gateway de cash-in deve implementar.
 */
export interface CashinGateway {
  /** Identificador estavel usado no banco e nas configuracoes. */
  id: string
  /** Nome exibido no painel. */
  label: string
  /** Descricao curta exibida no painel. */
  description: string
  /** Indica se as variaveis de ambiente necessarias estao presentes. */
  isConfigured: () => boolean
  /** Gera a cobranca PIX. */
  create: (input: CashinInput) => Promise<CashinResult>
}

// ---------------------------------------------------------------------------
// Helpers de CPF (usados pelo gateway Bynet para garantir aprovacao da cobranca)
// ---------------------------------------------------------------------------

// Gera um CPF valido aleatorio (algoritmo oficial dos digitos verificadores)
function generateValidCPF(): string {
  const n = () => Math.floor(Math.random() * 9)
  const d: number[] = Array.from({ length: 9 }, n)

  let sum = 0
  for (let i = 0; i < 9; i++) sum += d[i] * (10 - i)
  let r = (sum * 10) % 11
  if (r === 10) r = 0
  d.push(r)

  sum = 0
  for (let i = 0; i < 10; i++) sum += d[i] * (11 - i)
  r = (sum * 10) % 11
  if (r === 10) r = 0
  d.push(r)

  return d.join('')
}

// Valida CPF (digitos verificadores)
function isValidCPF(cpf: string): boolean {
  const clean = (cpf || '').replace(/\D/g, '')
  if (clean.length !== 11) return false
  if (/^(\d)\1{10}$/.test(clean)) return false

  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(clean[i]) * (10 - i)
  let r = (sum * 10) % 11
  if (r === 10) r = 0
  if (r !== parseInt(clean[9])) return false

  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(clean[i]) * (11 - i)
  r = (sum * 10) % 11
  if (r === 10) r = 0
  if (r !== parseInt(clean[10])) return false

  return true
}

const FALLBACK_NAMES = [
  'Maria Silva Santos',
  'Ana Paula Oliveira',
  'Juliana Costa Lima',
  'Fernanda Souza Alves',
  'Camila Rodrigues Pereira',
]

interface BynetCustomer {
  name: string
  email: string
  phone: string
  document: { number: string; type: 'CPF' }
}

async function createBynetTransaction(
  apiKey: string,
  amount: number,
  customer: BynetCustomer,
  itemTitle: string,
  postbackUrl?: string
) {
  const requestBody: Record<string, any> = {
    amount: Math.round(amount * 100), // centavos
    paymentMethod: 'PIX',
    customer,
    items: [
      {
        title: itemTitle,
        unitPrice: Math.round(amount * 100),
        quantity: 1,
        tangible: false,
      },
    ],
    pix: { expiresInDays: 1 },
  }

  // URL de notificacao de pagamento (webhook). Aponta para a Edge Function
  // do Supabase, mantendo o dominio real fora do painel do gateway.
  if (postbackUrl) {
    requestBody.postbackUrl = postbackUrl
  }

  const response = await fetch(`${BYNET_API_URL}/api/user/transactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'User-Agent': 'AtivoB2B/1.0',
    },
    body: JSON.stringify(requestBody),
  })

  const data = await response.json().catch(() => ({}))
  return { ok: response.ok, status: response.status, data }
}

/**
 * Gateway Bynet (TechByNet). Faz multiplas tentativas com CPFs validos
 * para maximizar a taxa de aprovacao da cobranca.
 */
const bynetGateway: CashinGateway = {
  id: 'bynet',
  label: 'Bynet',
  description: 'Geração de PIX (cash-in) via TechByNet.',
  isConfigured: () => Boolean(process.env.BYNET_API_KEY),
  create: async (input) => {
    const apiKey = process.env.BYNET_API_KEY
    if (!apiKey) {
      return {
        ok: false,
        status: 500,
        transactionId: null,
        pixCode: null,
        errorMessage: 'BYNET_API_KEY não configurada',
        raw: null,
      }
    }

    const cleanDoc = (input.client.document || '').replace(/\D/g, '')
    const cleanPhone = (input.client.phone || '').replace(/\D/g, '')
    const safeName =
      input.client.name && input.client.name.trim().length >= 3
        ? input.client.name.trim()
        : null

    const attempts: BynetCustomer[] = []

    // Tentativa 1: dados reais quando o CPF for valido.
    if (isValidCPF(cleanDoc)) {
      attempts.push({
        name: safeName || FALLBACK_NAMES[0],
        email: input.client.email,
        phone: cleanPhone.length >= 10 ? cleanPhone : '11999999999',
        document: { number: cleanDoc, type: 'CPF' },
      })
    }

    // Fallbacks: SEMPRE gerar CPFs validos novos.
    for (let i = 0; i < 4; i++) {
      attempts.push({
        name: safeName || FALLBACK_NAMES[i % FALLBACK_NAMES.length],
        email: input.client.email,
        phone: '11999999999',
        document: { number: generateValidCPF(), type: 'CPF' },
      })
    }

    let lastError: any = null
    let lastStatus = 500

    for (const customer of attempts) {
      const result = await createBynetTransaction(
        apiKey,
        input.amount,
        customer,
        input.itemTitle,
        input.callbackUrl
      )
      lastStatus = result.status

      if (result.ok && !result.data?.error) {
        const tx = result.data?.data || result.data
        const code = tx?.qrCode || tx?.pix?.qrcode || tx?.pix?.qrCode
        if (code) {
          return {
            ok: true,
            status: result.status,
            transactionId: tx?.id ? String(tx.id) : null,
            pixCode: code,
            errorMessage: null,
            raw: tx,
          }
        }
      }

      lastError = result.data?.error || result.data?.message || `Status ${result.status}`
      console.error('[v0] Tentativa de PIX (Bynet) falhou:', lastError)
    }

    return {
      ok: false,
      status: lastStatus,
      transactionId: null,
      pixCode: null,
      errorMessage: String(lastError || 'Falha ao gerar PIX na Bynet'),
      raw: null,
    }
  },
}

/**
 * Gateway SigiloPay. Autenticacao por x-public-key / x-secret-key.
 */
const sigilopayGateway: CashinGateway = {
  id: 'sigilopay',
  label: 'SigiloPay',
  description: 'Geração de PIX (cash-in) via SigiloPay.',
  isConfigured: () =>
    Boolean(process.env.SIGILOPAY_PUBLIC_KEY && process.env.SIGILOPAY_SECRET_KEY),
  create: async (input) => {
    const cleanDoc = (input.client.document || '').replace(/\D/g, '')
    const cleanPhone = (input.client.phone || '').replace(/\D/g, '')
    const safeName =
      input.client.name && input.client.name.trim().length >= 3
        ? input.client.name.trim()
        : FALLBACK_NAMES[0]

    // SigiloPay exige document valido; usa CPF gerado quando o recebido for invalido.
    const document = isValidCPF(cleanDoc) ? cleanDoc : generateValidCPF()
    const phone = cleanPhone.length >= 10 ? cleanPhone : '11999999999'

    try {
      const result = await createSigilopayPixCharge({
        identifier: input.identifier,
        amount: input.amount,
        client: {
          name: safeName,
          email: input.client.email,
          phone,
          document,
        },
        callbackUrl: input.callbackUrl,
      })

      return {
        ok: result.ok,
        status: result.status,
        transactionId: result.transactionId,
        pixCode: result.pixCode,
        errorMessage: result.errorMessage,
        raw: result.raw,
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao contatar a SigiloPay'
      console.error('[v0] Erro no gateway SigiloPay:', msg)
      return {
        ok: false,
        status: 502,
        transactionId: null,
        pixCode: null,
        errorMessage: msg,
        raw: null,
      }
    }
  },
}

/**
 * Gateway HorsePay. Autenticacao OAuth (client_key/client_secret -> Bearer).
 * O CPF nao e exigido na cobranca; usamos nome/telefone do cliente.
 */
const horsepayGateway: CashinGateway = {
  id: 'horsepay',
  label: 'HorsePay',
  description: 'Geração de PIX (cash-in) via HorsePay.',
  isConfigured: () =>
    Boolean(process.env.HORSEPAY_CLIENT_KEY && process.env.HORSEPAY_CLIENT_SECRET),
  create: async (input) => {
    const cleanPhone = (input.client.phone || '').replace(/\D/g, '')
    const safeName =
      input.client.name && input.client.name.trim().length >= 3
        ? input.client.name.trim()
        : FALLBACK_NAMES[0]
    const phone = cleanPhone.length >= 10 ? cleanPhone : '11999999999'

    try {
      const result = await createHorsepayPixCharge({
        identifier: input.identifier,
        amount: input.amount,
        client: {
          name: safeName,
          email: input.client.email,
          phone,
          document: (input.client.document || '').replace(/\D/g, ''),
        },
        callbackUrl: input.callbackUrl,
      })

      return {
        ok: result.ok,
        status: result.status,
        transactionId: result.transactionId,
        pixCode: result.pixCode,
        errorMessage: result.errorMessage,
        raw: result.raw,
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao contatar a HorsePay'
      console.error('[v0] Erro no gateway HorsePay:', msg)
      return {
        ok: false,
        status: 502,
        transactionId: null,
        pixCode: null,
        errorMessage: msg,
        raw: null,
      }
    }
  },
}

/**
 * Gateway PixUp (cash-in). Autenticacao OAuth2 client_credentials (Basic ->
 * Bearer). O cash-in NAO exige assinatura HMAC (so o cash-out exige).
 */
const pixupGateway: CashinGateway = {
  id: 'pixup',
  label: 'PixUp',
  description: 'Geração de PIX (cash-in) via PixUp.',
  isConfigured: () =>
    Boolean(process.env.PIXUP_CLIENT_ID && process.env.PIXUP_CLIENT_SECRET),
  create: async (input) => {
    const safeName =
      input.client.name && input.client.name.trim().length >= 3
        ? input.client.name.trim()
        : FALLBACK_NAMES[0]
    const cleanDoc = (input.client.document || '').replace(/\D/g, '')

    try {
      const result = await createPixupPixCharge({
        externalId: input.identifier,
        amount: input.amount,
        postbackUrl: input.callbackUrl,
        client: {
          name: safeName,
          email: input.client.email,
          document: isValidCPF(cleanDoc) ? cleanDoc : undefined,
        },
      })

      return {
        ok: result.ok,
        status: result.status,
        transactionId: result.transactionId,
        pixCode: result.pixCode,
        errorMessage: result.errorMessage,
        raw: result.raw,
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao contatar a PixUp'
      console.error('[v0] Erro no gateway PixUp (cash-in):', msg)
      return {
        ok: false,
        status: 502,
        transactionId: null,
        pixCode: null,
        errorMessage: msg,
        raw: null,
      }
    }
  },
}

/**
 * Gateway DiretoPay. Autenticacao por Bearer (sk-api-...). Trabalha com
 * valores em reais decimais.
 *
 * PRIVACIDADE (regra exclusiva deste gateway): NENHUM dado real do pagador e
 * enviado a DiretoPay. Nome, e-mail, telefone e CPF sao substituidos por uma
 * identidade sintetica derivada do nosso identificador interno da transacao
 * (ver lib/diretopay/anonymize.ts).
 *
 * Os dados reais do cliente continuam salvos no nosso banco e usados
 * normalmente no resto do sistema. A conciliacao do pagamento nao depende de
 * dado pessoal: e feita pelo `id` que a DiretoPay retorna na criacao e reenvia
 * no webhook. Por isso a troca e segura.
 *
 * NAO reintroduza `input.client` nesta chamada.
 */
const diretopayGateway: CashinGateway = {
  id: 'diretopay',
  label: 'DiretoPay',
  description: 'Geração de PIX (cash-in) via DiretoPay, sem enviar dados do cliente.',
  isConfigured: () => Boolean(process.env.DIRETOPAY_API_KEY),
  create: async (input) => {
    // Identidade 100% ficticia: os dados reais de `input.client` sao ignorados.
    const anon = buildAnonymousPayer(input.identifier)

    try {
      const result = await createDiretopayPixCharge({
        identifier: input.identifier,
        amount: input.amount,
        itemTitle: input.itemTitle,
        client: {
          name: anon.name,
          email: anon.email,
          phone: anon.phone,
          document: anon.document,
          documentType: 'cpf',
        },
        callbackUrl: input.callbackUrl,
      })

      return {
        ok: result.ok,
        status: result.status,
        transactionId: result.transactionId,
        pixCode: result.pixCode,
        errorMessage: result.errorMessage,
        raw: result.raw,
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao contatar a DiretoPay'
      console.error('[v0] Erro no gateway DiretoPay:', msg)
      return {
        ok: false,
        status: 502,
        transactionId: null,
        pixCode: null,
        errorMessage: msg,
        raw: null,
      }
    }
  },
}

/**
 * Gateway MisticPay. Autenticacao por headers ci/cs (Client ID / Secret).
 * Exige CPF valido do pagador (payerDocument); gera um CPF valido quando o
 * recebido for invalido. Trabalha com valores em reais decimais.
 */
const misticpayGateway: CashinGateway = {
  id: 'misticpay',
  label: 'MisticPay',
  description: 'Geração de PIX (cash-in) via MisticPay.',
  isConfigured: () => isMisticpayConfigured(),
  create: async (input) => {
    const cleanDoc = (input.client.document || '').replace(/\D/g, '')
    const safeName =
      input.client.name && input.client.name.trim().length >= 3
        ? input.client.name.trim()
        : FALLBACK_NAMES[0]

    // A MisticPay exige documento valido; usa CPF gerado quando o recebido for invalido.
    const document = isValidCPF(cleanDoc) ? cleanDoc : generateValidCPF()

    try {
      const result = await createMisticpayPixCharge({
        identifier: input.identifier,
        amount: input.amount,
        description: input.itemTitle,
        client: {
          name: safeName,
          document,
        },
        callbackUrl: input.callbackUrl,
      })

      return {
        ok: result.ok,
        status: result.status,
        transactionId: result.transactionId,
        pixCode: result.pixCode,
        errorMessage: result.errorMessage,
        raw: result.raw,
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao contatar a MisticPay'
      console.error('[v0] Erro no gateway MisticPay (cash-in):', msg)
      return {
        ok: false,
        status: 502,
        transactionId: null,
        pixCode: null,
        errorMessage: msg,
        raw: null,
      }
    }
  },
}

/**
 * Gateway BSPay (cash-in). Mesma API da PixUp: OAuth2 client_credentials
 * (Basic -> Bearer), sem HMAC no cash-in. O QR Code volta em
 * `data.payment_info.qrcode` e o webhook chega como `cashin.confirmed`.
 */
const bspayGateway: CashinGateway = {
  id: 'bspay',
  label: 'BSPay',
  description: 'Geração de PIX (cash-in) via BSPay.',
  isConfigured: () =>
    Boolean(process.env.BSPAY_CLIENT_ID && process.env.BSPAY_CLIENT_SECRET),
  create: async (input) => {
    const safeName =
      input.client.name && input.client.name.trim().length >= 3
        ? input.client.name.trim()
        : FALLBACK_NAMES[0]
    const cleanDoc = (input.client.document || '').replace(/\D/g, '')

    try {
      const result = await createBspayPixCharge({
        externalId: input.identifier,
        amount: input.amount,
        postbackUrl: input.callbackUrl,
        client: {
          name: safeName,
          email: input.client.email,
          document: isValidCPF(cleanDoc) ? cleanDoc : undefined,
        },
      })

      return {
        ok: result.ok,
        status: result.status,
        transactionId: result.transactionId,
        pixCode: result.pixCode,
        errorMessage: result.errorMessage,
        raw: result.raw,
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao contatar a BSPay'
      console.error('[v0] Erro no gateway BSPay (cash-in):', msg)
      return {
        ok: false,
        status: 502,
        transactionId: null,
        pixCode: null,
        errorMessage: msg,
        raw: null,
      }
    }
  },
}

/**
 * Gateway BuckPay. Autenticacao por Bearer token + User-Agent especifico.
 * Trabalha com valores em centavos (min R$ 6,00). O CPF nao e obrigatorio;
 * enviamos os dados reais do pagador quando disponiveis.
 */
const buckpayGateway: CashinGateway = {
  id: 'buckpay',
  label: 'BuckPay',
  description: 'Geração de PIX (cash-in) via BuckPay.',
  isConfigured: () => Boolean(process.env.BUCKPAY_API_TOKEN),
  create: async (input) => {
    const cleanDoc = (input.client.document || '').replace(/\D/g, '')
    const cleanPhone = (input.client.phone || '').replace(/\D/g, '')
    const safeName =
      input.client.name && input.client.name.trim().length >= 3
        ? input.client.name.trim()
        : FALLBACK_NAMES[0]

    // A BuckPay nao exige CPF, mas quando o recebido for invalido geramos um
    // valido para maximizar aprovacao e manter consistencia com os demais.
    const document = isValidCPF(cleanDoc) ? cleanDoc : generateValidCPF()
    const phone = cleanPhone.length >= 10 ? cleanPhone : '11999999999'

    try {
      const result = await createBuckpayPixCharge({
        identifier: input.identifier,
        amount: input.amount,
        itemTitle: input.itemTitle,
        client: {
          name: safeName,
          email: input.client.email,
          phone,
          document,
        },
        callbackUrl: input.callbackUrl,
      })

      return {
        ok: result.ok,
        status: result.status,
        transactionId: result.transactionId,
        pixCode: result.pixCode,
        errorMessage: result.errorMessage,
        raw: result.raw,
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao contatar a BuckPay'
      console.error('[v0] Erro no gateway BuckPay (cash-in):', msg)
      return {
        ok: false,
        status: 502,
        transactionId: null,
        pixCode: null,
        errorMessage: msg,
        raw: null,
      }
    }
  },
}

/**
 * Registro central de gateways de cash-in. Para adicionar um novo gateway,
 * implemente CashinGateway e registre-o aqui — ele aparece automaticamente
 * no painel de configuracoes.
 */
const GATEWAYS: CashinGateway[] = [
  bynetGateway,
  sigilopayGateway,
  horsepayGateway,
  pixupGateway,
  diretopayGateway,
  misticpayGateway,
  bspayGateway,
  buckpayGateway,
]

export function listCashinGateways(): CashinGateway[] {
  return GATEWAYS
}

export function getCashinGateway(id: string): CashinGateway | null {
  return GATEWAYS.find((g) => g.id === id) || null
}

/**
 * Resolve a ordem de execucao: gateway ativo primeiro, demais configurados
 * como fallback. Garante que sempre haja ao menos um gateway configurado.
 */
export function resolveCashinOrder(activeId: string): CashinGateway[] {
  const configured = GATEWAYS.filter((g) => g.isConfigured())
  const active = configured.find((g) => g.id === activeId)
  const rest = configured.filter((g) => g.id !== activeId)
  return active ? [active, ...rest] : configured
}

/** Metadados leves para o painel (sem expor logica/segredos). */
export interface CashinGatewayMeta {
  id: string
  label: string
  description: string
  configured: boolean
}

export function listCashinGatewayMeta(): CashinGatewayMeta[] {
  return GATEWAYS.map((g) => ({
    id: g.id,
    label: g.label,
    description: g.description,
    configured: g.isConfigured(),
  }))
}
