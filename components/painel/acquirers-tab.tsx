'use client'

import { useMemo, useState } from 'react'
import {
  Search,
  Landmark,
  CheckCircle2,
  Receipt,
  Percent,
  BarChart3,
  Server,
} from 'lucide-react'
import {
  aggregateByAcquirer,
  getPeriodRange,
  isInRange,
  isPaid,
  formatBRL,
  type InviteRow,
  type PeriodKey,
  type AcquirerStat,
} from '@/lib/painel/metrics'
import { cn } from '@/lib/utils'

interface AcquirersTabProps {
  invites: InviteRow[]
  period: PeriodKey
}

export function AcquirersTab({ invites, period }: AcquirersTabProps) {
  const [chartMetric, setChartMetric] = useState<'paid' | 'generated'>('paid')
  const [query, setQuery] = useState('')

  const range = useMemo(() => getPeriodRange(period), [period])

  // Invites do período que realmente geraram um PIX.
  const periodInvites = useMemo(
    () => invites.filter((i) => i.pix_code && isInRange(i.created_at, range)),
    [invites, range],
  )

  // Agregação por adquirente (recebedor do PIX).
  const breakdown = useMemo(() => aggregateByAcquirer(periodInvites), [periodInvites])

  // Filtro de busca por nome do recebedor.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return breakdown
    return breakdown.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.gateways.some((g) => g.label.toLowerCase().includes(q)),
    )
  }, [breakdown, query])

  // Totais do topo.
  const totals = useMemo(() => {
    const generated = periodInvites.length
    const paidRows = periodInvites.filter((i) => isPaid(i.status))
    const paid = paidRows.length
    const revenue = paidRows.reduce((s, i) => s + (Number(i.amount) || 0), 0)
    return {
      generated,
      paid,
      revenue,
      conversionRate: generated > 0 ? (paid / generated) * 100 : 0,
      acquirers: breakdown.length,
    }
  }, [periodInvites, breakdown])

  return (
    <div className="flex flex-col gap-4">
      {/* Resumo */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard icon={Receipt} label="PIX gerados" value={String(totals.generated)} />
        <SummaryCard
          icon={CheckCircle2}
          label="PIX pagos"
          value={String(totals.paid)}
          tone="positive"
        />
        <SummaryCard
          icon={Percent}
          label="Conversão"
          value={`${totals.conversionRate.toFixed(0)}%`}
        />
        <SummaryCard
          icon={Landmark}
          label="Adquirentes"
          value={String(totals.acquirers)}
        />
      </div>

      {/* Gráfico de ranking */}
      <AcquirerBarChart
        stats={breakdown}
        metric={chartMetric}
        onMetricChange={setChartMetric}
      />

      {/* Busca */}
      <div className="flex items-center rounded-xl border border-border bg-card px-3 focus-within:border-primary/60">
        <Search className="size-4 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por recebedor ou gateway..."
          className="w-full bg-transparent px-2 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/60"
        />
      </div>

      {/* Lista de adquirentes */}
      <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
        <h2 className="mb-1 text-base font-bold text-foreground">
          Recebedores do PIX ({filtered.length})
        </h2>
        <p className="mb-4 text-xs text-muted-foreground">
          Agrupado pelo nome do recebedor que aparece no PIX, com a conversão e o gateway usado
          para gerar cada cobrança.
        </p>
        {filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Nenhum PIX gerado no período.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((acq) => (
              <AcquirerCard key={acq.name} acq={acq} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

// Card detalhado de um adquirente.
function AcquirerCard({ acq }: { acq: AcquirerStat }) {
  return (
    <div className="rounded-xl border border-border/60 bg-background/40 p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Landmark className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{acq.name}</p>
            <p className="text-xs text-muted-foreground">
              {acq.gateways.length} gateway{acq.gateways.length === 1 ? '' : 's'}
            </p>
          </div>
        </div>
        <span className="shrink-0 text-sm font-bold tabular-nums text-positive">
          {formatBRL(acq.revenue)}
        </span>
      </div>

      {/* Métricas: gerados, pagos, conversão */}
      <div className="mb-3 grid grid-cols-3 gap-2">
        <Metric label="Gerados" value={String(acq.generated)} />
        <Metric label="Pagos" value={String(acq.paid)} tone="positive" />
        <Metric label="Conversão" value={`${acq.conversionRate.toFixed(0)}%`} />
      </div>

      {/* Barra de conversão */}
      <div className="mb-3 h-2 overflow-hidden rounded-full bg-background/70">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${Math.min(Math.max(acq.conversionRate, 2), 100)}%` }}
        />
      </div>

      {/* Gateways usados */}
      <div className="flex flex-col gap-1.5 border-t border-border/60 pt-3">
        <p className="flex items-center gap-1.5 text-[0.7rem] font-medium uppercase tracking-wide text-muted-foreground">
          <Server className="size-3" />
          Gateway usado
        </p>
        <div className="flex flex-wrap gap-1.5">
          {acq.gateways.map((g) => (
            <span
              key={g.id}
              className="inline-flex items-center gap-1.5 rounded-lg bg-card px-2.5 py-1 text-xs text-foreground"
            >
              <span className="font-medium">{g.label}</span>
              <span className="text-muted-foreground">
                {g.generated} ger. · {g.paid} pago{g.paid === 1 ? '' : 's'}
              </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone?: 'positive'
}) {
  return (
    <div className="flex flex-col items-center rounded-lg bg-card px-2 py-2 text-center">
      <span
        className={cn(
          'text-base font-bold tabular-nums',
          tone === 'positive' ? 'text-positive' : 'text-foreground',
        )}
      >
        {value}
      </span>
      <span className="text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
    </div>
  )
}

// Gráfico de barras horizontais: ranking dos recebedores por vendas ou geração.
function AcquirerBarChart({
  stats,
  metric,
  onMetricChange,
}: {
  stats: AcquirerStat[]
  metric: 'paid' | 'generated'
  onMetricChange: (m: 'paid' | 'generated') => void
}) {
  const data = useMemo(() => {
    return stats
      .filter((s) => (metric === 'paid' ? s.paid > 0 : s.generated > 0))
      .slice(0, 8)
      .map((s) => ({
        key: s.name,
        label: s.name,
        value: metric === 'paid' ? s.paid : s.generated,
        paid: s.paid,
        generated: s.generated,
      }))
  }, [stats, metric])

  const max = useMemo(() => Math.max(...data.map((d) => d.value), 0), [data])

  return (
    <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="size-4 text-primary" />
          <h2 className="text-base font-bold text-foreground">Ranking de recebedores</h2>
        </div>
        <div className="flex gap-1 rounded-full bg-background/60 p-0.5">
          <button
            onClick={() => onMetricChange('paid')}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium transition',
              metric === 'paid'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Pagos
          </button>
          <button
            onClick={() => onMetricChange('generated')}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium transition',
              metric === 'generated'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Gerados
          </button>
        </div>
      </div>

      {data.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          Nenhum PIX {metric === 'paid' ? 'pago' : 'gerado'} no período.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {data.map((d, i) => {
            const pct = max > 0 ? (d.value / max) * 100 : 0
            return (
              <div key={d.key} className="flex flex-col gap-1">
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="flex min-w-0 items-center gap-1.5 font-medium text-foreground">
                    <span className="inline-flex size-4 shrink-0 items-center justify-center rounded bg-secondary text-[0.6rem] tabular-nums text-muted-foreground">
                      {i + 1}
                    </span>
                    <span className="truncate">{d.label}</span>
                  </span>
                  <span className="shrink-0 font-bold tabular-nums text-foreground">
                    {metric === 'paid'
                      ? `${d.paid} pago${d.paid === 1 ? '' : 's'}`
                      : `${d.generated} gerado${d.generated === 1 ? '' : 's'}`}
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-background/60">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${Math.max(pct, 3)}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Landmark
  label: string
  value: string
  tone?: 'positive'
}) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className="size-3.5" />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <span
        className={cn(
          'text-lg font-bold tabular-nums',
          tone === 'positive' ? 'text-positive' : 'text-foreground',
        )}
      >
        {value}
      </span>
    </div>
  )
}
