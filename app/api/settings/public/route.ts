import { NextResponse } from 'next/server'
import { getAppSettings } from '@/lib/settings'

export const dynamic = 'force-dynamic'

/**
 * Configuracoes publicas consumidas pelo fluxo de cadastro.
 * Expoe apenas o necessario: se a etapa de verificacao esta ativa
 * e o valor exibido. NUNCA expoe gateway, segredos ou credenciais.
 */
export async function GET() {
  const settings = await getAppSettings()

  return NextResponse.json({
    verificationEnabled: settings.verificationEnabled,
    verificationAmountCents: settings.verificationAmountCents,
    inviteAmountCents: settings.inviteAmountCents,
    chatAmountCents: settings.chatAmountCents,
    giftUnlockAmountCents: settings.giftUnlockAmountCents,
    boostAmountCents: settings.boostAmountCents,
  })
}
