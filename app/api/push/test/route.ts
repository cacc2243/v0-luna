import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendUserPush } from '@/lib/push/web-push'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Envia uma notificacao de teste para os dispositivos da criadora logada.
export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'nao autorizado' }, { status: 401 })
  }

  const result = await sendUserPush(user.id, {
    title: 'Luna Privé',
    body: 'Tudo certo! Você vai receber um alerta a cada nova venda. 💜',
    url: '/minha-conta',
    tag: 'teste',
  })

  return NextResponse.json({ success: true, ...result })
}
