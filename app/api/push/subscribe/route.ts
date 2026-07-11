import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type SubscriptionBody = {
  endpoint?: string
  keys?: { p256dh?: string; auth?: string }
}

// Salva (ou atualiza) a inscricao Web Push do dispositivo da CRIADORA logada.
export async function POST(request: NextRequest) {
  const supabaseAuth = await createClient()
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser()

  if (!user) {
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

  // Usa a service role para gravar (a RLS protege o acesso direto do cliente).
  const supabase = createAdminClient()
  const userAgent = request.headers.get('user-agent') || null

  const { error } = await supabase.from('user_push_subscriptions').upsert(
    {
      user_id: user.id,
      endpoint,
      p256dh,
      auth,
      user_agent: userAgent,
    },
    { onConflict: 'endpoint' },
  )

  if (error) {
    console.log('[v0] Push subscribe (user): erro ao salvar inscricao:', error.message)
    return NextResponse.json({ error: 'falha ao salvar inscricao' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

// Remove a inscricao (ao desativar notificacoes).
export async function DELETE(request: NextRequest) {
  const supabaseAuth = await createClient()
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser()

  if (!user) {
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
    .from('user_push_subscriptions')
    .delete()
    .eq('endpoint', body.endpoint)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: 'falha ao remover inscricao' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
