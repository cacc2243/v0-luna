import { NextRequest, NextResponse } from 'next/server'
import { getZapiConfig } from '@/lib/whatsapp/zapi'

export const dynamic = 'force-dynamic'

/**
 * Valida o código de verificação digitado no cadastro contra o código
 * configurado no painel. A comparação acontece SEMPRE no servidor — o código
 * nunca é exposto ao cliente.
 */
export async function POST(req: NextRequest) {
  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const code = typeof body?.code === 'string' ? body.code.trim() : ''
  if (!code) {
    return NextResponse.json({ valid: false, error: 'Informe o código.' }, { status: 400 })
  }

  const cfg = await getZapiConfig()

  // Se a verificação estiver desligada, qualquer tentativa é considerada válida.
  if (!cfg.verificationEnabled) {
    return NextResponse.json({ valid: true })
  }

  const valid = code === cfg.verificationCode

  return NextResponse.json({ valid })
}
