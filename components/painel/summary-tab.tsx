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
  Layers,
  Ticket,
  MessageCircle,
  Rocket,
  Gift,
  BadgeCheck,
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
  PRODUCT_META,
  PRODUCT_ORDER,
  type ProductKey,
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
  activeCashinGateway?: string
  gateways?: { id: string; label: string; description: string; configured: boolean }[]
}

// Estilo visual de cada card de produto (icone + paleta)
const PRODUCT_STYLES: Record<
  ProductKey,
  {
    icon: typeof Ticket
    border: string
    bg: string
    iconBg: string
    iconColor: string
  }
> = {
  invite: {
    icon: Ticket,
    border: 'border-border/60',
    bg: 'bg-background/40',
    iconBg: 'bg-primary/15',
    iconColor: 'text-primary',
  },
  chat: {
    icon: MessageCircle,
    border: 'border-emerald-600/30',
    bg: 'bg-emerald-500/5',
    iconBg: 'bg-emerald-500/15',
    iconColor: 'text-emerald-400',
  },
  boost: {
    icon: Rocket,
    border: 'border-sky-600/30',
    bg: 'bg-sky-500/5',
    iconBg: 'bg-sky-500/15',
    iconColor: 'text-sky-400',
  },
  gift: {
    icon: Gift,
    border: 'border-amber-600/30',
    bg: 'bg-amber-500/5',
    iconBg: 'bg-amber-500/15',
    iconColor: 'text-amber-400',
  },
  verification: {
    icon: BadgeCheck,
    border: 'border-border/60',
    bg: 'bg-background/40',
    iconBg: 'bg-positive/15',
    iconColor: 'text-positive',
  },
}

export function SummaryTab({
  invites,
  profiles,
  period,
  statusFilter,
  activeCashinGateway,
  gateways,
}: SummaryTabProps) {
  const range = useMemo(() => getPeriodRange(period), [period])

  const knownGateways = useMemo(
    () => (gateways && gateways.length > 0 ? gateways.map((g) => g.id) : undefined),
    [gateways],
  )

  const metrics = useMemo(
    () =>
      computeMetrics(invites, profiles, range, {
        activeGateway: activeCashinGateway,
        knownGateways,
      }),
    [invites, profiles, range, activeCashinGateway, knownGateways],
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
          sublabel="leads no período"
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

      {/* Gateways de pagamento: ativo + todos os configurados */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <ShieldCheck className="size-4 text-muted-foreground" />
          <h2 className="text-base font-bold text-foreground">Gateways de Pagamento</h2>
        </div>
        <div className="flex flex-col gap-3">
          {metrics.gatewayBreakdown.map((gw) => {
            const meta = gateways?.find((g) => g.id === gw.id)
            const configured = meta?.configured ?? gw.active
            return (
              <div
                key={gw.id}
                className={`rounded-xl border p-4 ${
                  gw.active
                    ? 'border-positive/40 bg-positive/5'
                    : 'border-border/60 bg-background/40'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex size-10 items-center justify-center rounded-xl ${
                        gw.active ? 'bg-positive/15' : 'bg-secondary'
                      }`}
                    >
                      <ShieldCheck
                        className={`size-5 ${gw.active ? 'text-positive' : 'text-muted-foreground'}`}
                      />
                    </div>
                    <div>
                      <p className="flex flex-wrap items-center gap-2 text-sm font-bold text-foreground">
                        {gw.label}
                        {gw.active ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-positive/15 px-2 py-0.5 text-[11px] font-semibold text-positive">
                            <span className="size-1.5 rounded-full bg-positive" />
                            Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                            {configured ? 'Standby' : 'Não configurado'}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {gw.generated} {gw.generated === 1 ? 'PIX gerado' : 'PIX gerados'} ·{' '}
                        {gw.paid} {gw.paid === 1 ? 'pago' : 'pagos'} hoje
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold tabular-nums text-foreground">
                      {formatBRL(gw.revenue)}
                    </p>
                    <p
                      className={`flex items-center justify-end gap-1 text-xs font-semibold ${
                        gw.conversionRate >= 50
                          ? 'text-positive'
                          : gw.conversionRate > 0
                            ? 'text-amber-500'
                            : 'text-muted-foreground'
                      }`}
                    >
                      <TrendingUp className="size-3" />
                      {gw.conversionRate.toFixed(0)}% conversão
                    </p>
                  </div>
                </div>
                {/* Barra de conversao do gateway */}
                <div className="mt-3 flex h-1.5 overflow-hidden rounded-full bg-secondary">
                  <div
                    className={gw.active ? 'bg-positive' : 'bg-muted-foreground/50'}
                    style={{ width: `${Math.min(gw.conversionRate, 100)}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Receita por produto */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <Layers className="size-4 text-muted-foreground" />
          <h2 className="text-base font-bold text-foreground">Receita por Produto</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PRODUCT_ORDER.map((key) => {
            const meta = PRODUCT_META[key]
            const data = metrics.productBreakdown[key]
            const style = PRODUCT_STYLES[key]
            const Icon = style.icon
            return (
              <div
                key={key}
                className={`rounded-xl border p-4 ${style.border} ${style.bg}`}
              >
                <div className="flex items-center gap-2">
                  <span className={`flex size-8 items-center justify-center rounded-lg ${style.iconBg}`}>
                    <Icon className={`size-4 ${style.iconColor}`} />
                  </span>
                  <p className="text-sm font-semibold text-foreground">{meta.label}</p>
                </div>
                <p className="mt-3 text-2xl font-bold tabular-nums text-foreground">
                  {formatBRL(data.revenue)}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {data.paidCount} {data.paidCount === 1 ? meta.unit : meta.unitPlural}
                </p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Funil */}
      <ConversionFunnel
        signups={metrics.funnel.signups}
        viewedCheckout={metrics.funnel.viewedCheckout}
        pixGenerated={metrics.funnel.pixGenerated}
        invitePaid={metrics.funnel.invitePaid}
        chatUnlocked={metrics.funnel.chatUnlocked}
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
