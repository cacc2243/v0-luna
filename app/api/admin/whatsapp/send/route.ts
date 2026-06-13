import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  getZapiConfig,
  isConfigured,
  sendText,
  normalizePhone,
} from '@/lib/whatsapp/zapi'

export const dynamic = 'force-dynamic'

/** Lista o histórico das últimas mensagens enviadas. */
export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('whatsapp_messages')
    .select('id, phone, message, status, error, created_at')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('[v0] Erro ao listar mensagens WhatsApp:', error.message)
    return NextResponse.json({ messages: [] })
  }

  return NextResponse.json({ messages: data || [] })
}

/** Envia uma mensagem de teste e grava no histórico. */
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

  const phone = normalizePhone(String(body.phone || ''))
  const message = String(body.message || '').trim()

  if (phone.length < 12 || phone.length > 15) {
    return NextResponse.json(
      { error: 'Número inválido. Use DDD + número (ex.: 11999999999).' },
      { status: 400 },
    )
  }
  if (!message) {
    return NextResponse.json({ error: 'A mensagem não pode ficar vazia.' }, { status: 400 })
  }

  const cfg = await getZapiConfig()
  if (!isConfigured(cfg)) {
    return NextResponse.json({ error: 'Configure a Z-API primeiro.' }, { status: 400 })
  }

  const result = await sendText(cfg, phone, message)
  const supabase = createAdminClient()

  await supabase.from('whatsapp_messages').insert({
    phone,
    message,
    status: result.ok ? 'sent' : 'failed',
    zaap_id: result.zaapId || null,
    message_id: result.messageId || null,
    error: result.ok ? null : result.error || null,
  })

  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: 502 })
  }

  return NextResponse.json({ success: true, messageId: result.messageId })
}
