'use client'

import { useMemo, useState } from 'react'
import { Search, UserRound, CheckCircle2, Mail, Clock, MessageCircle } from 'lucide-react'
import {
  buildLeads,
  formatBRL,
  formatDateTime,
  type InviteRow,
  type ProfileRow,
} from '@/lib/painel/metrics'
import { cn } from '@/lib/utils'

interface ClientsTabProps {
  profiles: ProfileRow[]
  invites: InviteRow[]
}

type ClientFilter = 'all' | 'buyers' | 'leads' | 'chat'

export function ClientsTab({ profiles, invites }: ClientsTabProps) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<ClientFilter>('all')

  const leads = useMemo(() => buildLeads(invites, profiles), [invites, profiles])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return leads.filter((l) => {
      if (filter === 'buyers' && l.paidCount === 0) return false
      if (filter === 'leads' && l.paidCount > 0) return false
      if (filter === 'chat' && !(l.chatPaid || l.chatUnlocked)) return false
      if (!q) return true
      return (
        (l.email || '').toLowerCase().includes(q) ||
        (l.username || '').toLowerCase().includes(q) ||
        (l.name || '').toLowerCase().includes(q)
      )
    })
  }, [leads, query, filter])

  const buyersCount = leads.filter((l) => l.paidCount > 0).length
  const chatCount = leads.filter((l) => l.chatPaid || l.chatUnlocked).length

  const FILTERS: { key: ClientFilter; label: string; count: number }[] = [
    { key: 'all', label: 'Todos', count: leads.length },
    { key: 'buyers', label: 'Compradores', count: buyersCount },
    { key: 'leads', label: 'Leads', count: leads.length - buyersCount },
    { key: 'chat', label: 'Chat Exclusivo', count: chatCount },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center rounded-xl border border-border bg-card px-3 focus-within:border-primary/60">
        <Search className="size-4 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por email, usuário ou nome..."
          className="w-full bg-transparent px-2 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/60"
        />
      </div>

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

      <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
        <h2 className="mb-4 text-base font-bold text-foreground">
          Clientes ({filtered.length})
        </h2>

        {filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Nenhum cliente encontrado.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((lead) => {
              const title =
                lead.name || lead.username || lead.email || 'Lead anônimo'
              const isBuyer = lead.paidCount > 0
              return (
                <div
                  key={lead.key}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/40 px-4 py-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={cn(
                        'flex size-9 shrink-0 items-center justify-center rounded-full',
                        isBuyer ? 'bg-positive/15' : 'bg-primary/15',
                      )}
                    >
                      {lead.hasAccount ? (
                        <UserRound
                          className={cn(
                            'size-4',
                            isBuyer ? 'text-positive' : 'text-primary',
                          )}
                        />
                      ) : (
                        <Mail
                          className={cn(
                            'size-4',
                            isBuyer ? 'text-positive' : 'text-primary',
                          )}
                        />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-1.5 truncate text-sm font-medium text-foreground">
                        {title}
                        {lead.hasAccount && (
                          <span className="rounded bg-sky-500/15 px-1 py-0.5 text-[0.6rem] font-semibold text-sky-400">
                            CONTA
                          </span>
                        )}
                        {lead.invitePaid && (
                          <span className="rounded bg-primary/15 px-1 py-0.5 text-[0.6rem] font-semibold text-primary">
                            CONVITE
                          </span>
                        )}
                        {(lead.chatPaid || lead.chatUnlocked) && (
                          <span className="inline-flex items-center gap-0.5 rounded bg-emerald-500/15 px-1 py-0.5 text-[0.6rem] font-semibold text-emerald-400">
                            <MessageCircle className="size-2.5" />
                            CHAT
                          </span>
                        )}
                      </p>
                      <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                        <Clock className="size-3 shrink-0" />
                        {formatDateTime(lead.firstSeen)}
                        {lead.email && lead.email !== title ? ` · ${lead.email}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    {isBuyer ? (
                      <span className="inline-flex items-center gap-1 text-sm font-bold tabular-nums text-positive">
                        <CheckCircle2 className="size-3.5" />
                        {formatBRL(lead.totalPaid)}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Sem compras</span>
                    )}
                    <span
                      className={cn(
                        'text-[0.7rem] font-medium',
                        isBuyer ? 'text-foreground' : 'text-muted-foreground',
                      )}
                    >
                      {lead.pixGenerated} PIX · {lead.paidCount} pago
                      {lead.paidCount === 1 ? '' : 's'}
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
