import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin-auth'

const BYNET_API_URL = 'https://api-gateway.techbynet.com'

// Gera um CPF valido aleatorio
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

const TEST_NAMES = [
  'Maria Silva Santos',
  'Ana Paula Oliveira',
  'Juliana Costa Lima',
  'Fernanda Souza Alves',
]

// Configuracao dos gateways disponiveis (apenas Bynet em uso)
const GATEWAYS: Record<
  string,
  { label: string; envKey: string; configured: boolean }
> = {
  bynet: { label: 'Bynet', envKey: 'BYNET_API_KEY', configured: !!process.env.BYNET_API_KEY },
}

async function testBynet(amount: number) {
  const apiKey = process.env.BYNET_API_KEY
  if (!apiKey) {
    return { success: false, error: 'BYNET_API_KEY não configurada' }
  }

  const name = TEST_NAMES[Math.floor(Math.random() * TEST_NAMES.length)]
  const requestBody = {
    amount: Math.round(amount * 100),
    paymentMethod: 'PIX',
    customer: {
      name,
      email: `teste${Date.now()}@lunaprive.com`,
      phone: '11999999999',
      document: { number: generateValidCPF(), type: 'CPF' },
    },
    items: [
      {
        title: 'Teste de Gateway - Luna Privé',
        unitPrice: Math.round(amount * 100),
        quantity: 1,
        tangible: false,
      },
    ],
    pix: { expiresInDays: 1 },
  }

  const start = Date.now()
  const response = await fetch(`${BYNET_API_URL}/api/user/transactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'User-Agent': 'AtivoB2B/1.0',
    },
    body: JSON.stringify(requestBody),
  })
  const latency = Date.now() - start
  const data = await response.json()

  if (!response.ok || data.error) {
    return {
      success: false,
      error: data.error || data.message || `Status ${response.status}`,
      latency,
    }
  }

  const td = data.data || data
  const pixCode = td.qrCode || td.pix?.qrcode || td.pix?.qrCode || ''

  return {
    success: true,
    latency,
    pixCode,
    transactionId: td.id,
    amount,
    customer: requestBody.customer,
    raw: td,
  }
}

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  const list = Object.entries(GATEWAYS).map(([id, g]) => ({
    id,
    label: g.label,
    configured: g.configured,
  }))
  return NextResponse.json({ gateways: list })
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

    if (!GATEWAYS[gateway]) {
      return NextResponse.json({ error: 'Gateway inválido' }, { status: 400 })
    }

    if (!GATEWAYS[gateway].configured) {
      return NextResponse.json({
        success: false,
        error: `Gateway ${GATEWAYS[gateway].label} não está configurado. Adicione a variável ${GATEWAYS[gateway].envKey}.`,
      })
    }

    let result
    switch (gateway) {
      case 'bynet':
        result = await testBynet(value)
        break
      default:
        result = {
          success: false,
          error: `Teste para ${GATEWAYS[gateway].label} ainda não implementado.`,
        }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('[v0] Erro no teste de gateway:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
