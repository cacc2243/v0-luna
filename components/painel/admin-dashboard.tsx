'use client'

import { useState } from 'react'
import useSWR from 'swr'
import {
  TrendingUp,
  Users,
  DollarSign,
  RefreshCw,
  LogOut,
  Loader2,
  FlaskConical,
} from 'lucide-react'
import { logoutAction } from '@/app/painel/actions'
import { SummaryTab } from './summary-tab'
import { ClientsTab } from './clients-tab'
import { GatewayTestTab } from './gateway-test-tab'
import {
  PERIOD_LABELS,
  type InviteRow,
  type ProfileRow,
  type PeriodKey,
  type StatusFilter,
} from '@/lib/painel/metrics'
import { cn } from '@/lib/utils'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type TabKey = 'resumo' | 'clientes' | 'pix' | 'gateways'

const TABS: { key: TabKey; label: string; icon: typeof TrendingUp }[] = [
  { key: 'resumo', label: 'Resumo', icon: TrendingUp },
  { key: 'clientes', label: 'Clientes', icon: Users },
  { key: 'pix', label: 'PIX', icon: DollarSign },
  { key: 'gateways', label: 'Gateways', icon: FlaskConical },
]

const PERIODS: PeriodKey[] = ['today', 'yesterday', '7d', '14d', '30d', 'all']
const STATUSES: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'paid', label: 'Pagos' },
  { key: 'pending', label: 'Pendentes' },
]

export function AdminDashboard() {
  const [tab, setTab] = useState<TabKey>('resumo')
  const [period, setPeriod] = useState<PeriodKey>('today')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  // Tempo real: refaz fetch a cada 10s
  const { data, isLoading, mutate, isValidating } = useSWR<{
    invites: InviteRow[]
    profiles: ProfileRow[]
    fetchedAt: string
  }>('/api/admin/data', fetcher, {
    refreshInterval: 10000,
    revalidateOnFocus: true,
  })

  const invites = data?.invites || []
  const profiles = data?.profiles || []

  return (
    <main className="min-h-[100dvh] w-full bg-background pb-16">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-lg font-bold text-foreground">Painel Admin</h1>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="flex size-1.5 rounded-full bg-positive" />
              Métricas e dados em tempo real
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => mutate()}
              aria-label="Atualizar dados"
              className="flex size-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition hover:text-foreground"
            >
              <RefreshCw className={cn('size-4', isValidating && 'animate-spin')} />
            </button>
            <form action={logoutAction}>
              <button
                type="submit"
                aria-label="Sair"
                className="flex size-9 items-center justify-center rounded-lg bg-destructive/90 text-destructive-foreground transition hover:bg-destructive"
              >
                <LogOut className="size-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Tabs */}
        <div className="mx-auto w-full max-w-3xl overflow-x-auto px-4">
          <nav className="flex min-w-max gap-1 pb-px">
            {TABS.map((t) => {
              const Icon = t.icon
              const active = tab === t.key
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={cn(
                    'flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium transition',
                    active
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground',
                  )}
                >
                  <Icon className="size-4" />
                  {t.label}
                </button>
              )
            })}
          </nav>
        </div>
      </header>

      <div className="mx-auto w-full max-w-3xl px-4 pt-5">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="size-7 animate-spin text-primary" />
            <p className="mt-3 text-sm text-muted-foreground">Carregando dados...</p>
          </div>
        ) : (
          <>
            {/* Filtros (apenas para abas de dados) */}
            {tab !== 'gateways' && (
              <div className="mb-5 flex flex-col gap-3">
                <div className="flex flex-wrap gap-2">
                  {PERIODS.map((p) => (
                    <FilterChip
                      key={p}
                      active={period === p}
                      onClick={() => setPeriod(p)}
                    >
                      {PERIOD_LABELS[p]}
                    </FilterChip>
                  ))}
                </div>
                {tab !== 'clientes' && (
                  <div className="flex flex-wrap gap-2">
                    {STATUSES.map((s) => (
                      <FilterChip
                        key={s.key}
                        active={statusFilter === s.key}
                        onClick={() => setStatusFilter(s.key)}
                      >
                        {s.label}
                      </FilterChip>
                    ))}
                  </div>
                )}
              </div>
            )}

            {(tab === 'resumo' || tab === 'pix') && (
              <SummaryTab
                invites={invites}
                profiles={profiles}
                period={period}
                statusFilter={statusFilter}
              />
            )}
            {tab === 'clientes' && (
              <ClientsTab profiles={profiles} invites={invites} />
            )}
            {tab === 'gateways' && <GatewayTestTab />}
          </>
        )}
      </div>
    </main>
  )
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-full px-3.5 py-1.5 text-sm font-medium transition',
        active
          ? 'bg-primary text-primary-foreground'
          : 'bg-card text-muted-foreground hover:text-foreground',
      )}
    >
      {children}
    </button>
  )
}
