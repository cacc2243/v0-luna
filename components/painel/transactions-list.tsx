'use client'

import { CircleAlert, CheckCircle2, Clock, XCircle } from 'lucide-react'
import { formatBRL, formatDateTime, type InviteRow } from '@/lib/painel/metrics'
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

export function TransactionsList({ invites }: { invites: InviteRow[] }) {
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
          {invites.map((inv) => (
            <div
              key={inv.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/40 px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {inv.email || 'Sem email'}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatDateTime(inv.created_at)}
                  {inv.transaction_id && (
                    <span className="ml-2 font-mono text-[0.65rem] opacity-60">
                      #{inv.transaction_id.slice(0, 8)}
                    </span>
                  )}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-sm font-bold tabular-nums text-foreground">
                  {formatBRL(Number(inv.amount) || 0)}
                </span>
                <StatusBadge status={inv.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
