import { NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

/**
 * MED (Mediação de Disputa) — consolida, para cada COMPRA PAGA, todas as
 * evidências de entrega e uso do produto, úteis para contestar chargebacks /
 * mediações (MED) junto ao adquirente:
 *  - o e-mail de acesso à plataforma foi entregue e recebido;
 *  - a cliente logou na plataforma (last_sign_in do Supabase Auth);
 *  - a conta está ativa (e-mail confirmado e não banida);
 *  - IP de origem, dispositivo, nome de usuário cadastrado e e-mail.
 *
 * Os nomes reais dos produtos NÃO são expostos: toda compra é descrita de forma
 * genérica ("Acesso à plataforma digital").
 */

interface InviteRow {
  id: string
  user_id: string | null
  email: string | null
  amount: number | null
  status: string | null
  type: string | null
  transaction_id: string | null
  gateway: string | null
  client_ip: string | null
  client_ua: string | null
  created_at: string
  paid_at: string | null
  invite_paid_email_sent: boolean | null
  payer_name: string | null
  payer_document: string | null
  end_to_end_id: string | null
  payment_reference: string | null
  payment_authentication: string | null
}

/** Formata um CPF (11 dígitos) como 000.000.000-00; devolve o valor original se não casar. */
function formatCpf(doc: string | null): string | null {
  if (!doc) return null
  const d = doc.replace(/\D/g, '')
  if (d.length === 11) return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  if (d.length === 14) return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  return doc
}

interface EmailLogRow {
  recipient: string | null
  template_id: string | null
  status: string | null
  provider_id: string | null
  created_at: string
}

interface AuthMeta {
  id: string
  email: string | null
  lastSignInAt: string | null
  emailConfirmedAt: string | null
  banned: boolean
  createdAt: string | null
}

function isBanned(bannedUntil: string | null | undefined): boolean {
  if (!bannedUntil) return false
  const t = new Date(bannedUntil).getTime()
  return Number.isFinite(t) && t > Date.now()
}

function norm(email: string | null | undefined): string {
  return (email || '').trim().toLowerCase()
}

// Descrição genérica da compra — não revela o nome real do produto.
function genericProduct(): string {
  return 'Acesso à plataforma digital'
}

/** Lista todos os usuários do Auth, indexados por id e por e-mail. */
async function loadAuth(supabase: ReturnType<typeof createAdminClient>) {
  const byId = new Map<string, AuthMeta>()
  const byEmail = new Map<string, AuthMeta>()
  const perPage = 1000
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage })
    if (error) {
      console.error('[v0] MED: erro ao listar auth users:', error.message)
      break
    }
    const users = data?.users || []
    for (const u of users) {
      const bannedUntil = (u as { banned_until?: string | null }).banned_until ?? null
      const meta: AuthMeta = {
        id: u.id,
        email: u.email ?? null,
        lastSignInAt: u.last_sign_in_at ?? null,
        emailConfirmedAt:
          (u as { email_confirmed_at?: string | null }).email_confirmed_at ??
          (u as { confirmed_at?: string | null }).confirmed_at ??
          null,
        banned: isBanned(bannedUntil),
        createdAt: u.created_at ?? null,
      }
      byId.set(u.id, meta)
      const e = norm(u.email)
      if (e) byEmail.set(e, meta)
    }
    if (users.length < perPage) break
  }
  return { byId, byEmail }
}

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const supabase = createAdminClient()

  // Log de e-mails de acesso: a tabela pode não existir em bases antigas, então
  // isolamos numa função que nunca lança e devolve lista vazia em falha.
  async function loadAccessEmailLogs(): Promise<EmailLogRow[]> {
    try {
      const { data, error } = await supabase
        .from('email_logs')
        .select('recipient, template_id, status, provider_id, created_at')
        .eq('template_id', 'invite_paid')
        .order('created_at', { ascending: false })
        .limit(2000)
      if (error) return []
      return (data || []) as EmailLogRow[]
    } catch {
      return []
    }
  }

  const [invitesRes, profilesRes, emailLogs, auth] = await Promise.all([
    supabase
      .from('invites')
      .select(
        'id, user_id, email, amount, status, type, transaction_id, gateway, client_ip, client_ua, created_at, paid_at, invite_paid_email_sent, payer_name, payer_document, end_to_end_id, payment_reference, payment_authentication',
      )
      .eq('status', 'paid')
      .order('paid_at', { ascending: false })
      .limit(1000),
    supabase.from('profiles').select('id, username, display_name'),
    loadAccessEmailLogs(),
    loadAuth(supabase),
  ])

  if (invitesRes.error) {
    console.error('[v0] MED: erro ao buscar invites:', invitesRes.error)
    return NextResponse.json({ error: 'Erro ao buscar compras' }, { status: 500 })
  }

  const invites = (invitesRes.data || []) as InviteRow[]
  const profiles = (profilesRes.data || []) as {
    id: string
    username: string | null
    display_name: string | null
  }[]

  const profileById = new Map(profiles.map((p) => [p.id, p]))

  // Melhor log de e-mail de acesso por destinatário (prioriza status "sent").
  const accessEmailByRecipient = new Map<string, EmailLogRow>()
  for (const log of emailLogs) {
    const key = norm(log.recipient)
    if (!key) continue
    const existing = accessEmailByRecipient.get(key)
    if (!existing) {
      accessEmailByRecipient.set(key, log)
    } else if (existing.status !== 'sent' && log.status === 'sent') {
      // Substitui um log não enviado por um enviado (evidência mais forte).
      accessEmailByRecipient.set(key, log)
    }
  }

  const cases = invites.map((inv) => {
    const emailKey = norm(inv.email)
    const authMeta =
      (inv.user_id ? auth.byId.get(inv.user_id) : undefined) ||
      (emailKey ? auth.byEmail.get(emailKey) : undefined) ||
      null

    const profile =
      (inv.user_id ? profileById.get(inv.user_id) : undefined) ||
      (authMeta?.id ? profileById.get(authMeta.id) : undefined) ||
      null

    const accessLog =
      (emailKey ? accessEmailByRecipient.get(emailKey) : undefined) || null
    const accessDelivered =
      (accessLog?.status === 'sent' && Boolean(accessLog?.provider_id)) ||
      Boolean(inv.invite_paid_email_sent)

    const lastSignInAt = authMeta?.lastSignInAt ?? null
    const loggedIn = Boolean(lastSignInAt)
    const paidAtMs = inv.paid_at ? new Date(inv.paid_at).getTime() : null
    const loggedInAfterPurchase =
      Boolean(lastSignInAt && paidAtMs && new Date(lastSignInAt).getTime() >= paidAtMs)

    const emailConfirmed = Boolean(authMeta?.emailConfirmedAt)
    const hasAccount = Boolean(authMeta || profile)
    const accountActive = hasAccount && !authMeta?.banned && (emailConfirmed || loggedIn)

    // Pontuação de evidências (0..5) para ordenar casos mais "defensáveis".
    const evidenceScore =
      (accessDelivered ? 1 : 0) +
      (loggedIn ? 1 : 0) +
      (accountActive ? 1 : 0) +
      (inv.client_ip ? 1 : 0) +
      (profile?.username ? 1 : 0)

    return {
      id: inv.id,
      transactionId: inv.transaction_id,
      product: genericProduct(),
      amount: Number(inv.amount) || 0,
      gateway: inv.gateway,
      createdAt: inv.created_at,
      paidAt: inv.paid_at,
      // Identificação do pagamento (varia por adquirente)
      payment: {
        endToEndId: inv.end_to_end_id || null,
        reference: inv.payment_reference || null,
        authentication: inv.payment_authentication || null,
        payerName: inv.payer_name || null,
        payerDocument: formatCpf(inv.payer_document),
      },
      // Identidade
      email: inv.email || authMeta?.email || null,
      username: profile?.username || null,
      displayName: profile?.display_name || null,
      hasAccount,
      clientIp: inv.client_ip || null,
      clientUa: inv.client_ua || null,
      // Evidências
      accessEmail: {
        delivered: accessDelivered,
        status: accessLog?.status ?? (inv.invite_paid_email_sent ? 'sent' : null),
        providerId: accessLog?.provider_id ?? null,
        sentAt: accessLog?.created_at ?? null,
      },
      login: {
        loggedIn,
        lastSignInAt,
        loggedInAfterPurchase,
      },
      account: {
        active: accountActive,
        emailConfirmed,
        banned: Boolean(authMeta?.banned),
      },
      evidenceScore,
    }
  })

  const totals = {
    total: cases.length,
    fullyDocumented: cases.filter((c) => c.evidenceScore >= 5).length,
    accessDelivered: cases.filter((c) => c.accessEmail.delivered).length,
    loggedIn: cases.filter((c) => c.login.loggedIn).length,
    withIp: cases.filter((c) => c.clientIp).length,
  }

  return NextResponse.json({ cases, totals, fetchedAt: new Date().toISOString() })
}
