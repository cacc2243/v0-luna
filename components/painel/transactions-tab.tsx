'use client'

import { useMemo, useState } from 'react'
import {
  Search,
  UserRound,
  Mail,
  ChevronDown,
  Clock,
  CheckCircle2,
  CircleDashed,
  XCircle,
  Receipt,
  Copy,
  Check,
} from 'lucide-react'
import {
  buildLeads,
  formatBRL,
  formatDateTime,
  getPeriodRange,
  isInRange,
  isPaid,
  isPending,
  productOf,
  PRODUCT_META,
  type InviteRow,
  type ProfileRow,
  type PeriodKey,
  type StatusFilter,
  type Lead,
} from '@/lib/painel/metrics'
import { cn } from '@/lib/utils'

interface TransactionsTabProps {
  invites: InviteRow[]
  profiles: ProfileRow[]
  period: PeriodKey
  statusFilter: StatusFilter
}

// Cor/rotulo do status de um PIX
function statusInfo(status: string | null) {
  if (isPaid(status)) {
    return {
      label: 'Pago',
      icon: CheckCircle2,
      className: 'bg-positive/15 text-positive',
    }
  }
  if (isPending(status)) {
    return {
      label: 'Pendente',
      icon: CircleDashed,
      className: 'bg-amber-500/15 text-amber-400',
    }
  }
  return {
    label: 'Expirado',
    icon: XCircle,
    className: 'bg-muted text-muted-foreground',
  }
}

export function TransactionsTab({
  invites,
  profiles,
  period,
  statusFilter,
}: TransactionsTabProps) {
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  // 1) Filtra os PIX pelo periodo e status selecionados no header
  const filteredInvites = useMemo(() => {
    const range = getPeriodRange(period)
    return invites.filter((inv) => {
      if (!isInRange(inv.created_at, range)) return false
      if (statusFilter === 'paid' && !isPaid(inv.status)) return false
      if (statusFilter === 'pending' && !isPending(inv.status)) return false
      return true
    })
  }, [invites, period, statusFilter])

  // 2) Agrupa as transacoes por cliente e mantem apenas quem teve PIX no filtro
  const groups = useMemo(() => {
    const leads = buildLeads(filteredInvites, profiles).filter(
      (l) => l.invites.length > 0,
    )
    // Ordena cada cliente pelo PIX mais recente
    for (const l of leads) {
      l.invites.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )
    }
    // Ordena clientes pela transacao mais recente
    return leads.sort((a, b) => {
      const aLast = a.invites[0]?.created_at ?? a.firstSeen
      const bLast = b.invites[0]?.created_at ?? b.firstSeen
      return new Date(bLast).getTime() - new Date(aLast).getTime()
    })
  }, [filteredInvites, profiles])

  // 3) Busca por nome/email/usuario
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return groups
    return groups.filter(
      (l) =>
        (l.email || '').toLowerCase().includes(q) ||
        (l.username || '').toLowerCase().includes(q) ||
        (l.name || '').toLowerCase().includes(q),
    )
  }, [groups, query])

  const totalTx = filteredInvites.length
  const totalPaid = filteredInvites.filter((i) => isPaid(i.status)).length
  const totalRevenue = filteredInvites
    .filter((i) => isPaid(i.status))
    .reduce((s, i) => s + (Number(i.amount) || 0), 0)

  function toggle(key: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Resumo rapido do periodo */}
      <div className="grid grid-cols-3 gap-3">
        <StatBox label="Transações" value={String(totalTx)} />
        <StatBox label="Pagas" value={String(totalPaid)} accent="positive" />
        <StatBox label="Faturado" value={formatBRL(totalRevenue)} accent="primary" />
      </div>

      {/* Busca */}
      <div className="flex items-center rounded-xl border border-border bg-card px-3 focus-within:border-primary/60">
        <Search className="size-4 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar cliente por email, usuário ou nome..."
          className="w-full bg-transparent px-2 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/60"
        />
      </div>

      {/* Lista agrupada por cliente */}
      <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
        <h2 className="mb-4 text-base font-bold text-foreground">
          Transações por cliente ({visible.length})
        </h2>

        {visible.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Nenhuma transação encontrada neste período.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {visible.map((lead) => (
              <ClientGroup
                key={lead.key}
                lead={lead}
                open={expanded.has(lead.key)}
                onToggle={() => toggle(lead.key)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function StatBox({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent?: 'positive' | 'primary'
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-background/40 p-3">
      <p className="text-[0.7rem] font-medium text-muted-foreground">{label}</p>
      <p
        className={cn(
          'mt-1 truncate text-lg font-bold tabular-nums',
          accent === 'positive'
            ? 'text-positive'
            : accent === 'primary'
              ? 'text-primary'
              : 'text-foreground',
        )}
      >
        {value}
      </p>
    </div>
  )
}

function ClientGroup({
  lead,
  open,
  onToggle,
}: {
  lead: Lead
  open: boolean
  onToggle: () => void
}) {
  const title = lead.name || lead.username || lead.email || 'Lead anônimo'
  const paidCount = lead.invites.filter((i) => isPaid(i.status)).length
  const lastTx = lead.invites[0]?.created_at ?? lead.firstSeen

  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-background/40">
      {/* Cabecalho do cliente */}
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-secondary/40"
        aria-expanded={open}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={cn(
              'flex size-9 shrink-0 items-center justify-center rounded-full',
              paidCount > 0 ? 'bg-positive/15' : 'bg-primary/15',
            )}
          >
            {lead.hasAccount ? (
              <UserRound
                className={cn(
                  'size-4',
                  paidCount > 0 ? 'text-positive' : 'text-primary',
                )}
              />
            ) : (
              <Mail
                className={cn(
                  'size-4',
                  paidCount > 0 ? 'text-positive' : 'text-primary',
                )}
              />
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{title}</p>
            <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
              <Clock className="size-3 shrink-0" />
              Última: {formatDateTime(lastTx)}
              {lead.email && lead.email !== title ? ` · ${lead.email}` : ''}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-bold tabular-nums text-foreground">
              {formatBRL(lead.totalPaid)}
            </p>
            <p className="text-[0.7rem] text-muted-foreground">
              {lead.invites.length} PIX · {paidCount} pago{paidCount === 1 ? '' : 's'}
            </p>
          </div>
          <ChevronDown
            className={cn(
              'size-4 shrink-0 text-muted-foreground transition-transform',
              open && 'rotate-180',
            )}
          />
        </div>
      </button>

      {/* Lista de PIX do cliente */}
      {open && (
        <div className="border-t border-border/60 bg-card/40 px-3 py-2">
          <div className="flex flex-col gap-1.5">
            {lead.invites.map((inv) => (
              <TransactionRow key={inv.id} invite={inv} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function TransactionRow({ invite }: { invite: InviteRow }) {
  const [copied, setCopied] = useState(false)
  const product = PRODUCT_META[productOf(invite.type)]
  const status = statusInfo(invite.status)
  const StatusIcon = status.icon

  async function copyCode() {
    if (!invite.pix_code) return
    try {
      await navigator.clipboard.writeText(invite.pix_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // ignore
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-background/60 px-3 py-2.5">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-secondary">
          <Receipt className="size-3.5 text-muted-foreground" />
        </span>
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 truncate text-xs font-medium text-foreground">
            {product.label}
            <span
              className={cn(
                'inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[0.6rem] font-semibold',
                status.className,
              )}
            >
              <StatusIcon className="size-2.5" />
              {status.label}
            </span>
          </p>
          <p className="truncate text-[0.7rem] text-muted-foreground">
            Gerado {formatDateTime(invite.created_at)}
            {invite.paid_at ? ` · Pago ${formatDateTime(invite.paid_at)}` : ''}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="text-sm font-bold tabular-nums text-foreground">
          {formatBRL(Number(invite.amount) || 0)}
        </span>
        {invite.pix_code && (
          <button
            onClick={copyCode}
            aria-label="Copiar código PIX"
            className="flex size-7 items-center justify-center rounded-md border border-border text-muted-foreground transition hover:text-foreground"
          >
            {copied ? (
              <Check className="size-3.5 text-positive" />
            ) : (
              <Copy className="size-3.5" />
            )}
          </button>
        )}
      </div>
    </div>
  )
}
