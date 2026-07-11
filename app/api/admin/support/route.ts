import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export interface AdminSupportMessage {
  id: string
  ticket_id: string
  user_id: string
  is_from_support: boolean
  content: string
  created_at: string
}

export interface AdminSupportTicket {
  id: string
  user_id: string
  subject: string
  status: 'open' | 'answered' | 'closed'
  last_message: string | null
  last_message_at: string
  created_at: string
  // Enriquecido no servidor:
  email: string | null
  username: string | null
  display_name: string | null
  message_count: number
}

// Mapa id -> dados de perfil/auth para exibir quem abriu o ticket.
async function buildUserLookup(
  supabase: ReturnType<typeof createAdminClient>,
  userIds: string[],
) {
  const uniqueIds = Array.from(new Set(userIds))
  const emailMap = new Map<string, string | null>()
  const profileMap = new Map<string, { username: string | null; display_name: string | null }>()

  if (uniqueIds.length === 0) return { emailMap, profileMap }

  // Perfis (username / nome de exibição)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, display_name')
    .in('id', uniqueIds)

  for (const p of profiles || []) {
    profileMap.set(p.id, { username: p.username ?? null, display_name: p.display_name ?? null })
  }

  // E-mails da tabela de auth (busca individual — poucos usuários por lista de tickets)
  await Promise.all(
    uniqueIds.map(async (id) => {
      try {
        const { data } = await supabase.auth.admin.getUserById(id)
        emailMap.set(id, data?.user?.email ?? null)
      } catch {
        emailMap.set(id, null)
      }
    }),
  )

  return { emailMap, profileMap }
}

// GET /api/admin/support           -> lista todos os tickets (enriquecidos)
// GET /api/admin/support?ticketId  -> mensagens de um ticket específico
export async function GET(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const ticketId = searchParams.get('ticketId')
  const supabase = createAdminClient()

  // Mensagens de um ticket
  if (ticketId) {
    const { data, error } = await supabase
      .from('support_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('[v0] admin support messages error:', error.message)
      return NextResponse.json({ error: 'Falha ao carregar mensagens' }, { status: 500 })
    }
    return NextResponse.json({ messages: (data || []) as AdminSupportMessage[] })
  }

  // Lista de tickets
  const { data: tickets, error } = await supabase
    .from('support_tickets')
    .select('*')
    .order('last_message_at', { ascending: false })

  if (error) {
    console.error('[v0] admin support tickets error:', error.message)
    return NextResponse.json({ error: 'Falha ao carregar tickets' }, { status: 500 })
  }

  const rows = tickets || []
  const { emailMap, profileMap } = await buildUserLookup(
    supabase,
    rows.map((t) => t.user_id),
  )

  // Contagem de mensagens por ticket
  const countMap = new Map<string, number>()
  const { data: allMsgs } = await supabase.from('support_messages').select('ticket_id')
  for (const m of allMsgs || []) {
    countMap.set(m.ticket_id, (countMap.get(m.ticket_id) || 0) + 1)
  }

  const enriched: AdminSupportTicket[] = rows.map((t) => {
    const profile = profileMap.get(t.user_id)
    return {
      id: t.id,
      user_id: t.user_id,
      subject: t.subject,
      status: t.status,
      last_message: t.last_message,
      last_message_at: t.last_message_at,
      created_at: t.created_at,
      email: emailMap.get(t.user_id) ?? null,
      username: profile?.username ?? null,
      display_name: profile?.display_name ?? null,
      message_count: countMap.get(t.id) || 0,
    }
  })

  return NextResponse.json({
    tickets: enriched,
    total: enriched.length,
    openCount: enriched.filter((t) => t.status !== 'closed').length,
    fetchedAt: new Date().toISOString(),
  })
}

// POST /api/admin/support  { ticketId, message }  -> resposta do suporte
export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  let body: { ticketId?: string; message?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 })
  }

  const ticketId = (body.ticketId || '').trim()
  const content = (body.message || '').trim()
  if (!ticketId || !content) {
    return NextResponse.json({ error: 'Ticket e mensagem são obrigatórios' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Descobre o dono do ticket (a coluna user_id das mensagens é NOT NULL).
  const { data: ticket, error: ticketErr } = await supabase
    .from('support_tickets')
    .select('id, user_id')
    .eq('id', ticketId)
    .single()

  if (ticketErr || !ticket) {
    return NextResponse.json({ error: 'Ticket não encontrado' }, { status: 404 })
  }

  const { data: inserted, error: msgErr } = await supabase
    .from('support_messages')
    .insert({
      ticket_id: ticketId,
      user_id: ticket.user_id,
      is_from_support: true,
      content,
    })
    .select('*')
    .single()

  if (msgErr) {
    console.error('[v0] admin support reply error:', msgErr.message)
    return NextResponse.json({ error: 'Falha ao enviar resposta' }, { status: 500 })
  }

  // Marca o ticket como respondido e atualiza o preview.
  await supabase
    .from('support_tickets')
    .update({
      last_message: content,
      last_message_at: new Date().toISOString(),
      status: 'answered',
    })
    .eq('id', ticketId)

  return NextResponse.json({ success: true, message: inserted as AdminSupportMessage })
}

// PATCH /api/admin/support  { ticketId, status }  -> abrir/encerrar ticket
export async function PATCH(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  let body: { ticketId?: string; status?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 })
  }

  const ticketId = (body.ticketId || '').trim()
  const status = body.status
  if (!ticketId || (status !== 'open' && status !== 'answered' && status !== 'closed')) {
    return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('support_tickets')
    .update({ status })
    .eq('id', ticketId)

  if (error) {
    console.error('[v0] admin support status error:', error.message)
    return NextResponse.json({ error: 'Falha ao atualizar o ticket' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
