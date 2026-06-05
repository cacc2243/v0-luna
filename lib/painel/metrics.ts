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

// Retorna [inicio, fim] do periodo selecionado
export function getPeriodRange(period: PeriodKey): [Date | null, Date | null] {
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  switch (period) {
    case 'today':
      return [startOfToday, now]
    case 'yesterday': {
      const startYesterday = new Date(startOfToday)
      startYesterday.setDate(startYesterday.getDate() - 1)
      return [startYesterday, startOfToday]
    }
    case '7d': {
      const start = new Date(startOfToday)
      start.setDate(start.getDate() - 6)
      return [start, now]
    }
    case '14d': {
      const start = new Date(startOfToday)
      start.setDate(start.getDate() - 13)
      return [start, now]
    }
    case '30d': {
      const start = new Date(startOfToday)
      start.setDate(start.getDate() - 29)
      return [start, now]
    }
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

// Calcula metricas com base nos convites e perfis filtrados por periodo
export function computeMetrics(
  invites: InviteRow[],
  profiles: ProfileRow[],
  range: [Date | null, Date | null],
): DashboardMetrics {
  const periodInvites = invites.filter((i) => isInRange(i.created_at, range))
  const periodProfiles = profiles.filter((p) => isInRange(p.created_at, range))

  const paid = periodInvites.filter((i) => isPaid(i.status))
  const pending = periodInvites.filter((i) => isPending(i.status))
  const withPixCode = periodInvites.filter((i) => i.pix_code)

  const revenue = paid.reduce((sum, i) => sum + (Number(i.amount) || 0), 0)
  const pendingRevenue = pending.reduce((sum, i) => sum + (Number(i.amount) || 0), 0)

  const generatedCount = periodInvites.length
  const paidCount = paid.length
  const signups = periodProfiles.length

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

// Agrupa receita/cadastros em buckets temporais conforme o periodo
export function buildTimeSeries(
  invites: InviteRow[],
  profiles: ProfileRow[],
  period: PeriodKey,
): TimeBucket[] {
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  // Periodos curtos -> buckets por hora; longos -> por dia
  const hourly = period === 'today' || period === 'yesterday'
  const buckets: { start: Date; end: Date; label: string }[] = []

  if (hourly) {
    const dayStart =
      period === 'yesterday'
        ? new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000)
        : startOfToday
    // 12 buckets de 2 horas
    for (let h = 0; h < 24; h += 2) {
      const start = new Date(dayStart)
      start.setHours(h, 0, 0, 0)
      const end = new Date(start)
      end.setHours(h + 2, 0, 0, 0)
      buckets.push({ start, end, label: `${String(h).padStart(2, '0')}h` })
    }
  } else {
    const days = period === '7d' ? 7 : period === '14d' ? 14 : period === '30d' ? 30 : 30
    for (let i = days - 1; i >= 0; i--) {
      const start = new Date(startOfToday)
      start.setDate(start.getDate() - i)
      const end = new Date(start)
      end.setDate(end.getDate() + 1)
      buckets.push({
        start,
        end,
        label: start.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
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
