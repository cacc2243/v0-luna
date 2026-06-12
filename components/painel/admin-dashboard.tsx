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
  ImageIcon,
  ShieldCheck,
  Settings,
  Facebook,
  Mail,
  Wallet,
  Megaphone,
  UserCog,
  Menu,
  X,
} from 'lucide-react'
import { logoutAction } from '@/app/painel/actions'
import { SummaryTab } from './summary-tab'
import { ClientsTab } from './clients-tab'
import { BalancesTab } from './balances-tab'
import { UtmsTab } from './utms-tab'
import { TransactionsTab } from './transactions-tab'
import { GatewayTestTab } from './gateway-test-tab'
import { ImagesTab } from './images-tab'
import { VerificationsTab } from './verifications-tab'
import { SettingsTab } from './settings-tab'
import { PixelTab } from './pixel-tab'
import { EmailsTab } from './emails-tab'
import { UsersTab } from './users-tab'
import {
  PERIOD_LABELS,
  type InviteRow,
  type ProfileRow,
  type PixVerificationRow,
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

type TabKey = 'resumo' | 'clientes' | 'usuarios' | 'saldos' | 'pix' | 'utms' | 'verificacoes' | 'imagens' | 'gateways' | 'config' | 'pixel' | 'emails'

const NAV: { key: TabKey; label: string; icon: typeof LayoutDashboard }[] = [
  { key: 'resumo', label: 'Resumo', icon: LayoutDashboard },
  { key: 'clientes', label: 'Clientes', icon: Users },
  { key: 'usuarios', label: 'Usuários', icon: UserCog },
  { key: 'saldos', label: 'Saldos', icon: Wallet },
  { key: 'pix', label: 'Transações', icon: Receipt },
  { key: 'utms', label: 'UTMs', icon: Megaphone },
  { key: 'verificacoes', label: 'Verificações', icon: ShieldCheck },
  { key: 'imagens', label: 'Imagens', icon: ImageIcon },
  { key: 'gateways', label: 'Gateways', icon: FlaskConical },
  { key: 'pixel', label: 'Pixel', icon: Facebook },
  { key: 'emails', label: 'E-mails', icon: Mail },
  { key: 'config', label: 'Configurações', icon: Settings },
]

const PERIODS: PeriodKey[] = ['today', 'yesterday', '7d', '14d', '30d', 'all']
const STATUSES: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'paid', label: 'Pagos' },
  { key: 'pending', label: 'Pendentes' },
]

const TODAY_LABEL = new Date().toLocaleDateString('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  weekday: 'long',
  day: '2-digit',
  month: 'long',
})

export function AdminDashboard() {
  const [tab, setTab] = useState<TabKey>('resumo')
  const [period, setPeriod] = useState<PeriodKey>('today')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [menuOpen, setMenuOpen] = useState(false)

  const { data, error, isLoading, mutate, isValidating } = useSWR<{
    invites: InviteRow[]
    profiles: ProfileRow[]
    verifications: PixVerificationRow[]
    activeCashinGateway?: string
    gateways?: { id: string; label: string; description: string; configured: boolean }[]
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
  const verifications = data?.verifications || []
  const activeCashinGateway = data?.activeCashinGateway || 'bynet'
  const gateways = data?.gateways || []

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
            <div className="flex min-w-0 items-center gap-3">
              <button
                onClick={() => setMenuOpen(true)}
                aria-label="Abrir menu"
                className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-foreground transition hover:bg-secondary lg:hidden"
              >
                <Menu className="size-5" />
              </button>
              <div className="min-w-0">
                <h1 className="truncate text-xl font-bold tracking-tight text-foreground">
                  {activeNav.label}
                </h1>
                <p className="truncate text-xs capitalize text-muted-foreground">{TODAY_LABEL}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => mutate()}
                aria-label="Atualizar dados"
                className="flex size-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition hover:text-foreground"
              >
                <RefreshCw className={cn('size-4', isValidating && 'animate-spin')} />
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-4xl flex-1 px-4 pb-10 pt-5">
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
              {tab !== 'gateways' && tab !== 'imagens' && tab !== 'verificacoes' && tab !== 'config' && tab !== 'pixel' && tab !== 'emails' && tab !== 'saldos' && tab !== 'usuarios' && (
                <div className="mb-5 flex flex-col gap-3">
                  <PeriodSelect period={period} onChange={setPeriod} />
                  {tab !== 'clientes' && tab !== 'utms' && (
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

              {tab === 'resumo' && (
                <SummaryTab
                  invites={invites}
                  profiles={profiles}
                  period={period}
                  statusFilter={statusFilter}
                  activeCashinGateway={activeCashinGateway}
                  gateways={gateways}
                />
              )}
              {tab === 'pix' && (
                <TransactionsTab
                  invites={invites}
                  profiles={profiles}
                  period={period}
                  statusFilter={statusFilter}
                />
              )}
              {tab === 'clientes' && <ClientsTab profiles={profiles} invites={invites} />}
              {tab === 'usuarios' && <UsersTab />}
              {tab === 'saldos' && <BalancesTab profiles={profiles} />}
              {tab === 'utms' && <UtmsTab invites={invites} period={period} />}
              {tab === 'verificacoes' && <VerificationsTab verifications={verifications} />}
              {tab === 'imagens' && <ImagesTab />}
              {tab === 'gateways' && <GatewayTestTab />}
              {tab === 'pixel' && <PixelTab />}
              {tab === 'emails' && <EmailsTab />}
              {tab === 'config' && <SettingsTab />}
            </>
          )}
        </main>
      </div>

      {/* Drawer lateral mobile */}
      <div
        className={cn(
          'fixed inset-0 z-50 lg:hidden',
          menuOpen ? 'pointer-events-auto' : 'pointer-events-none',
        )}
        aria-hidden={!menuOpen}
      >
        {/* Overlay */}
        <button
          aria-label="Fechar menu"
          onClick={() => setMenuOpen(false)}
          className={cn(
            'absolute inset-0 bg-background/70 backdrop-blur-sm transition-opacity duration-300',
            menuOpen ? 'opacity-100' : 'opacity-0',
          )}
        />
        {/* Painel */}
        <aside
          className={cn(
            'absolute inset-y-0 left-0 flex w-72 max-w-[82%] flex-col border-r border-border bg-card p-4 shadow-2xl transition-transform duration-300 ease-out',
            menuOpen ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Sparkles className="size-5" />
              </div>
              <div>
                <p className="text-sm font-bold leading-tight text-foreground">Luna Privé</p>
                <p className="text-xs text-muted-foreground">Painel Admin</p>
              </div>
            </div>
            <button
              onClick={() => setMenuOpen(false)}
              aria-label="Fechar menu"
              className="flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:text-foreground"
            >
              <X className="size-5" />
            </button>
          </div>

          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
            {NAV.map((n) => {
              const Icon = n.icon
              const active = tab === n.key
              return (
                <button
                  key={n.key}
                  onClick={() => {
                    setTab(n.key)
                    setMenuOpen(false)
                  }}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition',
                    active
                      ? 'bg-primary/15 text-primary'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                  )}
                >
                  <Icon className="size-[1.15rem]" />
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
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-destructive transition hover:bg-destructive/10"
              >
                <LogOut className="size-[1.15rem]" />
                Sair
              </button>
            </form>
          </div>
        </aside>
      </div>
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
