export interface InviteRow {
  id: string
  user_id: string | null
  email: string | null
  amount: number | null
  status: string | null
  transaction_id: string | null
  pix_code: string | null
  created_at: string
  paid_at: string | null
  pix_expiration: string | null
}

export interface ProfileRow {
  id: string
  username: string | null
  display_name: string | null
  created_at: string
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
  funnel: {
    signups: number
    viewedCheckout: number
    pixGenerated: number
    invitePaid: number
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
  paidCount: number
  totalPaid: number
  pendingCount: number
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
      paidCount: 0,
      totalPaid: 0,
      pendingCount: 0,
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
          paidCount: 0,
          totalPaid: 0,
          pendingCount: 0,
        }
        byKey.set(key, lead)
      }
    }

    lead.invites.push(inv)
    if (!lead.email && inv.email) lead.email = inv.email
    if (inv.pix_code) lead.pixGenerated += 1
    if (isPaid(inv.status)) {
      lead.paidCount += 1
      lead.totalPaid += Number(inv.amount) || 0
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
): DashboardMetrics {
  const periodInvites = invites.filter((i) => isInRange(i.created_at, range))

  const paid = periodInvites.filter((i) => isPaid(i.status))
  const pending = periodInvites.filter((i) => isPending(i.status))
  const withPixCode = periodInvites.filter((i) => i.pix_code)

  const revenue = paid.reduce((sum, i) => sum + (Number(i.amount) || 0), 0)
  const pendingRevenue = pending.reduce((sum, i) => sum + (Number(i.amount) || 0), 0)

  const generatedCount = periodInvites.length
  const paidCount = paid.length

  // Leads (clientes) unicos cujo primeiro contato caiu no periodo
  const allLeads = buildLeads(invites, profiles)
  const periodLeads = allLeads.filter((l) => isInRange(l.firstSeen, range))
  const signups = periodLeads.length

  const conversionRate = signups > 0 ? (paidCount / signups) * 100 : 0
  const avgTicket = paidCount > 0 ? revenue / paidCount : 0

  return {
    clientsCount: signups,
    revenue,
    pendingRevenue,
    paidCount,
    generatedCount,
    copiedCount: withPixCode.length,
    pendingCount: pending.length,
    conversionRate,
    avgTicket,
    funnel: {
      signups,
      viewedCheckout: generatedCount,
      pixGenerated: withPixCode.length,
      invitePaid: paidCount,
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
