export interface InviteRow {
  id: string
  user_id: string | null
  email: string | null
  amount: number | null
  status: string | null
  type: string | null
  transaction_id: string | null
  pix_code: string | null
  pix_copied_at: string | null
  gateway: string | null
  created_at: string
  paid_at: string | null
  pix_expiration: string | null
}

export interface ProfileRow {
  id: string
  username: string | null
  display_name: string | null
  created_at: string
  chat_unlocked?: boolean | null
  chat_unlocked_at?: string | null
  balance?: number | null
  total_earned?: number | null
}

export interface PixVerificationRow {
  id: string
  user_id: string | null
  email: string | null
  pix_key: string | null
  pix_key_normalized: string | null
  pix_type: string | null
  amount_cents: number | null
  status: string | null
  attempts: number | null
  transaction_id: string | null
  last_error: string | null
  request_ip: string | null
  created_at: string
  updated_at: string | null
}

export type PeriodKey = 'today' | 'yesterday' | '7d' | '14d' | '30d' | 'all'
export type StatusFilter = 'all' | 'paid' | 'pending'

export const PERIOD_LABELS: Record<PeriodKey, string> = {
  today: 'Hoje',
  yesterday: 'Ontem',
  '7d': '7 dias',
  '14d': '14 dias',
  '30d': '30 dias',
  all: 'Tudo',
}

// Fuso horario de referencia: Brasilia / Sao Paulo
export const TIME_ZONE = 'America/Sao_Paulo'

// Calcula o offset (em ms) do fuso de Sao Paulo para uma data UTC.
// Robusto a eventuais mudancas de horario de verao.
function getSpOffsetMs(date: Date): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
  const parts = dtf.formatToParts(date)
  const map: Record<string, number> = {}
  for (const p of parts) {
    if (p.type !== 'literal') map[p.type] = Number(p.value)
  }
  // Instante "como se" os componentes locais de SP fossem UTC
  const asUTC = Date.UTC(
    map.year,
    map.month - 1,
    map.day,
    map.hour === 24 ? 0 : map.hour,
    map.minute,
    map.second,
  )
  return asUTC - date.getTime()
}

// Retorna o inicio do dia (00:00 em Sao Paulo) como instante UTC
export function startOfDaySP(date: Date): Date {
  const offset = getSpOffsetMs(date)
  // Componentes de data em SP
  const spNow = new Date(date.getTime() + offset)
  const y = spNow.getUTCFullYear()
  const m = spNow.getUTCMonth()
  const d = spNow.getUTCDate()
  // 00:00 SP -> subtrai o offset para voltar a UTC
  return new Date(Date.UTC(y, m, d, 0, 0, 0) - offset)
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000)
}

// Retorna [inicio, fim] do periodo selecionado, sempre em horario de Brasilia
export function getPeriodRange(period: PeriodKey): [Date | null, Date | null] {
  const now = new Date()
  const startOfToday = startOfDaySP(now)

  switch (period) {
    case 'today':
      return [startOfToday, now]
    case 'yesterday': {
      const startYesterday = addDays(startOfToday, -1)
      return [startYesterday, startOfToday]
    }
    case '7d':
      return [addDays(startOfToday, -6), now]
    case '14d':
      return [addDays(startOfToday, -13), now]
    case '30d':
      return [addDays(startOfToday, -29), now]
    case 'all':
    default:
      return [null, null]
  }
}

export function isInRange(dateStr: string | null, range: [Date | null, Date | null]): boolean {
  if (!dateStr) return false
  const [start, end] = range
  if (!start || !end) return true
  const d = new Date(dateStr).getTime()
  return d >= start.getTime() && d <= end.getTime()
}

export function isPaid(status: string | null): boolean {
  return status === 'paid'
}

export function isPending(status: string | null): boolean {
  return status === 'pending'
}

// Produtos vendidos na plataforma (alinhados aos tipos de PIX gerados)
export type ProductKey = 'invite' | 'chat' | 'boost' | 'gift' | 'verification'

// Classifica um invite pelo seu tipo. Convites antigos sem tipo (null) ou
// marcados como 'invite' caem em 'invite'.
export function productOf(type: string | null): ProductKey {
  switch (type) {
    case 'chat':
      return 'chat'
    case 'boost':
      return 'boost'
    case 'gift_unlock':
      return 'gift'
    case 'verification':
      return 'verification'
    default:
      return 'invite'
  }
}

// Metadados de exibicao de cada produto (rotulo + unidade de contagem)
export const PRODUCT_META: Record<ProductKey, { label: string; unit: string; unitPlural: string }> = {
  invite: { label: 'Convite', unit: 'venda', unitPlural: 'vendas' },
  chat: { label: 'Chat Exclusivo', unit: 'desbloqueio', unitPlural: 'desbloqueios' },
  boost: { label: 'Impulsionamento', unit: 'impulso', unitPlural: 'impulsos' },
  gift: { label: 'Habilitação de Presentes', unit: 'ativação', unitPlural: 'ativações' },
  verification: { label: 'Verificação de Saque', unit: 'verificação', unitPlural: 'verificações' },
}

export const PRODUCT_ORDER: ProductKey[] = ['invite', 'chat', 'boost', 'gift', 'verification']

// Tipo de pagamento de um invite: 'chat' = Chat Exclusivo, qualquer outro = convite
export function isChatInvite(type: string | null): boolean {
  return type === 'chat'
}

// Considera "convite" apenas os tipos de convite propriamente ditos (inclui
// legados sem tipo). Boost, presentes e verificacao NAO sao convite.
export function isInviteType(type: string | null): boolean {
  return productOf(type) === 'invite'
}

// Valor padrao do Chat Exclusivo
export const CHAT_PRICE = 99.0

export function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

export function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('pt-BR', {
    timeZone: TIME_ZONE,
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Metadados dos gateways de cash-in conhecidos. Mantem rotulo amigavel para o
// painel mesmo quando ainda nao houve nenhuma transacao com aquele gateway.
export const GATEWAY_META: Record<string, { label: string }> = {
  bynet: { label: 'Bynet' },
  sigilopay: { label: 'SigiloPay' },
}

export function gatewayLabel(id: string | null): string {
  if (!id) return 'Não identificado'
  return GATEWAY_META[id]?.label ?? id
}

// Estatistica de desempenho de um gateway no periodo selecionado.
export interface GatewayStat {
  id: string
  label: string
  /** Total de cobrancas geradas pelo gateway no periodo. */
  generated: number
  /** Cobrancas pagas (PIX confirmado). */
  paid: number
  /** Receita confirmada via este gateway. */
  revenue: number
  /** % de conversao: geraram PIX -> pagaram. */
  conversionRate: number
  /** Se este e o gateway ativo configurado no painel. */
  active: boolean
}

export interface DashboardMetrics {
  clientsCount: number
  revenue: number
  pendingRevenue: number
  paidCount: number
  generatedCount: number
  copiedCount: number
  pendingCount: number
  conversionRate: number
  avgTicket: number
  // Receita separada por produto
  inviteRevenue: number
  chatRevenue: number
  invitePaidCount: number
  chatPaidCount: number
  // Detalhamento completo por produto (convite, chat, boost, presentes, verificacao)
  productBreakdown: Record<ProductKey, { revenue: number; paidCount: number }>
  // Desempenho por gateway de pagamento (geradas, pagas, % de conversao)
  gatewayBreakdown: GatewayStat[]
  funnel: {
    signups: number
    viewedCheckout: number
    pixGenerated: number
    invitePaid: number
    chatUnlocked: number
  }
}

// Um "lead" representa um cliente unico, identificado pelo email.
// Unifica os cadastros (profiles) e os PIX gerados (invites) pelo email.
export interface Lead {
  key: string // email normalizado ou id do profile
  email: string | null
  name: string | null
  username: string | null
  hasAccount: boolean // possui profile (criou conta)
  firstSeen: string // data mais antiga (cadastro ou 1o PIX)
  invites: InviteRow[]
  pixGenerated: number
  pixCopied: number
  paidCount: number
  totalPaid: number
  pendingCount: number
  // Produtos adquiridos
  invitePaid: boolean // pagou o convite
  chatPaid: boolean // pagou o chat exclusivo (via invite type=chat)
  chatUnlocked: boolean // chat liberado no profile
  invitePaidAmount: number
  chatPaidAmount: number
}

function normalizeEmail(email: string | null): string | null {
  if (!email) return null
  return email.trim().toLowerCase()
}

// Constroi a lista de leads unificando profiles + invites por email
export function buildLeads(invites: InviteRow[], profiles: ProfileRow[]): Lead[] {
  const byKey = new Map<string, Lead>()

  // Indexa profiles por id e por (futuro match de email via username nao disponivel)
  const profileById = new Map<string, ProfileRow>()
  for (const p of profiles) profileById.set(p.id, p)

  // 1) Cria um lead para cada profile (conta criada)
  for (const p of profiles) {
    const key = `profile:${p.id}`
    byKey.set(key, {
      key,
      email: null,
      name: p.display_name || null,
      username: p.username || null,
      hasAccount: true,
      firstSeen: p.created_at,
      invites: [],
      pixGenerated: 0,
      pixCopied: 0,
      paidCount: 0,
      totalPaid: 0,
      pendingCount: 0,
      invitePaid: false,
      chatPaid: false,
      chatUnlocked: !!p.chat_unlocked,
      invitePaidAmount: 0,
      chatPaidAmount: 0,
    })
  }

  // 2) Agrega invites: por user_id (casa com profile) ou por email (lead anonimo)
  for (const inv of invites) {
    let lead: Lead | undefined

    if (inv.user_id && profileById.has(inv.user_id)) {
      lead = byKey.get(`profile:${inv.user_id}`)
    }

    if (!lead) {
      const email = normalizeEmail(inv.email)
      const key = email ? `email:${email}` : `invite:${inv.id}`
      lead = byKey.get(key)
      if (!lead) {
        lead = {
          key,
          email: inv.email,
          name: null,
          username: null,
          hasAccount: false,
          firstSeen: inv.created_at,
          invites: [],
          pixGenerated: 0,
          pixCopied: 0,
          paidCount: 0,
          totalPaid: 0,
          pendingCount: 0,
          invitePaid: false,
          chatPaid: false,
          chatUnlocked: false,
          invitePaidAmount: 0,
          chatPaidAmount: 0,
        }
        byKey.set(key, lead)
      }
    }

    lead.invites.push(inv)
    if (!lead.email && inv.email) lead.email = inv.email
    if (inv.pix_code) lead.pixGenerated += 1
    if (inv.pix_copied_at) lead.pixCopied += 1
    if (isPaid(inv.status)) {
      lead.paidCount += 1
      lead.totalPaid += Number(inv.amount) || 0
      if (isChatInvite(inv.type)) {
        lead.chatPaid = true
        lead.chatPaidAmount += Number(inv.amount) || 0
      } else {
        lead.invitePaid = true
        lead.invitePaidAmount += Number(inv.amount) || 0
      }
    }
    if (isPending(inv.status)) lead.pendingCount += 1
    // firstSeen = data mais antiga
    if (new Date(inv.created_at).getTime() < new Date(lead.firstSeen).getTime()) {
      lead.firstSeen = inv.created_at
    }
  }

  return Array.from(byKey.values()).sort(
    (a, b) => new Date(b.firstSeen).getTime() - new Date(a.firstSeen).getTime(),
  )
}

// Calcula metricas com base nos convites e perfis filtrados por periodo.
// "Clientes" = leads unicos (cadastros + PIX por email) dentro do periodo.
export function computeMetrics(
  invites: InviteRow[],
  profiles: ProfileRow[],
  range: [Date | null, Date | null],
  options?: { activeGateway?: string; knownGateways?: string[] },
): DashboardMetrics {
  const periodInvites = invites.filter((i) => isInRange(i.created_at, range))

  const paid = periodInvites.filter((i) => isPaid(i.status))
  const pending = periodInvites.filter((i) => isPending(i.status))
  const withPixCode = periodInvites.filter((i) => i.pix_code)
  // Copiou de verdade: marcou pix_copied_at ao tocar no botão "Copiar código PIX".
  const actuallyCopied = periodInvites.filter((i) => i.pix_copied_at)

  const revenue = paid.reduce((sum, i) => sum + (Number(i.amount) || 0), 0)
  const pendingRevenue = pending.reduce((sum, i) => sum + (Number(i.amount) || 0), 0)

  // Receita separada por produto (convite vs chat exclusivo)
  const paidInvitesOnly = paid.filter((i) => isInviteType(i.type))
  const paidChats = paid.filter((i) => isChatInvite(i.type))
  const inviteRevenue = paidInvitesOnly.reduce((s, i) => s + (Number(i.amount) || 0), 0)
  const chatRevenue = paidChats.reduce((s, i) => s + (Number(i.amount) || 0), 0)

  // Detalhamento por produto (todos os tipos vendidos na plataforma)
  const productBreakdown: Record<ProductKey, { revenue: number; paidCount: number }> = {
    invite: { revenue: 0, paidCount: 0 },
    chat: { revenue: 0, paidCount: 0 },
    boost: { revenue: 0, paidCount: 0 },
    gift: { revenue: 0, paidCount: 0 },
    verification: { revenue: 0, paidCount: 0 },
  }
  for (const i of paid) {
    const key = productOf(i.type)
    productBreakdown[key].revenue += Number(i.amount) || 0
    productBreakdown[key].paidCount += 1
  }

  const generatedCount = periodInvites.length
  const paidCount = paid.length

  // Leads (clientes) unicos cujo primeiro contato caiu no periodo
  const allLeads = buildLeads(invites, profiles)
  const periodLeads = allLeads.filter((l) => isInRange(l.firstSeen, range))
  const signups = periodLeads.length

  // Numero de chats exclusivos confirmados no periodo
  const chatUnlockedCount = paidChats.length

  const conversionRate = signups > 0 ? (paidCount / signups) * 100 : 0
  const avgTicket = paidCount > 0 ? revenue / paidCount : 0

  // Desempenho por gateway de cash-in. Inclui sempre os gateways conhecidos
  // (mesmo com zero transacoes) para que o painel liste todos os configurados.
  const activeGateway = options?.activeGateway
  const gatewayIds = new Set<string>(options?.knownGateways ?? Object.keys(GATEWAY_META))
  for (const i of periodInvites) {
    if (i.gateway) gatewayIds.add(i.gateway)
  }
  if (activeGateway) gatewayIds.add(activeGateway)

  const gatewayBreakdown: GatewayStat[] = Array.from(gatewayIds).map((id) => {
    const generated = periodInvites.filter((i) => i.gateway === id).length
    const paidRows = paid.filter((i) => i.gateway === id)
    const gwRevenue = paidRows.reduce((s, i) => s + (Number(i.amount) || 0), 0)
    return {
      id,
      label: gatewayLabel(id),
      generated,
      paid: paidRows.length,
      revenue: gwRevenue,
      conversionRate: generated > 0 ? (paidRows.length / generated) * 100 : 0,
      active: id === activeGateway,
    }
  })
  // Ativo primeiro; depois por receita; gateways sem transacao no periodo ao fim.
  gatewayBreakdown.sort((a, b) => {
    if (a.active !== b.active) return a.active ? -1 : 1
    if (b.revenue !== a.revenue) return b.revenue - a.revenue
    return b.generated - a.generated
  })

  return {
    clientsCount: signups,
    revenue,
    pendingRevenue,
    paidCount,
    generatedCount,
    copiedCount: actuallyCopied.length,
    pendingCount: pending.length,
    conversionRate,
    avgTicket,
    inviteRevenue,
    chatRevenue,
    invitePaidCount: paidInvitesOnly.length,
    chatPaidCount: paidChats.length,
    productBreakdown,
    gatewayBreakdown,
    funnel: {
      signups,
      viewedCheckout: generatedCount,
      pixGenerated: withPixCode.length,
      invitePaid: paidInvitesOnly.length,
      chatUnlocked: chatUnlockedCount,
    },
  }
}

export interface TimeBucket {
  label: string
  revenue: number
  paid: number
  signups: number
}

// Agrupa receita/cadastros em buckets temporais (horario de Brasilia)
export function buildTimeSeries(
  invites: InviteRow[],
  profiles: ProfileRow[],
  period: PeriodKey,
): TimeBucket[] {
  const now = new Date()
  const startOfToday = startOfDaySP(now)

  // Periodos curtos -> buckets por hora; longos -> por dia
  const hourly = period === 'today' || period === 'yesterday'
  const buckets: { start: Date; end: Date; label: string }[] = []

  if (hourly) {
    const dayStart = period === 'yesterday' ? addDays(startOfToday, -1) : startOfToday
    // 12 buckets de 2 horas (em horario de Brasilia)
    for (let h = 0; h < 24; h += 2) {
      const start = new Date(dayStart.getTime() + h * 60 * 60 * 1000)
      const end = new Date(dayStart.getTime() + (h + 2) * 60 * 60 * 1000)
      buckets.push({ start, end, label: `${String(h).padStart(2, '0')}h` })
    }
  } else {
    const days = period === '7d' ? 7 : period === '14d' ? 14 : period === '30d' ? 30 : 30
    for (let i = days - 1; i >= 0; i--) {
      const start = addDays(startOfToday, -i)
      const end = addDays(start, 1)
      buckets.push({
        start,
        end,
        label: start.toLocaleDateString('pt-BR', {
          timeZone: TIME_ZONE,
          day: '2-digit',
          month: '2-digit',
        }),
      })
    }
  }

  return buckets.map((b) => {
    const inRange = (d: string | null) => {
      if (!d) return false
      const t = new Date(d).getTime()
      return t >= b.start.getTime() && t < b.end.getTime()
    }
    const paidInBucket = invites.filter((i) => isPaid(i.status) && inRange(i.paid_at || i.created_at))
    const revenue = paidInBucket.reduce((s, i) => s + (Number(i.amount) || 0), 0)
    const signups = profiles.filter((p) => inRange(p.created_at)).length
    return {
      label: b.label,
      revenue,
      paid: paidInBucket.length,
      signups,
    }
  })
}
