'use client'

import { useState } from 'react'
import useSWR from 'swr'
import {
  LayoutDashboard,
  Users,
  Receipt,
  FlaskConical,
  RefreshCw,
  LogOut,
  Loader2,
  Sparkles,
  ChevronDown,
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

const fetcher = async (url: string) => {
  const r = await fetch(url)
  if (!r.ok) {
    const err = new Error('fetch_failed') as Error & { status?: number }
    err.status = r.status
    throw err
  }
  const json = await r.json()
  if (json?.error) throw new Error(json.error)
  return json
}

type TabKey = 'resumo' | 'clientes' | 'pix' | 'gateways'

const NAV: { key: TabKey; label: string; icon: typeof LayoutDashboard }[] = [
  { key: 'resumo', label: 'Resumo', icon: LayoutDashboard },
  { key: 'clientes', label: 'Clientes', icon: Users },
  { key: 'pix', label: 'Transações', icon: Receipt },
  { key: 'gateways', label: 'Gateways', icon: FlaskConical },
]

const PERIODS: PeriodKey[] = ['today', 'yesterday', '7d', '14d', '30d', 'all']
const STATUSES: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'paid', label: 'Pagos' },
  { key: 'pending', label: 'Pendentes' },
]

const TODAY_LABEL = new Date().toLocaleDateString('pt-BR', {
  weekday: 'long',
  day: '2-digit',
  month: 'long',
})

export function AdminDashboard() {
  const [tab, setTab] = useState<TabKey>('resumo')
  const [period, setPeriod] = useState<PeriodKey>('today')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const { data, error, isLoading, mutate, isValidating } = useSWR<{
    invites: InviteRow[]
    profiles: ProfileRow[]
    fetchedAt: string
  }>('/api/admin/data', fetcher, {
    refreshInterval: 10000,
    revalidateOnFocus: true,
    keepPreviousData: true,
  })

  const fetchError = error as (Error & { status?: number }) | undefined
  const sessionExpired = fetchError?.status === 401

  const invites = data?.invites || []
  const profiles = data?.profiles || []

  const activeNav = NAV.find((n) => n.key === tab)!

  return (
    <div className="min-h-[100dvh] w-full bg-background lg:flex">
      {/* Sidebar desktop */}
      <aside className="sticky top-0 hidden h-[100dvh] w-64 shrink-0 flex-col border-r border-border bg-card/40 p-4 lg:flex">
        <div className="mb-8 flex items-center gap-2.5 px-2 pt-2">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Sparkles className="size-5" />
          </div>
          <div>
            <p className="text-sm font-bold leading-tight text-foreground">Luna Privé</p>
            <p className="text-xs text-muted-foreground">Painel Admin</p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map((n) => {
            const Icon = n.icon
            const active = tab === n.key
            return (
              <button
                key={n.key}
                onClick={() => setTab(n.key)}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                  active
                    ? 'bg-primary/15 text-primary'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                )}
              >
                <Icon className="size-[1.1rem]" />
                {n.label}
              </button>
            )
          })}
        </nav>

        <div className="flex flex-col gap-2 border-t border-border pt-3">
          <div className="flex items-center gap-2 px-3 py-1 text-xs text-muted-foreground">
            <span className="flex size-2 rounded-full bg-positive">
              <span className="size-2 animate-ping rounded-full bg-positive/70" />
            </span>
            Atualização em tempo real
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-destructive transition hover:bg-destructive/10"
            >
              <LogOut className="size-[1.1rem]" />
              Sair
            </button>
          </form>
        </div>
      </aside>

      {/* Conteudo */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-md">
          <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-3 px-4 py-3.5">
            <div className="min-w-0">
              <h1 className="truncate text-xl font-bold tracking-tight text-foreground">
                {activeNav.label}
              </h1>
              <p className="truncate text-xs capitalize text-muted-foreground">{TODAY_LABEL}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => mutate()}
                aria-label="Atualizar dados"
                className="flex size-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition hover:text-foreground"
              >
                <RefreshCw className={cn('size-4', isValidating && 'animate-spin')} />
              </button>
              {/* Sair (mobile) */}
              <form action={logoutAction} className="lg:hidden">
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
        </header>

        <main className="mx-auto w-full max-w-4xl flex-1 px-4 pb-28 pt-5 lg:pb-10">
          {isLoading && !data ? (
            <div className="flex flex-col items-center justify-center py-24">
              <Loader2 className="size-7 animate-spin text-primary" />
              <p className="mt-3 text-sm text-muted-foreground">Carregando dados...</p>
            </div>
          ) : sessionExpired ? (
            <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
              <p className="text-base font-semibold text-foreground">Sessão expirada</p>
              <p className="max-w-xs text-sm text-muted-foreground">
                Sua sessão de administrador expirou. Faça login novamente para visualizar os
                dados.
              </p>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                >
                  Fazer login
                </button>
              </form>
            </div>
          ) : fetchError ? (
            <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
              <p className="text-base font-semibold text-foreground">
                Erro ao carregar os dados
              </p>
              <p className="max-w-xs text-sm text-muted-foreground">
                Não foi possível buscar as informações. Verifique sua conexão e tente novamente.
              </p>
              <button
                onClick={() => mutate()}
                className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
              >
                Tentar novamente
              </button>
            </div>
          ) : (
            <>
              {tab !== 'gateways' && (
                <div className="mb-5 flex flex-col gap-3">
                  <PeriodSelect period={period} onChange={setPeriod} />
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
              {tab === 'clientes' && <ClientsTab profiles={profiles} invites={invites} />}
              {tab === 'gateways' && <GatewayTestTab />}
            </>
          )}
        </main>
      </div>

      {/* Bottom nav mobile */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-md items-center justify-around px-2 py-2">
          {NAV.map((n) => {
            const Icon = n.icon
            const active = tab === n.key
            return (
              <button
                key={n.key}
                onClick={() => setTab(n.key)}
                className={cn(
                  'flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] font-medium transition',
                  active ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                <Icon className={cn('size-5', active && 'scale-110')} />
                {n.label}
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

function PeriodSelect({
  period,
  onChange,
}: {
  period: PeriodKey
  onChange: (p: PeriodKey) => void
}) {
  return (
    <>
      {/* Chips em telas medias+ */}
      <div className="hidden flex-wrap gap-2 sm:flex">
        {PERIODS.map((p) => (
          <FilterChip key={p} active={period === p} onClick={() => onChange(p)}>
            {PERIOD_LABELS[p]}
          </FilterChip>
        ))}
      </div>
      {/* Dropdown nativo em telas pequenas */}
      <div className="relative sm:hidden">
        <select
          value={period}
          onChange={(e) => onChange(e.target.value as PeriodKey)}
          className="w-full appearance-none rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground outline-none"
        >
          {PERIODS.map((p) => (
            <option key={p} value={p}>
              {PERIOD_LABELS[p]}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      </div>
    </>
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
