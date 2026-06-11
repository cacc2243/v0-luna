'use client'

import { useMemo, useState } from 'react'
import { Search, Wallet, TrendingUp, UserRound, ArrowUpDown } from 'lucide-react'
import { formatBRL, type ProfileRow } from '@/lib/painel/metrics'
import { cn } from '@/lib/utils'

interface BalancesTabProps {
  profiles: ProfileRow[]
}

type SortKey = 'balance' | 'earned' | 'recent'

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'balance', label: 'Maior saldo' },
  { key: 'earned', label: 'Mais faturou' },
  { key: 'recent', label: 'Mais recentes' },
]

export function BalancesTab({ profiles }: BalancesTabProps) {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortKey>('balance')

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = profiles.filter((p) => {
      if (!q) return true
      return (
        (p.username || '').toLowerCase().includes(q) ||
        (p.display_name || '').toLowerCase().includes(q)
      )
    })
    return filtered.sort((a, b) => {
      if (sort === 'recent') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
      if (sort === 'earned') {
        return (Number(b.total_earned) || 0) - (Number(a.total_earned) || 0)
      }
      return (Number(b.balance) || 0) - (Number(a.balance) || 0)
    })
  }, [profiles, query, sort])

  const totals = useMemo(() => {
    let balance = 0
    let earned = 0
    for (const p of profiles) {
      balance += Number(p.balance) || 0
      earned += Number(p.total_earned) || 0
    }
    return { balance, earned, count: profiles.length }
  }, [profiles])

  return (
    <div className="flex flex-col gap-4">
      {/* Totais agregados */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SummaryCard
          icon={Wallet}
          label="Saldo total na plataforma"
          value={formatBRL(totals.balance)}
          tone="primary"
        />
        <SummaryCard
          icon={TrendingUp}
          label="Total já faturado"
          value={formatBRL(totals.earned)}
          tone="positive"
        />
        <SummaryCard
          icon={UserRound}
          label="Usuárias com conta"
          value={String(totals.count)}
          tone="muted"
        />
      </div>

      {/* Busca */}
      <div className="flex items-center rounded-xl border border-border bg-card px-3 focus-within:border-primary/60">
        <Search className="size-4 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por usuária ou nome..."
          className="w-full bg-transparent px-2 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/60"
        />
      </div>

      {/* Ordenação */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
          <ArrowUpDown className="size-3.5" />
          Ordenar:
        </span>
        {SORTS.map((s) => (
          <button
            key={s.key}
            onClick={() => setSort(s.key)}
            className={cn(
              'rounded-full px-3.5 py-1.5 text-sm font-medium transition',
              sort === s.key
                ? 'bg-primary text-primary-foreground'
                : 'bg-card text-muted-foreground hover:text-foreground',
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
        <h2 className="mb-4 text-base font-bold text-foreground">
          Saldos das usuárias ({rows.length})
        </h2>

        {rows.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Nenhuma usuária encontrada.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {rows.map((p) => {
              const title = p.display_name || p.username || 'Sem nome'
              const balance = Number(p.balance) || 0
              const earned = Number(p.total_earned) || 0
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/40 px-4 py-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15">
                      <UserRound className="size-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{title}</p>
                      {p.username && (
                        <p className="truncate text-xs text-muted-foreground">@{p.username}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-0.5">
                    <span className="text-sm font-bold tabular-nums text-foreground">
                      {formatBRL(balance)}
                    </span>
                    <span className="text-[0.7rem] text-muted-foreground">
                      Faturou {formatBRL(earned)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Wallet
  label: string
  value: string
  tone: 'primary' | 'positive' | 'muted'
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'flex size-8 items-center justify-center rounded-lg',
            tone === 'primary' && 'bg-primary/15 text-primary',
            tone === 'positive' && 'bg-positive/15 text-positive',
            tone === 'muted' && 'bg-secondary text-muted-foreground',
          )}
        >
          <Icon className="size-4" />
        </span>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
      </div>
      <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">{value}</p>
    </div>
  )
}
