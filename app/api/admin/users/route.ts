import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Duracao de banimento "permanente" (100 anos em horas).
const BAN_FOREVER = '876000h'

export interface AdminUser {
  id: string
  email: string | null
  username: string | null
  displayName: string | null
  createdAt: string | null
  balance: number | null
  totalEarned: number | null
  banned: boolean
  bannedUntil: string | null
  banReason: string | null
}

interface ProfileRow {
  id: string
  username: string | null
  display_name: string | null
  created_at: string | null
  balance: number | null
  total_earned: number | null
}

// Busca todos os usuarios de auth (paginado) para obter email e status de banimento.
async function listAllAuthUsers(supabase: ReturnType<typeof createAdminClient>) {
  const all: {
    id: string
    email: string | null
    banned_until?: string | null
    ban_reason?: string | null
    created_at?: string
  }[] = []
  let page = 1
  const perPage = 1000
  // Limite de seguranca de paginas para nao rodar indefinidamente.
  while (page <= 20) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage })
    if (error) {
      console.error('[v0] Erro ao listar auth users:', error)
      break
    }
    const users = data?.users || []
    for (const u of users) {
      all.push({
        id: u.id,
        email: u.email ?? null,
        // banned_until existe no objeto retornado pela Admin API
        banned_until: (u as { banned_until?: string | null }).banned_until ?? null,
        ban_reason: (u.app_metadata as { ban_reason?: string | null } | undefined)?.ban_reason ?? null,
        created_at: u.created_at,
      })
    }
    if (users.length < perPage) break
    page++
  }
  return all
}

function isBanned(bannedUntil: string | null | undefined): boolean {
  if (!bannedUntil) return false
  const t = new Date(bannedUntil).getTime()
  return Number.isFinite(t) && t > Date.now()
}

// GET /api/admin/users?q=termo  -> busca por email, username ou nome
export async function GET(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const q = (searchParams.get('q') || '').trim().toLowerCase()

  const supabase = createAdminClient()

  const [profilesRes, authUsers] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, username, display_name, created_at, balance, total_earned')
      .order('created_at', { ascending: false }),
    listAllAuthUsers(supabase),
  ])

  if (profilesRes.error) {
    console.error('[v0] Erro ao buscar profiles:', profilesRes.error)
  }

  const profiles = (profilesRes.data || []) as ProfileRow[]
  const profileMap = new Map(profiles.map((p) => [p.id, p]))
  const authMap = new Map(authUsers.map((u) => [u.id, u]))

  // Uniao de ids (alguns profiles podem nao ter auth e vice-versa)
  const ids = new Set<string>([...profileMap.keys(), ...authMap.keys()])

  const users: AdminUser[] = []
  for (const id of ids) {
    const p = profileMap.get(id)
    const a = authMap.get(id)
    users.push({
      id,
      email: a?.email ?? null,
      username: p?.username ?? null,
      displayName: p?.display_name ?? null,
      createdAt: p?.created_at ?? a?.created_at ?? null,
      balance: p?.balance ?? null,
      totalEarned: p?.total_earned ?? null,
      banned: isBanned(a?.banned_until),
      bannedUntil: a?.banned_until ?? null,
      banReason: isBanned(a?.banned_until) ? a?.ban_reason ?? null : null,
    })
  }

  const filtered = q
    ? users.filter(
        (u) =>
          (u.email || '').toLowerCase().includes(q) ||
          (u.username || '').toLowerCase().includes(q) ||
          (u.displayName || '').toLowerCase().includes(q) ||
          u.id.toLowerCase() === q,
      )
    : users

  filtered.sort((a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0
    return tb - ta
  })

  // Limita o numero de resultados retornados para a UI.
  return NextResponse.json({
    users: filtered.slice(0, 100),
    total: filtered.length,
    fetchedAt: new Date().toISOString(),
  })
}

// POST /api/admin/users  { userId, action: 'ban' | 'unban' }
export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  let body: { userId?: string; action?: string; reason?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 })
  }

  const { userId, action } = body
  if (!userId || (action !== 'ban' && action !== 'unban')) {
    return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 })
  }

  const reason = (body.reason || '').toString().trim().slice(0, 300)

  const supabase = createAdminClient()

  // Ao banir, guardamos o motivo em app_metadata para exibi-lo no login.
  // Ao desbanir, limpamos o motivo.
  const { error } = await supabase.auth.admin.updateUserById(userId, {
    ban_duration: action === 'ban' ? BAN_FOREVER : 'none',
    app_metadata: {
      ban_reason: action === 'ban' ? reason || null : null,
      banned_at: action === 'ban' ? new Date().toISOString() : null,
    },
  })

  if (error) {
    console.error('[v0] Erro ao atualizar banimento:', error)
    return NextResponse.json({ error: 'Falha ao atualizar a conta' }, { status: 500 })
  }

  return NextResponse.json({ success: true, banned: action === 'ban' })
}

// DELETE /api/admin/users  { userId }  -> remove dados vinculados + conta de auth
export async function DELETE(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  let body: { userId?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 })
  }

  const { userId } = body
  if (!userId) {
    return NextResponse.json({ error: 'Parâmetro userId ausente' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Coleta packs do usuario para remover dependencias (pack_images, sales por pack).
  const { data: userPacks } = await supabase.from('packs').select('id').eq('user_id', userId)
  const packIds = (userPacks || []).map((p: { id: string }) => p.id)

  // Coleta conversas do usuario para remover mensagens vinculadas.
  const { data: userConvos } = await supabase
    .from('conversations')
    .select('id')
    .eq('user_id', userId)
  const convoIds = (userConvos || []).map((c: { id: string }) => c.id)

  // Remove dependencias em ordem (filhos antes dos pais). Best-effort por tabela:
  // se uma tabela nao existir, registramos o aviso e seguimos.
  const cleanups: Promise<unknown>[] = []

  if (convoIds.length > 0) {
    cleanups.push(Promise.resolve(supabase.from('messages').delete().in('conversation_id', convoIds)))
  }
  if (packIds.length > 0) {
    cleanups.push(Promise.resolve(supabase.from('pack_images').delete().in('pack_id', packIds)))
    cleanups.push(Promise.resolve(supabase.from('sales').delete().in('pack_id', packIds)))
  }

  await Promise.allSettled(cleanups)

  // Tabelas que referenciam diretamente o usuario.
  const userScoped: { table: string; column: string }[] = [
    { table: 'conversations', column: 'user_id' },
    { table: 'sales', column: 'seller_id' },
    { table: 'packs', column: 'user_id' },
    { table: 'transactions', column: 'user_id' },
    { table: 'withdrawals', column: 'user_id' },
    { table: 'notifications', column: 'user_id' },
    { table: 'followers', column: 'user_id' },
    { table: 'boosts', column: 'user_id' },
    { table: 'highlights', column: 'user_id' },
    { table: 'user_settings', column: 'user_id' },
    { table: 'pix_verifications', column: 'user_id' },
    { table: 'invites', column: 'user_id' },
    { table: 'profiles', column: 'id' },
  ]

  const results = await Promise.allSettled(
    userScoped.map(({ table, column }) =>
      supabase
        .from(table)
        .delete()
        .eq(column, userId)
        .then((res) => {
          if (res.error) console.error(`[v0] Aviso ao limpar ${table}:`, res.error.message)
          return res
        }),
    ),
  )
  void results

  // Por fim, remove a conta de autenticacao.
  const { error: authError } = await supabase.auth.admin.deleteUser(userId)
  if (authError) {
    console.error('[v0] Erro ao excluir conta de auth:', authError)
    return NextResponse.json(
      { error: 'Dados removidos, mas falha ao excluir o login. Tente novamente.' },
      { status: 500 },
    )
  }

  return NextResponse.json({ success: true })
}
