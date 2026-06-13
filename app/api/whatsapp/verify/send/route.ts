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

  // Verificação desligada OU Z-API não configurada: pula a etapa do código.
  if (!cfg.verificationEnabled || !isConfigured(cfg)) {
    return NextResponse.json({ skipped: true })
  }

  const message = buildVerificationMessage(cfg)

  let result: { ok: boolean; error?: string }
  try {
    result = await sendText(cfg, phone, message)
  } catch (err) {
    // Falha inesperada ao falar com a Z-API: não bloqueia o cadastro.
    console.log('[v0] Falha ao enviar código WhatsApp:', (err as Error)?.message)
    return NextResponse.json({ skipped: true })
  }

  await appendMessageLog({
    phone,
    message,
    status: result.ok ? 'sent' : 'failed',
    error: result.ok ? null : result.error || null,
  })

  // Se a Z-API recusou o envio (desconectada, número inválido na instância, etc.),
  // seguimos o cadastro sem pedir código em vez de travar o usuário.
  if (!result.ok) {
    return NextResponse.json({ skipped: true })
  }

  return NextResponse.json({ success: true })
}
