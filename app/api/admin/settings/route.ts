import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import { getAppSettings, updateAppSettings, BOOST_DAYS, type BoostAmounts } from '@/lib/settings'
import { listCashoutGatewayMeta, getCashoutGateway } from '@/lib/cashout/gateways'
import { listCashinGatewayMeta, getCashinGateway } from '@/lib/cashin/gateways'

export const dynamic = 'force-dynamic'

// Limites de seguranca para o valor de verificacao (em centavos): R$ 0,01 ate R$ 50,00
const MIN_AMOUNT_CENTS = 1
const MAX_AMOUNT_CENTS = 5000

// Limites de seguranca para precos de produto (em centavos): R$ 1,00 ate R$ 1.000,00
const MIN_INVITE_CENTS = 100
const MAX_INVITE_CENTS = 100000

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const settings = await getAppSettings()
  const gateways = listCashoutGatewayMeta()
  const cashinGateways = listCashinGatewayMeta()

  return NextResponse.json({ settings, gateways, cashinGateways })
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
    activeCashinGateway?: string
    verificationAmountCents?: number
    withdrawalVerificationAmountCents?: number
    inviteAmountCents?: number
    chatAmountCents?: number
    giftUnlockAmountCents?: number
    boostAmountCents?: BoostAmounts
    utmifyApiToken?: string
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

  if (typeof body.activeCashinGateway === 'string') {
    // So aceita gateway de cash-in que exista no registro.
    const gw = getCashinGateway(body.activeCashinGateway)
    if (!gw) {
      return NextResponse.json(
        { error: 'Gateway de geração de PIX inválido' },
        { status: 400 }
      )
    }
    patch.activeCashinGateway = gw.id
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

  // Validador reutilizavel para precos de produto (centavos).
  const validateProductCents = (raw: unknown, label: string): number | NextResponse => {
    const cents = Math.round(Number(raw))
    if (!Number.isFinite(cents) || cents < MIN_INVITE_CENTS || cents > MAX_INVITE_CENTS) {
      return NextResponse.json(
        {
          error: `${label} inválido. Deve estar entre R$ ${(MIN_INVITE_CENTS / 100).toFixed(
            2
          )} e R$ ${(MAX_INVITE_CENTS / 100).toFixed(2)}.`,
        },
        { status: 400 }
      )
    }
    return cents
  }

  if (body.chatAmountCents !== undefined) {
    const res = validateProductCents(body.chatAmountCents, 'Valor do chat')
    if (res instanceof NextResponse) return res
    patch.chatAmountCents = res
  }

  if (body.withdrawalVerificationAmountCents !== undefined) {
    const res = validateProductCents(
      body.withdrawalVerificationAmountCents,
      'Valor da verificação de saque',
    )
    if (res instanceof NextResponse) return res
    patch.withdrawalVerificationAmountCents = res
  }

  if (body.giftUnlockAmountCents !== undefined) {
    const res = validateProductCents(body.giftUnlockAmountCents, 'Valor dos presentes')
    if (res instanceof NextResponse) return res
    patch.giftUnlockAmountCents = res
  }

  if (body.boostAmountCents !== undefined && body.boostAmountCents !== null) {
    if (typeof body.boostAmountCents !== 'object') {
      return NextResponse.json({ error: 'Planos de impulsionamento inválidos' }, { status: 400 })
    }
    const boost: BoostAmounts = {}
    for (const day of BOOST_DAYS) {
      const raw = body.boostAmountCents[String(day)]
      if (raw === undefined) continue
      const res = validateProductCents(raw, `Plano de ${day} dias`)
      if (res instanceof NextResponse) return res
      boost[String(day)] = res
    }
    if (Object.keys(boost).length > 0) {
      patch.boostAmountCents = boost
    }
  }

  if (body.utmifyApiToken !== undefined) {
    if (typeof body.utmifyApiToken !== 'string') {
      return NextResponse.json({ error: 'Token da Utmify inválido' }, { status: 400 })
    }
    const token = body.utmifyApiToken.trim()
    if (token.length > 300) {
      return NextResponse.json({ error: 'Token da Utmify muito longo' }, { status: 400 })
    }
    patch.utmifyApiToken = token
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
  const cashinGateways = listCashinGatewayMeta()
  return NextResponse.json({ settings, gateways, cashinGateways })
}
