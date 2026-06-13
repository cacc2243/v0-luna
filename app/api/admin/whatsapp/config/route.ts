import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import { getZapiConfig, saveZapiConfig, toPublicConfig } from '@/lib/whatsapp/zapi'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  const cfg = await getZapiConfig()
  return NextResponse.json({ config: toPublicConfig(cfg) })
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
    instanceId?: string
    instanceToken?: string
    clientToken?: string
    testMessage?: string
  } = {}

  if (typeof body.instanceId === 'string') patch.instanceId = body.instanceId
  // Tokens só são atualizados quando enviados não-vazios (evita apagar ao salvar config sem reescrever segredo).
  if (typeof body.instanceToken === 'string' && body.instanceToken.trim().length > 0) {
    patch.instanceToken = body.instanceToken
  }
  if (typeof body.clientToken === 'string' && body.clientToken.trim().length > 0) {
    patch.clientToken = body.clientToken
  }
  if (typeof body.testMessage === 'string') {
    if (body.testMessage.length > 2000) {
      return NextResponse.json({ error: 'Mensagem muito longa' }, { status: 400 })
    }
    patch.testMessage = body.testMessage
  }

  try {
    await saveZapiConfig(patch)
  } catch (e: any) {
    console.error('[v0] Erro ao salvar config Z-API:', e?.message)
    return NextResponse.json({ error: 'Falha ao salvar configuração' }, { status: 500 })
  }

  const cfg = await getZapiConfig()
  return NextResponse.json({ config: toPublicConfig(cfg) })
}
