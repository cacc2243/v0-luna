import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import {
  listCashinGatewayMeta,
  getCashinGateway,
  type CashinInput,
} from '@/lib/cashin/gateways'
import { getSiteUrl } from '@/lib/site-url'

const TEST_NAMES = [
  'Maria Silva Santos',
  'Ana Paula Oliveira',
  'Juliana Costa Lima',
  'Fernanda Souza Alves',
]

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  // Lista dinamica a partir do registro central de gateways de cash-in.
  return NextResponse.json({ gateways: listCashinGatewayMeta() })
}

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const { gateway, amount } = await request.json()
    const value = Number(amount)

    if (!gateway || !value || value <= 0) {
      return NextResponse.json(
        { error: 'Gateway e valor válido são obrigatórios' },
        { status: 400 }
      )
    }

    const gw = getCashinGateway(gateway)
    if (!gw) {
      return NextResponse.json({ error: 'Gateway inválido' }, { status: 400 })
    }

    if (!gw.isConfigured()) {
      return NextResponse.json({
        success: false,
        error: `Gateway ${gw.label} não está configurado. Verifique as variáveis de ambiente.`,
      })
    }

    const name = TEST_NAMES[Math.floor(Math.random() * TEST_NAMES.length)]
    const input: CashinInput = {
      identifier: `teste-painel-${Date.now()}`,
      amount: value,
      itemTitle: 'Teste de Gateway - Luna Privé',
      client: {
        name,
        email: `teste${Date.now()}@lunaprive.live`,
        phone: '11999999999',
        document: '', // o gateway gera um CPF valido automaticamente
      },
      // Mesma URL fixa usada em producao (evita estourar o limite de webhooks).
      callbackUrl: `${getSiteUrl()}/api/pix/webhook`,
    }

    const start = Date.now()
    const result = await gw.create(input)
    const latency = Date.now() - start

    if (!result.ok || !result.pixCode) {
      return NextResponse.json({
        success: false,
        latency,
        error: result.errorMessage || 'Falha ao gerar PIX de teste.',
      })
    }

    return NextResponse.json({
      success: true,
      latency,
      pixCode: result.pixCode,
      transactionId: result.transactionId,
      amount: value,
      gateway: gw.id,
      gatewayLabel: gw.label,
      customer: { name, email: input.client.email },
    })
  } catch (error) {
    console.error('[v0] Erro no teste de gateway:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
