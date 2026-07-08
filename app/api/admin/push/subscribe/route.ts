import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type SubscriptionBody = {
  endpoint?: string
  keys?: { p256dh?: string; auth?: string }
}

// Salva (ou atualiza) a inscricao Web Push do dispositivo do admin.
export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'nao autorizado' }, { status: 401 })
  }

  let body: SubscriptionBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'json invalido' }, { status: 400 })
  }

  const endpoint = body.endpoint
  const p256dh = body.keys?.p256dh
  const auth = body.keys?.auth

  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: 'inscricao incompleta' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const userAgent = request.headers.get('user-agent') || null

  const { error } = await supabase.from('admin_push_subscriptions').upsert(
    {
      endpoint,
      p256dh,
      auth,
      user_agent: userAgent,
    },
    { onConflict: 'endpoint' },
  )

  if (error) {
    console.log('[v0] Push subscribe: erro ao salvar inscricao:', error.message)
    return NextResponse.json({ error: 'falha ao salvar inscricao' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

// Remove a inscricao (ao desativar notificacoes).
export async function DELETE(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'nao autorizado' }, { status: 401 })
  }

  let body: SubscriptionBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'json invalido' }, { status: 400 })
  }

  if (!body.endpoint) {
    return NextResponse.json({ error: 'endpoint obrigatorio' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('admin_push_subscriptions')
    .delete()
    .eq('endpoint', body.endpoint)

  if (error) {
    return NextResponse.json({ error: 'falha ao remover inscricao' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
