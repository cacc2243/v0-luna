import { NextResponse } from 'next/server'
import { getAppSettings } from '@/lib/settings'
import { getZapiConfig, isConfigured } from '@/lib/whatsapp/zapi'

export const dynamic = 'force-dynamic'

/**
 * Configuracoes publicas consumidas pelo fluxo de cadastro.
 * Expoe apenas o necessario: se a etapa de verificacao esta ativa
 * e o valor exibido. NUNCA expoe gateway, segredos ou credenciais.
 */
export async function GET() {
  const [settings, zapi] = await Promise.all([getAppSettings(), getZapiConfig()])

  // Verificacao por WhatsApp so vale se estiver ligada E a Z-API configurada.
  const whatsappVerificationEnabled = zapi.verificationEnabled && isConfigured(zapi)

  return NextResponse.json({
    verificationEnabled: settings.verificationEnabled,
    verificationAmountCents: settings.verificationAmountCents,
    withdrawalVerificationAmountCents: settings.withdrawalVerificationAmountCents,
    inviteAmountCents: settings.inviteAmountCents,
    chatAmountCents: settings.chatAmountCents,
    giftUnlockAmountCents: settings.giftUnlockAmountCents,
    boostAmountCents: settings.boostAmountCents,
    whatsappVerificationEnabled,
  })
}
