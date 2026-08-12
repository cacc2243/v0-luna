'use client'

import { useMemo, useState } from 'react'
import useSWR from 'swr'
import {
  ShieldCheck,
  Search,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Mail,
  LogIn,
  UserCheck,
  Globe,
  AtSign,
  User,
  Copy,
  Check,
  Fingerprint,
  Receipt,
  Monitor,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatBRL, gatewayLabel } from '@/lib/painel/metrics'

interface MedCase {
  id: string
  transactionId: string | null
  product: string
  amount: number
  gateway: string | null
  createdAt: string
  paidAt: string | null
  email: string | null
  username: string | null
  displayName: string | null
  hasAccount: boolean
  clientIp: string | null
  clientUa: string | null
  accessEmail: {
    delivered: boolean
    status: string | null
    providerId: string | null
    sentAt: string | null
  }
  login: {
    loggedIn: boolean
    lastSignInAt: string | null
    loggedInAfterPurchase: boolean
  }
  account: {
    active: boolean
    emailConfirmed: boolean
    banned: boolean
  }
  evidenceScore: number
}

interface MedPayload {
  cases: MedCase[]
  totals: {
    total: number
    fullyDocumented: number
    accessDelivered: number
    loggedIn: number
    withIp: number
  }
  fetchedAt: string
}

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

type MedFilter = 'all' | 'complete' | 'incomplete'

function fmtDateTime(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function MedTab() {
  const { data, error, isLoading, mutate } = useSWR<MedPayload>('/api/admin/med', fetcher, {
    refreshInterval: 15000,
    revalidateOnFocus: true,
    keepPreviousData: true,
  })

  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<MedFilter>('all')

  const cases = data?.cases || []
  const totals = data?.totals

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return cases.filter((c) => {
      if (filter === 'complete' && c.evidenceScore < 5) return false
      if (filter === 'incomplete' && c.evidenceScore >= 5) return false
      if (!q) return true
      return (
        (c.email || '').toLowerCase().includes(q) ||
        (c.username || '').toLowerCase().includes(q) ||
        (c.displayName || '').toLowerCase().includes(q) ||
        (c.transactionId || '').toLowerCase().includes(q) ||
        (c.clientIp || '').toLowerCase().includes(q)
      )
    })
  }, [cases, query, filter])

  if (isLoading && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="size-7 animate-spin text-primary" />
        <p className="mt-3 text-sm text-muted-foreground">Carregando comprovantes...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <AlertTriangle className="size-7 text-destructive" />
        <p className="text-sm text-muted-foreground">Não foi possível carregar os comprovantes.</p>
        <button
          onClick={() => mutate()}
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  const FILTERS: { key: MedFilter; label: string; count: number }[] = [
    { key: 'all', label: 'Todas', count: cases.length },
    { key: 'complete', label: 'Documentação completa', count: totals?.fullyDocumented ?? 0 },
    {
      key: 'incomplete',
      label: 'Faltam evidências',
      count: (totals?.total ?? 0) - (totals?.fullyDocumented ?? 0),
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      {/* Explicação */}
      <section className="flex items-start gap-3 rounded-2xl border border-primary/25 bg-primary/5 p-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <ShieldCheck className="size-5" />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-foreground">Comprovantes de entrega (MED)</h2>
          <p className="mt-1 text-pretty text-xs leading-relaxed text-muted-foreground">
            Cada compra paga com todas as evidências de entrega e uso do produto — úteis para
            contestar disputas e mediações (MED) junto ao adquirente.
          </p>
        </div>
      </section>

      {/* Métricas resumidas */}
      {totals && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <StatCard label="Compras pagas" value={totals.total} icon={Receipt} />
          <StatCard
            label="Doc. completa"
            value={totals.fullyDocumented}
            icon={ShieldCheck}
            tone="positive"
          />
          <StatCard label="E-mail entregue" value={totals.accessDelivered} icon={Mail} />
          <StatCard label="Logaram" value={totals.loggedIn} icon={LogIn} />
        </div>
      )}

      {/* Busca */}
      <div className="flex items-center rounded-xl border border-border bg-card px-3 focus-within:border-primary/60">
        <Search className="size-4 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por e-mail, usuário, IP ou transação..."
          className="w-full bg-transparent px-2 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/60"
        />
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition',
              filter === f.key
                ? 'bg-primary text-primary-foreground'
                : 'bg-card text-muted-foreground hover:text-foreground',
            )}
          >
            {f.label}
            <span
              className={cn(
                'rounded-full px-1.5 text-xs tabular-nums',
                filter === f.key ? 'bg-primary-foreground/20' : 'bg-secondary',
              )}
            >
              {f.count}
            </span>
          </button>
        ))}
      </div>

      {/* Lista de casos */}
      {filtered.length === 0 ? (
        <p className="py-14 text-center text-sm text-muted-foreground">
          Nenhuma compra encontrada.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((c) => (
            <MedCard key={c.id} med={c} />
          ))}
        </div>
      )}
    </div>
  )
}

function MedCard({ med }: { med: MedCase }) {
  const title = med.displayName || med.username || med.email || 'Cliente'
  const complete = med.evidenceScore >= 5

  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-3 border-b border-border p-4">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={cn(
              'flex size-10 shrink-0 items-center justify-center rounded-xl',
              complete ? 'bg-positive/15 text-positive' : 'bg-amber-500/15 text-amber-500',
            )}
          >
            <ShieldCheck className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-foreground">{title}</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Receipt className="size-3 shrink-0" />
              {med.product}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="text-sm font-bold tabular-nums text-positive">
            {formatBRL(med.amount)}
          </span>
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-[0.6rem] font-semibold',
              complete
                ? 'bg-positive/15 text-positive'
                : 'bg-amber-500/15 text-amber-500',
            )}
          >
            {med.evidenceScore}/5 evidências
          </span>
        </div>
      </div>

      {/* Evidências */}
      <div className="flex flex-col divide-y divide-border/60">
        <Evidence
          icon={Mail}
          ok={med.accessEmail.delivered}
          label="E-mail de acesso entregue"
          okText={
            med.accessEmail.sentAt
              ? `Entregue e recebido em ${fmtDateTime(med.accessEmail.sentAt)}`
              : 'E-mail de acesso enviado à cliente'
          }
          failText="Sem registro de entrega do e-mail de acesso"
          extra={med.accessEmail.providerId ? `ID: ${med.accessEmail.providerId}` : undefined}
        />
        <Evidence
          icon={LogIn}
          ok={med.login.loggedIn}
          label="Acessou a plataforma"
          okText={
            med.login.loggedInAfterPurchase
              ? `Logou após a compra · último acesso ${fmtDateTime(med.login.lastSignInAt)}`
              : `Último acesso em ${fmtDateTime(med.login.lastSignInAt)}`
          }
          failText="Nenhum login registrado"
        />
        <Evidence
          icon={UserCheck}
          ok={med.account.active}
          label="Conta ativa"
          okText={
            med.account.emailConfirmed
              ? 'Conta ativa e e-mail confirmado'
              : 'Conta ativa na plataforma'
          }
          failText={med.account.banned ? 'Conta banida' : 'Conta não confirmada / inexistente'}
        />
        <CopyEvidence
          icon={Globe}
          label="IP de origem"
          value={med.clientIp}
          fallback="IP não capturado"
        />
        <CopyEvidence
          icon={User}
          label="Nome de usuário"
          value={med.username}
          prefix="@"
          fallback={med.hasAccount ? 'Conta sem usuário definido' : 'Sem conta cadastrada'}
        />
        <CopyEvidence
          icon={AtSign}
          label="E-mail cadastrado"
          value={med.email}
          fallback="E-mail não informado"
        />
      </div>

      {/* Rodapé: dados da transação */}
      <div className="flex flex-col gap-2 border-t border-border bg-background/40 p-4">
        <FootRow
          icon={Fingerprint}
          label="Transação"
          value={med.transactionId || '—'}
          copyable={Boolean(med.transactionId)}
        />
        <FootRow icon={Receipt} label="Adquirente" value={gatewayLabel(med.gateway)} />
        <FootRow icon={CheckCircle2} label="Pago em" value={fmtDateTime(med.paidAt)} />
        {med.clientUa && (
          <FootRow icon={Monitor} label="Dispositivo" value={med.clientUa} truncate />
        )}
      </div>
    </article>
  )
}

function Evidence({
  icon: Icon,
  ok,
  label,
  okText,
  failText,
  extra,
}: {
  icon: typeof Mail
  ok: boolean
  label: string
  okText: string
  failText: string
  extra?: string
}) {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <div
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-lg',
          ok ? 'bg-positive/12 text-positive' : 'bg-muted text-muted-foreground',
        )}
      >
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium text-foreground">{label}</p>
          {ok ? (
            <CheckCircle2 className="size-3.5 shrink-0 text-positive" />
          ) : (
            <XCircle className="size-3.5 shrink-0 text-muted-foreground" />
          )}
        </div>
        <p
          className={cn(
            'mt-0.5 text-pretty text-xs leading-relaxed',
            ok ? 'text-muted-foreground' : 'text-amber-500/90',
          )}
        >
          {ok ? okText : failText}
        </p>
        {ok && extra && (
          <p className="mt-0.5 truncate font-mono text-[0.65rem] text-muted-foreground/70">
            {extra}
          </p>
        )}
      </div>
    </div>
  )
}

function CopyEvidence({
  icon: Icon,
  label,
  value,
  prefix,
  fallback,
}: {
  icon: typeof Globe
  label: string
  value: string | null
  prefix?: string
  fallback: string
}) {
  const [copied, setCopied] = useState(false)
  const has = Boolean(value)

  const copy = () => {
    if (!value) return
    navigator.clipboard?.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-lg',
          has ? 'bg-primary/12 text-primary' : 'bg-muted text-muted-foreground',
        )}
      >
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[0.7rem] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p
          className={cn(
            'truncate text-sm font-medium',
            has ? 'text-foreground' : 'text-muted-foreground/70',
          )}
        >
          {has ? `${prefix ?? ''}${value}` : fallback}
        </p>
      </div>
      {has && (
        <button
          onClick={copy}
          aria-label={`Copiar ${label}`}
          className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:text-foreground"
        >
          {copied ? <Check className="size-3.5 text-positive" /> : <Copy className="size-3.5" />}
        </button>
      )}
    </div>
  )
}

function FootRow({
  icon: Icon,
  label,
  value,
  copyable,
  truncate,
}: {
  icon: typeof Receipt
  label: string
  value: string
  copyable?: boolean
  truncate?: boolean
}) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard?.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }
  return (
    <div className="flex items-center gap-2 text-xs">
      <Icon className="size-3.5 shrink-0 text-muted-foreground" />
      <span className="shrink-0 text-muted-foreground">{label}:</span>
      <span
        className={cn(
          'min-w-0 flex-1 font-medium text-foreground',
          truncate ? 'truncate' : 'break-all',
        )}
      >
        {value}
      </span>
      {copyable && (
        <button
          onClick={copy}
          aria-label={`Copiar ${label}`}
          className="flex size-6 shrink-0 items-center justify-center rounded text-muted-foreground transition hover:text-foreground"
        >
          {copied ? <Check className="size-3 text-positive" /> : <Copy className="size-3" />}
        </button>
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string
  value: number
  icon: typeof Receipt
  tone?: 'positive'
}) {
  return (
    <div className="flex flex-col gap-1.5 rounded-2xl border border-border bg-card p-3">
      <div className="flex items-center justify-between">
        <span className="text-[0.7rem] font-medium text-muted-foreground">{label}</span>
        <Icon className={cn('size-3.5', tone === 'positive' ? 'text-positive' : 'text-primary')} />
      </div>
      <span className="text-xl font-bold tabular-nums text-foreground">{value}</span>
    </div>
  )
}
