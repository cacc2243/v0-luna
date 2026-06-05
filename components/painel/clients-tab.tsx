'use client'

import { useMemo, useState } from 'react'
import { Search, UserRound, CheckCircle2 } from 'lucide-react'
import { formatBRL, formatDateTime, isPaid, type InviteRow, type ProfileRow } from '@/lib/painel/metrics'
import { cn } from '@/lib/utils'

interface ClientsTabProps {
  profiles: ProfileRow[]
  invites: InviteRow[]
}

export function ClientsTab({ profiles, invites }: ClientsTabProps) {
  const [query, setQuery] = useState('')

  // Mapeia convites por user_id e por email
  const invitesByUser = useMemo(() => {
    const map = new Map<string, InviteRow[]>()
    for (const inv of invites) {
      const key = inv.user_id || inv.email || ''
      if (!key) continue
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(inv)
    }
    return map
  }, [invites])

  const rows = useMemo(() => {
    return profiles.map((p) => {
      const userInvites = invitesByUser.get(p.id) || []
      const paidInvites = userInvites.filter((i) => isPaid(i.status))
      const totalPaid = paidInvites.reduce((s, i) => s + (Number(i.amount) || 0), 0)
      return {
        profile: p,
        invitesCount: userInvites.length,
        paidCount: paidInvites.length,
        totalPaid,
      }
    })
  }, [profiles, invitesByUser])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(
      (r) =>
        (r.profile.username || '').toLowerCase().includes(q) ||
        (r.profile.display_name || '').toLowerCase().includes(q),
    )
  }, [rows, query])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center rounded-xl border border-border bg-card px-3 focus-within:border-primary/60">
        <Search className="size-4 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por usuário ou nome..."
          className="w-full bg-transparent px-2 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/60"
        />
      </div>

      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-4 text-base font-bold text-foreground">
          Clientes ({filtered.length})
        </h2>

        {filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Nenhum cliente encontrado.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map(({ profile, invitesCount, paidCount, totalPaid }) => (
              <div
                key={profile.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/40 px-4 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15">
                    <UserRound className="size-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {profile.display_name || profile.username || 'Sem nome'}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      @{profile.username || '—'} · {formatDateTime(profile.created_at)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {totalPaid > 0 ? (
                    <span className="inline-flex items-center gap-1 text-sm font-bold tabular-nums text-positive">
                      <CheckCircle2 className="size-3.5" />
                      {formatBRL(totalPaid)}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">Sem compras</span>
                  )}
                  <span
                    className={cn(
                      'text-[0.7rem] font-medium',
                      paidCount > 0 ? 'text-foreground' : 'text-muted-foreground',
                    )}
                  >
                    {invitesCount} PIX · {paidCount} pago{paidCount === 1 ? '' : 's'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
