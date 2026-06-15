'use client'

import { useMemo, useState } from 'react'
import {
  Search,
  ExternalLink,
  Megaphone,
  TrendingUp,
  Hash,
  Layers,
  CheckCircle2,
  Globe,
  BarChart3,
} from 'lucide-react'
import {
  aggregateByUtm,
  getPeriodRange,
  isInRange,
  isPaid,
  parseUtmValue,
  formatBRL,
  formatDateTime,
  productOf,
  PRODUCT_META,
  UTM_LABELS,
  hasAttribution,
  type InviteRow,
  type PeriodKey,
  type UtmKey,
  type UtmStat,
} from '@/lib/painel/metrics'
import { cn } from '@/lib/utils'

interface UtmsTabProps {
  invites: InviteRow[]
  period: PeriodKey
}

// Dimensões de agregação disponíveis (uma por chave de UTM).
const DIMENSIONS: { key: UtmKey; label: string }[] = [
  { key: 'utm_campaign', label: 'Campanha' },
  { key: 'utm_source', label: 'Origem' },
  { key: 'utm_medium', label: 'Conjunto' },
  { key: 'utm_content', label: 'Anúncio' },
  { key: 'utm_term', label: 'Posicionamento' },
]

type ViewMode = 'sales' | 'breakdown'

export function UtmsTab({ invites, period }: UtmsTabProps) {
  const [view, setView] = useState<ViewMode>('sales')
  const [dimension, setDimension] = useState<UtmKey>('utm_campaign')
  const [chartMetric, setChartMetric] = useState<'paid' | 'revenue'>('paid')
  const [query, setQuery] = useState('')

  const range = useMemo(() => getPeriodRange(period), [period])

  // Invites do período selecionado.
  const periodInvites = useMemo(
    () => invites.filter((i) => isInRange(i.created_at, range)),
    [invites, range],
  )

  // Apenas vendas pagas, com qualquer atribuição, ordenadas da mais recente.
  const paidSales = useMemo(() => {
    const q = query.trim().toLowerCase()
    return periodInvites
      .filter((i) => isPaid(i.status))
      .filter((i) => {
        if (!q) return true
        const hay = [
          i.email,
          i.utm_source,
          i.utm_campaign,
          i.utm_medium,
          i.utm_content,
          i.utm_term,
        ]
          .join(' ')
          .toLowerCase()
        return hay.includes(q)
      })
      .sort(
        (a, b) =>
          new Date(b.paid_at || b.created_at).getTime() -
          new Date(a.paid_at || a.created_at).getTime(),
      )
  }, [periodInvites, query])

  // Agregação por dimensão (somente vendas pagas contam receita; geração conta todos).
  const breakdown = useMemo(
    () => aggregateByUtm(periodInvites, dimension),
    [periodInvites, dimension],
  )

  // Totais do topo.
  const totals = useMemo(() => {
    const paid = periodInvites.filter((i) => isPaid(i.status))
    const attributed = paid.filter((i) => hasAttribution(i))
    const revenue = paid.reduce((s, i) => s + (Number(i.amount) || 0), 0)
    const attributedRevenue = attributed.reduce((s, i) => s + (Number(i.amount) || 0), 0)
    return {
      paidCount: paid.length,
      attributedCount: attributed.length,
      revenue,
      attributedRevenue,
      attributionRate: paid.length > 0 ? (attributed.length / paid.length) * 100 : 0,
    }
  }, [periodInvites])

  return (
    <div className="flex flex-col gap-4">
      {/* Resumo */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard
          icon={CheckCircle2}
          label="Vendas pagas"
          value={String(totals.paidCount)}
          tone="positive"
        />
        <SummaryCard
          icon={Megaphone}
          label="Com origem (UTM)"
          value={String(totals.attributedCount)}
        />
        <SummaryCard
          icon={TrendingUp}
          label="Receita atribuída"
          value={formatBRL(totals.attributedRevenue)}
          tone="positive"
        />
        <SummaryCard
          icon={Layers}
          label="% rastreada"
          value={`${totals.attributionRate.toFixed(0)}%`}
        />
      </div>

      {/* Alternador de visão */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setView('sales')}
          className={cn(
            'rounded-full px-3.5 py-1.5 text-sm font-medium transition',
            view === 'sales'
              ? 'bg-primary text-primary-foreground'
              : 'bg-card text-muted-foreground hover:text-foreground',
          )}
        >
          Vendas detalhadas
        </button>
        <button
          onClick={() => setView('breakdown')}
          className={cn(
            'rounded-full px-3.5 py-1.5 text-sm font-medium transition',
            view === 'breakdown'
              ? 'bg-primary text-primary-foreground'
              : 'bg-card text-muted-foreground hover:text-foreground',
          )}
        >
          Agrupado por UTM
        </button>
      </div>

      {view === 'sales' ? (
        <>
          <div className="flex items-center rounded-xl border border-border bg-card px-3 focus-within:border-primary/60">
            <Search className="size-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por email, campanha, origem..."
              className="w-full bg-transparent px-2 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/60"
            />
          </div>

          <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
            <h2 className="mb-4 text-base font-bold text-foreground">
              Vendas com origem ({paidSales.length})
            </h2>
            {paidSales.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Nenhuma venda paga no período.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {paidSales.map((sale) => (
                  <SaleCard key={sale.id} sale={sale} />
                ))}
              </div>
            )}
          </section>
        </>
      ) : (
        <>
          {/* Seletor de dimensão */}
          <div className="flex flex-wrap gap-2">
            {DIMENSIONS.map((d) => (
              <button
                key={d.key}
                onClick={() => setDimension(d.key)}
                className={cn(
                  'rounded-full px-3.5 py-1.5 text-sm font-medium transition',
                  dimension === d.key
                    ? 'bg-secondary text-foreground ring-1 ring-primary/40'
                    : 'bg-card text-muted-foreground hover:text-foreground',
                )}
              >
                {d.label}
              </button>
            ))}
          </div>

          {/* Gráfico de barras: ranking por vendas ou receita */}
          <UtmBarChart
            stats={breakdown}
            metric={chartMetric}
            onMetricChange={setChartMetric}
            dimensionLabel={UTM_LABELS[dimension]}
          />

          <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
            <h2 className="mb-1 text-base font-bold text-foreground">
              {UTM_LABELS[dimension]}
            </h2>
            <p className="mb-4 text-xs text-muted-foreground">
              Desempenho agrupado por {UTM_LABELS[dimension].toLowerCase()} no período.
            </p>
            {breakdown.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Nenhum dado de atribuição no período.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {breakdown.map((stat) => (
                  <div
                    key={stat.raw || 'none'}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/40 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{stat.name}</p>
                      <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                        {stat.id && (
                          <span className="inline-flex items-center gap-0.5">
                            <Hash className="size-3" />
                            {stat.id}
                          </span>
                        )}
                        <span>{stat.generated} PIX</span>
                        <span>·</span>
                        <span>{stat.paid} pago{stat.paid === 1 ? '' : 's'}</span>
                        <span>·</span>
                        <span>{stat.conversionRate.toFixed(0)}% conv.</span>
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-bold tabular-nums text-positive">
                      {formatBRL(stat.revenue)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}

// Gráfico de barras horizontais: ranking dos valores de UTM por vendas ou receita.
function UtmBarChart({
  stats,
  metric,
  onMetricChange,
  dimensionLabel,
}: {
  stats: UtmStat[]
  metric: 'paid' | 'revenue'
  onMetricChange: (m: 'paid' | 'revenue') => void
  dimensionLabel: string
}) {
  // Considera apenas valores que tiveram ao menos uma venda paga, top 8.
  const data = useMemo(() => {
    return stats
      .filter((s) => s.paid > 0)
      .slice(0, 8)
      .map((s) => ({
        key: s.raw || 'none',
        label: s.id ? `${s.name} · #${s.id}` : s.name,
        value: metric === 'paid' ? s.paid : s.revenue,
        paid: s.paid,
        revenue: s.revenue,
      }))
  }, [stats, metric])

  const max = useMemo(() => Math.max(...data.map((d) => d.value), 0), [data])

  return (
    <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="size-4 text-primary" />
          <h2 className="text-base font-bold text-foreground">
            Ranking por {dimensionLabel.toLowerCase()}
          </h2>
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
            Vendas
          </button>
          <button
            onClick={() => onMetricChange('revenue')}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium transition',
              metric === 'revenue'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Receita
          </button>
        </div>
      </div>

      {data.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          Nenhuma venda paga atribuída no período.
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
                      ? `${d.paid} venda${d.paid === 1 ? '' : 's'}`
                      : formatBRL(d.revenue)}
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

// Card de uma venda individual com TODAS as UTMs separadas certinho.
function SaleCard({ sale }: { sale: InviteRow }) {
  const product = PRODUCT_META[productOf(sale.type)]
  const utmRows: { key: UtmKey; label: string; value: string | null | undefined }[] = [
    { key: 'utm_source', label: UTM_LABELS.utm_source, value: sale.utm_source },
    { key: 'utm_campaign', label: UTM_LABELS.utm_campaign, value: sale.utm_campaign },
    { key: 'utm_medium', label: UTM_LABELS.utm_medium, value: sale.utm_medium },
    { key: 'utm_content', label: UTM_LABELS.utm_content, value: sale.utm_content },
    { key: 'utm_term', label: UTM_LABELS.utm_term, value: sale.utm_term },
  ]
  const hasAnyUtm = utmRows.some((r) => r.value)

  return (
    <div className="rounded-xl border border-border/60 bg-background/40 p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">
            {sale.email || 'Sem email'}
          </p>
          <p className="text-xs text-muted-foreground">
            {product.label} · {formatDateTime(sale.paid_at || sale.created_at)}
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 text-sm font-bold tabular-nums text-positive">
          <CheckCircle2 className="size-3.5" />
          {formatBRL(Number(sale.amount) || 0)}
        </span>
      </div>

      {hasAnyUtm ? (
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {utmRows.map((row) => {
            const parsed = parseUtmValue(row.value)
            const filled = !!row.value
            return (
              <div
                key={row.key}
                className="flex items-center justify-between gap-2 rounded-lg bg-card px-3 py-2"
              >
                <span className="text-[0.7rem] font-medium uppercase tracking-wide text-muted-foreground">
                  {row.label}
                </span>
                <span
                  className={cn(
                    'flex min-w-0 items-center gap-1 truncate text-right text-xs font-medium',
                    filled ? 'text-foreground' : 'text-muted-foreground/50',
                  )}
                >
                  <span className="truncate">{parsed.name}</span>
                  {parsed.id && (
                    <span className="inline-flex shrink-0 items-center gap-0.5 rounded bg-secondary px-1 py-0.5 text-[0.6rem] tabular-nums text-muted-foreground">
                      <Hash className="size-2.5" />
                      {parsed.id}
                    </span>
                  )}
                </span>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="rounded-lg bg-card px-3 py-2 text-xs text-muted-foreground">
          Venda sem parâmetros UTM (tráfego direto ou origem não rastreada).
        </p>
      )}

      {/* fbclid / landing page */}
      {(sale.fbclid || sale.landing_url) && (
        <div className="mt-2 flex flex-col gap-1 border-t border-border/60 pt-2">
          {sale.fbclid && (
            <p className="flex items-center gap-1.5 truncate text-[0.7rem] text-muted-foreground">
              <span className="font-semibold text-sky-400">fbclid</span>
              <span className="truncate">{sale.fbclid}</span>
            </p>
          )}
          {sale.landing_url && (
            <a
              href={sale.landing_url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 truncate text-[0.7rem] text-muted-foreground transition hover:text-primary"
            >
              <Globe className="size-3 shrink-0" />
              <span className="truncate">{sale.landing_url}</span>
              <ExternalLink className="size-2.5 shrink-0" />
            </a>
          )}
        </div>
      )}
    </div>
  )
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Megaphone
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
