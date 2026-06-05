'use client'

import { useMemo } from 'react'
import {
  Users,
  DollarSign,
  CheckCircle2,
  Copy,
  TrendingUp,
  ArrowUpRight,
  Link2,
  Instagram,
  Facebook,
  ShieldCheck,
} from 'lucide-react'
import { StatCard } from './stat-card'
import { ConversionFunnel } from './conversion-funnel'
import { TransactionsList } from './transactions-list'
import { RevenueChart } from './revenue-chart'
import {
  computeMetrics,
  buildTimeSeries,
  getPeriodRange,
  isInRange,
  isPaid,
  isPending,
  formatBRL,
  PERIOD_LABELS,
  type InviteRow,
  type ProfileRow,
  type PeriodKey,
  type StatusFilter,
} from '@/lib/painel/metrics'

interface SummaryTabProps {
  invites: InviteRow[]
  profiles: ProfileRow[]
  period: PeriodKey
  statusFilter: StatusFilter
}

export function SummaryTab({ invites, profiles, period, statusFilter }: SummaryTabProps) {
  const range = useMemo(() => getPeriodRange(period), [period])

  const metrics = useMemo(
    () => computeMetrics(invites, profiles, range),
    [invites, profiles, range],
  )

  const series = useMemo(
    () => buildTimeSeries(invites, profiles, period),
    [invites, profiles, period],
  )

  const filteredInvites = useMemo(() => {
    return invites
      .filter((i) => isInRange(i.created_at, range))
      .filter((i) => {
        if (statusFilter === 'paid') return isPaid(i.status)
        if (statusFilter === 'pending') return isPending(i.status)
        return true
      })
  }, [invites, range, statusFilter])

  const totalRevenue = metrics.revenue + metrics.pendingRevenue
  const paidPct = totalRevenue > 0 ? (metrics.revenue / totalRevenue) * 100 : 0

  return (
    <div className="flex flex-col gap-5">
      {/* Hero de receita + grafico */}
      <section className="overflow-hidden rounded-3xl border border-border bg-card">
        <div className="flex flex-col gap-4 p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <DollarSign className="size-4 text-positive" />
                Receita confirmada · {PERIOD_LABELS[period]}
              </p>
              <p className="mt-1 text-4xl font-bold tracking-tight text-foreground tabular-nums">
                {formatBRL(metrics.revenue)}
              </p>
              <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1 rounded-md bg-positive/15 px-1.5 py-0.5 text-xs font-semibold text-positive">
                  <ArrowUpRight className="size-3" />
                  {metrics.paidCount} vendas
                </span>
                Ticket médio {formatBRL(metrics.avgTicket)}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-background/50 px-4 py-3 text-right">
              <p className="text-xs text-muted-foreground">Pendente</p>
              <p className="text-lg font-bold tabular-nums text-amber-500">
                {formatBRL(metrics.pendingRevenue)}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {metrics.pendingCount} aguardando
              </p>
            </div>
          </div>

          <RevenueChart data={series} />

          {/* Barra pago x pendente */}
          <div>
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Pago vs. Pendente</span>
              <span className="font-semibold text-foreground">{paidPct.toFixed(0)}% confirmado</span>
            </div>
            <div className="flex h-2 overflow-hidden rounded-full bg-secondary">
              <div className="bg-positive" style={{ width: `${paidPct}%` }} />
              <div className="bg-amber-500" style={{ width: `${100 - paidPct}%` }} />
            </div>
          </div>
        </div>
      </section>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={Users}
          value={String(metrics.clientsCount)}
          label="Clientes"
          sublabel="cadastrados no período"
        />
        <StatCard
          icon={CheckCircle2}
          iconColor="text-positive"
          iconBg="bg-positive/15"
          value={String(metrics.paidCount)}
          label="PIX Pagos"
          sublabel={`de ${metrics.generatedCount} gerados`}
          accent
        />
        <StatCard
          icon={Copy}
          iconColor="text-sky-400"
          iconBg="bg-sky-500/15"
          value={String(metrics.copiedCount)}
          label="Copiaram PIX"
          sublabel={`${metrics.pendingCount} pendentes`}
        />
        <StatCard
          icon={TrendingUp}
          iconColor="text-amber-400"
          iconBg="bg-amber-500/15"
          value={`${metrics.conversionRate.toFixed(0)}%`}
          label="Conversão"
          sublabel="cadastro → pago"
        />
      </div>

      {/* Gateway ativo (apenas Bynet) */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-positive/15">
              <ShieldCheck className="size-5 text-positive" />
            </div>
            <div>
              <p className="flex items-center gap-2 text-sm font-bold text-foreground">
                Bynet
                <span className="inline-flex items-center gap-1 rounded-full bg-positive/15 px-2 py-0.5 text-[11px] font-semibold text-positive">
                  <span className="size-1.5 rounded-full bg-positive" />
                  Ativo
                </span>
              </p>
              <p className="text-xs text-muted-foreground">Gateway de pagamento PIX</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold tabular-nums text-foreground">
              {formatBRL(metrics.revenue)}
            </p>
            <p className="text-xs text-muted-foreground">
              {metrics.paidCount}/{metrics.generatedCount} convertidos
            </p>
          </div>
        </div>
      </section>

      {/* Funil */}
      <ConversionFunnel
        signups={metrics.funnel.signups}
        viewedCheckout={metrics.funnel.viewedCheckout}
        pixGenerated={metrics.funnel.pixGenerated}
        invitePaid={metrics.funnel.invitePaid}
      />

      {/* Origem das vendas */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <Link2 className="size-4 text-muted-foreground" />
          <h2 className="text-base font-bold text-foreground">Origem das Vendas</h2>
        </div>
        <div className="flex flex-col gap-4">
          <OriginRow
            icon={Instagram}
            color="text-primary"
            label="Instagram"
            sub="0% das vendas"
            count={0}
            value={0}
          />
          <OriginRow
            icon={Facebook}
            color="text-sky-400"
            label="Facebook"
            sub="0% das vendas"
            count={0}
            value={0}
          />
          <OriginRow
            icon={Link2}
            color="text-muted-foreground"
            label="Orgânico / Direto"
            sub={`${metrics.paidCount > 0 ? 100 : 0}% das vendas`}
            count={metrics.paidCount}
            value={metrics.revenue}
          />
        </div>
      </section>

      {/* Transacoes */}
      <TransactionsList invites={filteredInvites} />
    </div>
  )
}

function OriginRow({
  icon: Icon,
  color,
  label,
  sub,
  count,
  value,
}: {
  icon: typeof Instagram
  color: string
  label: string
  sub: string
  count: number
  value: number
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Icon className={`size-5 ${color}`} />
        <div>
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">{sub}</p>
        </div>
      </div>
      <div className="text-right">
        <p className={`text-sm font-bold tabular-nums ${color}`}>{count}</p>
        <p className="text-xs text-muted-foreground">{formatBRL(value)}</p>
      </div>
    </div>
  )
}
