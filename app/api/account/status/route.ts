import { createAdminClient } from '@/lib/supabase/admin'
import { DEFAULT_BAN_REASON } from '@/lib/painel/ban-reasons'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

function isBanned(bannedUntil: string | null | undefined): boolean {
  if (!bannedUntil) return false
  const t = new Date(bannedUntil).getTime()
  return Number.isFinite(t) && t > Date.now()
}

// POST /api/account/status  { email }  -> { banned, reason }
// Endpoint publico consumido pela tela de login para explicar, quando a conta
// esta banida, o motivo do bloqueio. Retorna apenas o minimo necessario.
export async function POST(req: Request) {
  let body: { email?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 })
  }

  const email = (body.email || '').toString().trim().toLowerCase()
  if (!email) {
    return NextResponse.json({ banned: false })
  }

  const supabase = createAdminClient()

  // Procura o usuario de auth pelo email (paginado).
  let target:
    | { banned_until?: string | null; app_metadata?: { ban_reason?: string | null } }
    | undefined
  let page = 1
  const perPage = 1000
  while (page <= 20) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage })
    if (error) {
      console.error('[v0] Erro ao listar auth users (status):', error)
      break
    }
    const users = data?.users || []
    target = users.find((u) => (u.email || '').toLowerCase() === email) as typeof target
    if (target) break
    if (users.length < perPage) break
    page++
  }

  const banned = isBanned((target as { banned_until?: string | null } | undefined)?.banned_until)
  const reason = banned
    ? target?.app_metadata?.ban_reason || DEFAULT_BAN_REASON
    : null

  return NextResponse.json({ banned, reason })
}
