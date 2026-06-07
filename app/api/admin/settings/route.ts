import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import { getAppSettings, updateAppSettings } from '@/lib/settings'
import { listCashoutGatewayMeta, getCashoutGateway } from '@/lib/cashout/gateways'

export const dynamic = 'force-dynamic'

// Limites de seguranca para o valor de verificacao (em centavos): R$ 0,01 ate R$ 50,00
const MIN_AMOUNT_CENTS = 1
const MAX_AMOUNT_CENTS = 5000

// Limites de seguranca para o valor do convite (em centavos): R$ 1,00 ate R$ 1.000,00
const MIN_INVITE_CENTS = 100
const MAX_INVITE_CENTS = 100000

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const settings = await getAppSettings()
  const gateways = listCashoutGatewayMeta()

  return NextResponse.json({ settings, gateways })
}

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const patch: {
    verificationEnabled?: boolean
    activeCashoutGateway?: string
    verificationAmountCents?: number
    inviteAmountCents?: number
  } = {}

  if (typeof body.verificationEnabled === 'boolean') {
    patch.verificationEnabled = body.verificationEnabled
  }

  if (typeof body.activeCashoutGateway === 'string') {
    // So aceita gateway que exista no registro.
    const gw = getCashoutGateway(body.activeCashoutGateway)
    if (!gw) {
      return NextResponse.json(
        { error: 'Gateway de cashout inválido' },
        { status: 400 }
      )
    }
    patch.activeCashoutGateway = gw.id
  }

  if (body.verificationAmountCents !== undefined) {
    const cents = Math.round(Number(body.verificationAmountCents))
    if (!Number.isFinite(cents) || cents < MIN_AMOUNT_CENTS || cents > MAX_AMOUNT_CENTS) {
      return NextResponse.json(
        {
          error: `Valor inválido. Deve estar entre R$ ${(MIN_AMOUNT_CENTS / 100).toFixed(
            2
          )} e R$ ${(MAX_AMOUNT_CENTS / 100).toFixed(2)}.`,
        },
        { status: 400 }
      )
    }
    patch.verificationAmountCents = cents
  }

  if (body.inviteAmountCents !== undefined) {
    const cents = Math.round(Number(body.inviteAmountCents))
    if (!Number.isFinite(cents) || cents < MIN_INVITE_CENTS || cents > MAX_INVITE_CENTS) {
      return NextResponse.json(
        {
          error: `Valor do convite inválido. Deve estar entre R$ ${(MIN_INVITE_CENTS / 100).toFixed(
            2
          )} e R$ ${(MAX_INVITE_CENTS / 100).toFixed(2)}.`,
        },
        { status: 400 }
      )
    }
    patch.inviteAmountCents = cents
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'Nenhuma alteração válida enviada' }, { status: 400 })
  }

  try {
    await updateAppSettings(patch, 'admin')
  } catch (e: any) {
    console.error('[v0] Erro ao salvar settings:', e?.message)
    return NextResponse.json({ error: 'Falha ao salvar configurações' }, { status: 500 })
  }

  const settings = await getAppSettings()
  const gateways = listCashoutGatewayMeta()
  return NextResponse.json({ settings, gateways })
}
