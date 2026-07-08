import { NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import { sendAdminPush, isPushConfigured } from '@/lib/push/web-push'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Envia uma notificacao de teste para todos os dispositivos inscritos.
export async function POST() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'nao autorizado' }, { status: 401 })
  }

  if (!isPushConfigured()) {
    return NextResponse.json(
      { error: 'Push nao configurado. Defina VAPID_PUBLIC_KEY e VAPID_PRIVATE_KEY.' },
      { status: 503 },
    )
  }

  const result = await sendAdminPush({
    title: 'Luna Privé — Notificação de teste',
    body: 'Tudo certo! Você receberá alertas de novas vendas aqui.',
    url: '/painel',
    tag: 'teste',
  })

  return NextResponse.json({ success: true, ...result })
}
