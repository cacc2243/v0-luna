import { NextRequest, NextResponse } from 'next/server'
import {
  getZapiConfig,
  isConfigured,
  sendText,
  normalizePhone,
  buildVerificationMessage,
  appendMessageLog,
} from '@/lib/whatsapp/zapi'

export const dynamic = 'force-dynamic'

/**
 * Envia o código de verificação por WhatsApp para o número informado no cadastro.
 * O código em si NUNCA é retornado ao cliente — apenas enviado via WhatsApp.
 */
export async function POST(req: NextRequest) {
  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const phoneRaw = typeof body?.phone === 'string' ? body.phone : ''
  const phone = normalizePhone(phoneRaw)

  if (phone.replace(/\D/g, '').length < 12) {
    return NextResponse.json({ error: 'Número de telefone inválido.' }, { status: 400 })
  }

  const cfg = await getZapiConfig()

  // Se a verificação estiver desligada, sinaliza ao cliente para pular a etapa.
  if (!cfg.verificationEnabled) {
    return NextResponse.json({ skipped: true })
  }

  if (!isConfigured(cfg)) {
    return NextResponse.json(
      { error: 'Verificação por WhatsApp indisponível no momento.' },
      { status: 503 },
    )
  }

  const message = buildVerificationMessage(cfg)
  const result = await sendText(cfg, phone, message)

  await appendMessageLog({
    phone,
    message,
    status: result.ok ? 'sent' : 'failed',
    error: result.ok ? null : result.error || null,
  })

  if (!result.ok) {
    return NextResponse.json(
      { error: 'Não foi possível enviar o código. Verifique o número e tente novamente.' },
      { status: 502 },
    )
  }

  return NextResponse.json({ success: true })
}
