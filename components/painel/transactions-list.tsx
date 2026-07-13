'use client'

import { useMemo } from 'react'
import { CircleAlert, CheckCircle2, Clock, XCircle, Copy, CopyX, ShieldCheck } from 'lucide-react'
import {
  formatBRL,
  formatDateTime,
  gatewayLabel,
  type InviteRow,
  type ProfileRow,
} from '@/lib/painel/metrics'
import { cn } from '@/lib/utils'

function StatusBadge({ status }: { status: string | null }) {
  const map: Record<string, { label: string; cls: string; icon: typeof CheckCircle2 }> = {
    paid: { label: 'Pago', cls: 'bg-positive/15 text-positive', icon: CheckCircle2 },
    pending: { label: 'Pendente', cls: 'bg-amber-500/15 text-amber-500', icon: Clock },
    expired: { label: 'Expirado', cls: 'bg-muted text-muted-foreground', icon: XCircle },
    refunded: { label: 'Estornado', cls: 'bg-destructive/15 text-destructive', icon: XCircle },
  }
  const conf = map[status || ''] || map.expired
  const Icon = conf.icon
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[0.7rem] font-semibold', conf.cls)}>
      <Icon className="size-3" />
      {conf.label}
    </span>
  )
}

export function TransactionsList({
  invites,
  profiles = [],
}: {
  invites: InviteRow[]
  profiles?: ProfileRow[]
}) {
  // Indexa profiles por id para resolver o nome do usuário via user_id do invite.
  const nameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const p of profiles) {
      const name = p.display_name || p.username
      if (p.id && name) map.set(p.id, name)
    }
    return map
  }, [profiles])

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <h2 className="mb-4 text-base font-bold text-foreground">
        Transações ({invites.length})
      </h2>

      {invites.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <CircleAlert className="size-7 text-muted-foreground/60" />
          <p className="mt-3 text-sm text-muted-foreground">
            Nenhuma transação com este filtro
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {invites.map((inv) => {
            const name = (inv.user_id && nameById.get(inv.user_id)) || null
            const copied = Boolean(inv.pix_copied_at)
            return (
              <div
                key={inv.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/40 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  {/* Nome do usuário (fallback para email) */}
                  <p className="truncate text-sm font-semibold text-foreground">
                    {name || inv.email || 'Sem nome'}
                  </p>
                  {name && (
                    <p className="truncate text-xs text-muted-foreground">
                      {inv.email || 'Sem email'}
                    </p>
                  )}
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatDateTime(inv.created_at)}
                    {inv.transaction_id && (
                      <span className="ml-2 font-mono text-[0.65rem] opacity-60">
                        #{inv.transaction_id.slice(0, 8)}
                      </span>
                    )}
                  </p>
                  {/* Selos: gateway que gerou o PIX + se copiou o código */}
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-1.5 py-0.5 text-[0.65rem] font-medium text-muted-foreground">
                      <ShieldCheck className="size-3" />
                      {gatewayLabel(inv.gateway)}
                    </span>
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[0.65rem] font-medium',
                        copied
                          ? 'bg-sky-500/15 text-sky-400'
                          : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {copied ? <Copy className="size-3" /> : <CopyX className="size-3" />}
                      {copied ? 'Copiou PIX' : 'Não copiou'}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-sm font-bold tabular-nums text-foreground">
                    {formatBRL(Number(inv.amount) || 0)}
                  </span>
                  <StatusBadge status={inv.status} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
