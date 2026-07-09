import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// POST /api/admin/balance  { userId, balance }
// Define o saldo (coluna profiles.balance) de uma usuaria para o valor informado.
export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  let body: { userId?: string; balance?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 })
  }

  const { userId } = body
  if (!userId || typeof userId !== 'string') {
    return NextResponse.json({ error: 'Parâmetro userId ausente' }, { status: 400 })
  }

  // Aceita number ou string ("123,45" / "123.45") e normaliza para 2 casas.
  const raw = body.balance
  const parsed =
    typeof raw === 'number'
      ? raw
      : Number(String(raw ?? '').replace(/\s/g, '').replace(',', '.'))

  if (!Number.isFinite(parsed)) {
    return NextResponse.json({ error: 'Valor de saldo inválido' }, { status: 400 })
  }
  if (parsed < 0) {
    return NextResponse.json({ error: 'O saldo não pode ser negativo' }, { status: 400 })
  }

  const balance = Math.round(parsed * 100) / 100

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('profiles')
    .update({ balance })
    .eq('id', userId)
    .select('id, balance')
    .maybeSingle()

  if (error) {
    console.error('[v0] Erro ao atualizar saldo:', error.message)
    return NextResponse.json({ error: 'Falha ao atualizar o saldo' }, { status: 500 })
  }
  if (!data) {
    return NextResponse.json({ error: 'Usuária não encontrada' }, { status: 404 })
  }

  return NextResponse.json({ success: true, balance: data.balance })
}
