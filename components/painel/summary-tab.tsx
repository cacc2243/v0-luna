'use client'

import { useMemo } from 'react'
import {
  Users,
  DollarSign,
  CheckCircle2,
  Copy,
  TrendingUp,
  Download,
  Instagram,
  Facebook,
  Link2,
} from 'lucide-react'
import { StatCard } from './stat-card'
import { ConversionFunnel } from './conversion-funnel'
import { TransactionsList } from './transactions-list'
import {
  computeMetrics,
  getPeriodRange,
  isInRange,
  isPaid,
  isPending,
  formatBRL,
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

// Gateways configurados na plataforma
const GATEWAYS = [
  { key: 'bynet', label: 'Bynet', color: 'text-positive', bg: 'bg-positive/15' },
  { key: 'pixup', label: 'PixUp', color: 'text-purple-400', bg: 'bg-purple-500/15' },
  { key: 'duttyfy', label: 'Duttyfy', color: 'text-amber-400', bg: 'bg-amber-500/15' },
  { key: 'sigilopay', label: 'SigiloPay', color: 'text-primary', bg: 'bg-primary/15' },
  { key: 'buckpay', label: 'BuckPay', color: 'text-sky-400', bg: 'bg-sky-500/15' },
] as const

export function SummaryTab({ invites, profiles, period, statusFilter }: SummaryTabProps) {
  const range = useMemo(() => getPeriodRange(period), [period])

  const metrics = useMemo(
    () => computeMetrics(invites, profiles, range),
    [invites, profiles, range],
  )

  // Transacoes filtradas por periodo + status
  const filteredInvites = useMemo(() => {
    return invites
      .filter((i) => isInRange(i.created_at, range))
      .filter((i) => {
        if (statusFilter === 'paid') return isPaid(i.status)
        if (statusFilter === 'pending') return isPending(i.status)
        return true
      })
  }, [invites, range, statusFilter])

  const paidInvites = filteredInvites.filter((i) => isPaid(i.status))

  return (
    <div className="flex flex-col gap-5">
      {/* Botao exportar */}
      <button className="flex w-full items-center justify-center gap-2 rounded-2xl border border-primary/40 bg-primary/10 px-4 py-3.5 text-sm font-semibold text-primary transition hover:bg-primary/15">
        <Download className="size-4" />
        Exportar CSV Lookalike ({metrics.paidCount} compradores)
      </button>

      {/* Cards principais */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={Users}
          value={String(metrics.clientsCount)}
          label="Clientes"
          sublabel="no período"
        />
        <StatCard
          icon={DollarSign}
          iconColor="text-positive"
          iconBg="bg-positive/15"
          value={formatBRL(metrics.revenue)}
          label="Receita"
          sublabel={`${metrics.paidCount} pagos`}
        />
        <StatCard
          icon={CheckCircle2}
          iconColor="text-positive"
          iconBg="bg-positive/15"
          value={String(metrics.paidCount)}
          label="PIX Pagos"
          sublabel={`de ${metrics.generatedCount} gerados`}
        />
        <StatCard
          icon={Copy}
          iconColor="text-sky-400"
          iconBg="bg-sky-500/15"
          value={String(metrics.copiedCount)}
          label="Copiaram PIX"
          sublabel={`de ${metrics.pendingCount} pendentes`}
        />
      </div>

      {/* Cards secundarios: conversao + gateways */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={TrendingUp}
          value={`${metrics.conversionRate.toFixed(0)}%`}
          label="Conversão"
          sublabel={`${metrics.pendingCount} pendentes`}
        />
        {GATEWAYS.map((gw) => {
          // No momento todos os PIX passam pela Bynet
          const gwPaid = gw.key === 'bynet' ? paidInvites.length : 0
          const gwRate =
            gw.key === 'bynet' && filteredInvites.length > 0
              ? (gwPaid / filteredInvites.length) * 100
              : 0
          return (
            <StatCard
              key={gw.key}
              icon={CheckCircle2}
              iconColor={gw.color}
              iconBg={gw.bg}
              value={String(gwPaid)}
              label={gw.label}
              sublabel={`${gwPaid} pagos · ${gwRate.toFixed(1)}%`}
            />
          )
        })}
      </div>

      {/* Receita por status */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-4 text-base font-bold text-foreground">Receita por Status</h2>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm text-foreground">
              <span className="size-2.5 rounded-full bg-positive" />
              Pago
            </span>
            <span className="text-sm font-bold tabular-nums text-positive">
              {formatBRL(metrics.revenue)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm text-foreground">
              <span className="size-2.5 rounded-full bg-amber-500" />
              Pendente
            </span>
            <span className="text-sm font-bold tabular-nums text-amber-500">
              {formatBRL(metrics.pendingRevenue)}
            </span>
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
        <h2 className="mb-4 text-base font-bold text-foreground">Origem das Vendas</h2>
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
