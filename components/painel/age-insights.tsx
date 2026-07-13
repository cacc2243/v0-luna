'use client'

import { Cake, Users, TrendingUp, DollarSign, QrCode } from 'lucide-react'
import { formatBRL, type AgeStats } from '@/lib/painel/metrics'

export function AgeInsights({ stats }: { stats: AgeStats }) {
  const { groups, totalWithAge, totalWithoutAge, averageAge, topByPeople, topByRevenue, topByPix } =
    stats

  const maxPeople = Math.max(...groups.map((g) => g.people), 1)

  if (totalWithAge === 0) {
    return (
      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-2 flex items-center gap-2">
          <Cake className="size-4 text-muted-foreground" />
          <h2 className="text-base font-bold text-foreground">Idades no Funil</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Nenhum cadastro com idade informada neste período.
        </p>
      </section>
    )
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-1 flex items-center gap-2">
        <Cake className="size-4 text-primary" />
        <h2 className="text-base font-bold text-foreground">Idades no Funil</h2>
      </div>
      <p className="mb-4 text-xs text-muted-foreground">
        Quem está entrando, gerando PIX e pagando — por faixa etária.
      </p>

      {/* Destaques */}
      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <HighlightCard
          icon={Users}
          iconColor="text-sky-400"
          iconBg="bg-sky-500/15"
          title="Mais cadastros"
          value={topByPeople ? topByPeople.label : '—'}
          sub={topByPeople ? `${topByPeople.people} pessoas` : ''}
        />
        <HighlightCard
          icon={DollarSign}
          iconColor="text-positive"
          iconBg="bg-positive/15"
          title="Mais paga"
          value={topByRevenue ? topByRevenue.label : '—'}
          sub={topByRevenue ? `${formatBRL(topByRevenue.revenue)} · ${topByRevenue.paidCount} vendas` : ''}
        />
        <HighlightCard
          icon={QrCode}
          iconColor="text-amber-400"
          iconBg="bg-amber-500/15"
          title="Mais gera PIX"
          value={topByPix ? topByPix.label : '—'}
          sub={topByPix ? `${topByPix.pixGenerated} PIX gerados` : ''}
        />
      </div>

      {/* Detalhe por faixa etária */}
      <div className="flex flex-col gap-3">
        {groups.map((g) => (
          <div
            key={g.key}
            className={`rounded-xl border p-4 ${
              g.people > 0 ? 'border-border/60 bg-background/40' : 'border-border/40 bg-background/20 opacity-60'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-bold text-foreground">{g.label} anos</p>
              <p className="text-sm font-bold tabular-nums text-foreground">
                {g.people} <span className="text-xs font-normal text-muted-foreground">pessoas</span>
              </p>
            </div>

            {/* Barra proporcional de cadastros */}
            <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-secondary">
              <div
                className="bg-primary"
                style={{ width: `${(g.people / maxPeople) * 100}%` }}
              />
            </div>

            {/* Métricas da faixa */}
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <MiniStat label="PIX gerados" value={String(g.pixGenerated)} />
              <MiniStat label="Vendas" value={String(g.paidCount)} accent />
              <MiniStat
                label="Conversão"
                value={`${g.conversionRate.toFixed(0)}%`}
              />
            </div>
            {g.revenue > 0 && (
              <p className="mt-2 flex items-center justify-end gap-1 text-xs font-semibold text-positive">
                <TrendingUp className="size-3" />
                {formatBRL(g.revenue)} em receita
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Rodapé: média e sem idade */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border/50 pt-3 text-xs text-muted-foreground">
        <span>
          Idade média:{' '}
          <span className="font-semibold text-foreground">
            {averageAge !== null ? `${averageAge} anos` : '—'}
          </span>
        </span>
        <span>
          {totalWithAge} com idade
          {totalWithoutAge > 0 ? ` · ${totalWithoutAge} sem informar` : ''}
        </span>
      </div>
    </section>
  )
}

function HighlightCard({
  icon: Icon,
  iconColor,
  iconBg,
  title,
  value,
  sub,
}: {
  icon: typeof Users
  iconColor: string
  iconBg: string
  title: string
  value: string
  sub: string
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-background/40 p-4">
      <div className="flex items-center gap-2">
        <span className={`flex size-8 items-center justify-center rounded-lg ${iconBg}`}>
          <Icon className={`size-4 ${iconColor}`} />
        </span>
        <p className="text-xs text-muted-foreground">{title}</p>
      </div>
      <p className="mt-2 text-lg font-bold text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}

function MiniStat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-lg bg-secondary/50 py-2">
      <p className={`text-sm font-bold tabular-nums ${accent ? 'text-positive' : 'text-foreground'}`}>
        {value}
      </p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  )
}
