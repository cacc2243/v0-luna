'use client'

import { useMemo, useState } from 'react'
import {
  Search,
  Wallet,
  TrendingUp,
  UserRound,
  ArrowUpDown,
  Pencil,
  Check,
  X,
  Loader2,
  MessageCircleHeart,
  Ban,
  ShieldCheck,
} from 'lucide-react'
import { formatBRL, isPaid, isInviteType, type ProfileRow, type InviteRow } from '@/lib/painel/metrics'
import { cn } from '@/lib/utils'
import { BanUserModal } from '@/components/painel/ban-user-modal'

interface BalancesTabProps {
  profiles: ProfileRow[]
  invites: InviteRow[]
  onUpdated?: () => void
}

type SortKey = 'balance' | 'earned' | 'recent'

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'balance', label: 'Maior saldo' },
  { key: 'earned', label: 'Mais faturou' },
  { key: 'recent', label: 'Mais recentes' },
]

export function BalancesTab({ profiles, invites, onUpdated }: BalancesTabProps) {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortKey>('balance')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [banTarget, setBanTarget] = useState<ProfileRow | null>(null)

  function startEdit(id: string, current: number) {
    setEditingId(id)
    setDraft(current.toFixed(2).replace('.', ','))
    setError(null)
  }

  function cancelEdit() {
    setEditingId(null)
    setDraft('')
    setError(null)
  }

  async function saveEdit(userId: string) {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, balance: draft }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.success) {
        setError(json?.error || 'Falha ao salvar')
        return
      }
      setEditingId(null)
      setDraft('')
      onUpdated?.()
    } catch {
      setError('Erro de conexão')
    } finally {
      setSaving(false)
    }
  }

  // Conjunto de e-mails que pagaram o convite de acesso.
  // O vinculo convite <-> usuaria e feito por EMAIL (o user_id do convite fica nulo),
  // entao so entram na lista as pessoas cujo e-mail tem um convite PAGO.
  const paidEmails = useMemo(() => {
    const set = new Set<string>()
    for (const i of invites) {
      if (i.email && isPaid(i.status) && isInviteType(i.type)) {
        set.add(i.email.trim().toLowerCase())
      }
    }
    return set
  }, [invites])

  // Apenas perfis cujo e-mail consta como convite pago.
  const paidProfiles = useMemo(
    () => profiles.filter((p) => p.email && paidEmails.has(p.email.trim().toLowerCase())),
    [profiles, paidEmails],
  )

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = paidProfiles.filter((p) => {
      if (!q) return true
      return (
        (p.username || '').toLowerCase().includes(q) ||
        (p.display_name || '').toLowerCase().includes(q) ||
        (p.email || '').toLowerCase().includes(q)
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
  }, [paidProfiles, query, sort])

  const totals = useMemo(() => {
    let balance = 0
    let earned = 0
    for (const p of paidProfiles) {
      balance += Number(p.balance) || 0
      earned += Number(p.total_earned) || 0
    }
    return { balance, earned, count: paidProfiles.length }
  }, [paidProfiles])

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
              const editing = editingId === p.id
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/40 px-4 py-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={cn(
                        'flex size-9 shrink-0 items-center justify-center rounded-full',
                        p.banned ? 'bg-destructive/15' : 'bg-primary/15',
                      )}
                    >
                      <UserRound
                        className={cn('size-4', p.banned ? 'text-destructive' : 'text-primary')}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="truncate text-sm font-medium text-foreground">{title}</p>
                        {p.banned && (
                          <span className="rounded bg-destructive/15 px-1.5 py-0.5 text-[0.6rem] font-semibold uppercase text-destructive">
                            Banida
                          </span>
                        )}
                      </div>
                      {p.username && (
                        <p className="truncate text-xs text-muted-foreground">@{p.username}</p>
                      )}
                      {p.chat_unlocked ? (
                        <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[0.65rem] font-semibold text-primary">
                          <MessageCircleHeart className="size-3" />
                          Chat desbloqueado
                        </span>
                      ) : (
                        <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[0.65rem] font-medium text-muted-foreground">
                          Chat bloqueado
                        </span>
                      )}
                    </div>
                  </div>

                  {editing ? (
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center rounded-lg border border-primary/60 bg-background px-2 focus-within:border-primary">
                          <span className="text-xs text-muted-foreground">R$</span>
                          <input
                            autoFocus
                            inputMode="decimal"
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.nativeEvent.isComposing || e.keyCode === 229) return
                              if (e.key === 'Enter') saveEdit(p.id)
                              if (e.key === 'Escape') cancelEdit()
                            }}
                            disabled={saving}
                            className="w-24 bg-transparent px-1.5 py-1.5 text-right text-sm font-bold tabular-nums text-foreground outline-none"
                          />
                        </div>
                        <button
                          onClick={() => saveEdit(p.id)}
                          disabled={saving}
                          aria-label="Salvar saldo"
                          className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
                        >
                          {saving ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Check className="size-4" />
                          )}
                        </button>
                        <button
                          onClick={cancelEdit}
                          disabled={saving}
                          aria-label="Cancelar"
                          className="flex size-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition hover:text-foreground disabled:opacity-60"
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                      {error && <span className="text-[0.7rem] text-destructive">{error}</span>}
                    </div>
                  ) : (
                    <div className="flex shrink-0 items-center gap-3">
                      <div className="flex flex-col items-end gap-0.5">
                        <span className="text-sm font-bold tabular-nums text-foreground">
                          {formatBRL(balance)}
                        </span>
                        <span className="text-[0.7rem] text-muted-foreground">
                          Faturou {formatBRL(earned)}
                        </span>
                      </div>
                      <button
                        onClick={() => startEdit(p.id, balance)}
                        aria-label={`Editar saldo de ${title}`}
                        className="flex size-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition hover:border-primary/60 hover:text-primary"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        onClick={() => setBanTarget(p)}
                        aria-label={p.banned ? `Desbanir ${title}` : `Banir ${title}`}
                        className={cn(
                          'flex size-8 items-center justify-center rounded-lg border transition',
                          p.banned
                            ? 'border-border bg-card text-muted-foreground hover:border-primary/60 hover:text-primary'
                            : 'border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/20',
                        )}
                      >
                        {p.banned ? (
                          <ShieldCheck className="size-3.5" />
                        ) : (
                          <Ban className="size-3.5" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>

      {banTarget && (
        <BanUserModal
          userId={banTarget.id}
          label={banTarget.display_name || banTarget.username || banTarget.email || banTarget.id}
          banned={!!banTarget.banned}
          currentReason={banTarget.ban_reason}
          onClose={() => setBanTarget(null)}
          onDone={() => onUpdated?.()}
        />
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
