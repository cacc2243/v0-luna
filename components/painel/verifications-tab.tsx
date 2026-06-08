'use client'

import { useMemo, useState } from 'react'
import { ShieldCheck, Search, KeyRound, Copy, Check, AlertTriangle } from 'lucide-react'
import type { PixVerificationRow } from '@/lib/painel/metrics'
import { cn } from '@/lib/utils'

const STATUS_META: Record<
  string,
  { label: string; className: string }
> = {
  completed: { label: 'Confirmado', className: 'bg-positive/15 text-positive' },
  pending: { label: 'Enviado', className: 'bg-amber-500/15 text-amber-500' },
  processing: { label: 'Processando', className: 'bg-sky-500/15 text-sky-500' },
  failed: { label: 'Falhou', className: 'bg-destructive/15 text-destructive' },
}

function statusMeta(status: string | null) {
  return STATUS_META[status || ''] || { label: status || '—', className: 'bg-muted text-muted-foreground' }
}

function formatBRL(cents: number | null) {
  return ((cents || 0) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function VerificationsTab({ verifications }: { verifications: PixVerificationRow[] }) {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [copied, setCopied] = useState<string | null>(null)

  const stats = useMemo(() => {
    const total = verifications.length
    const sent = verifications.filter((v) => v.status === 'pending' || v.status === 'completed').length
    const failed = verifications.filter((v) => v.status === 'failed').length
    const totalCents = verifications
      .filter((v) => v.status === 'pending' || v.status === 'completed')
      .reduce((acc, v) => acc + (v.amount_cents || 0), 0)
    const attempts = verifications.reduce((acc, v) => acc + (v.attempts || 0), 0)
    return { total, sent, failed, totalCents, attempts }
  }, [verifications])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return verifications.filter((v) => {
      if (statusFilter !== 'all' && v.status !== statusFilter) return false
      if (!q) return true
      return (
        (v.pix_key || '').toLowerCase().includes(q) ||
        (v.email || '').toLowerCase().includes(q) ||
        (v.transaction_id || '').toLowerCase().includes(q)
      )
    })
  }, [verifications, query, statusFilter])

  const copy = (text: string) => {
    navigator.clipboard?.writeText(text)
    setCopied(text)
    setTimeout(() => setCopied(null), 1500)
  }

  const STATUS_CHIPS = [
    { key: 'all', label: 'Todas' },
    { key: 'completed', label: 'Confirmadas' },
    { key: 'pending', label: 'Enviadas' },
    { key: 'failed', label: 'Falhas' },
  ]

  return (
    <div className="flex flex-col gap-5">
      {/* Cartoes de resumo */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Chaves verificadas" value={String(stats.total)} icon={ShieldCheck} />
        <StatCard label="Valor enviado" value={formatBRL(stats.totalCents)} accent />
        <StatCard label="Envios com sucesso" value={String(stats.sent)} />
        <StatCard label="Falhas" value={String(stats.failed)} danger={stats.failed > 0} />
      </div>

      {/* Aviso de seguranca */}
      <div className="flex items-start gap-2.5 rounded-2xl border border-border bg-card/50 px-4 py-3">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-positive" aria-hidden="true" />
        <p className="text-pretty text-xs leading-relaxed text-muted-foreground">
          Cada chave PIX recebe o valor de verificação{' '}
          <span className="font-semibold text-foreground">uma única vez</span>. O sistema bloqueia
          envios duplicados no nível do banco de dados — novas tentativas só são permitidas se o
          envio anterior tiver falhado. O valor é fixado no servidor e não pode ser alterado.
        </p>
      </div>

      {/* Busca + filtros */}
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por chave, e-mail ou ID da transação"
            className="w-full rounded-xl border border-border bg-card py-2.5 pl-9 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary/60"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUS_CHIPS.map((c) => (
            <button
              key={c.key}
              onClick={() => setStatusFilter(c.key)}
              className={cn(
                'rounded-full px-3.5 py-1.5 text-sm font-medium transition',
                statusFilter === c.key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card text-muted-foreground hover:text-foreground',
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-16 text-center">
          <KeyRound className="size-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Nenhuma verificação encontrada.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filtered.map((v) => {
            const meta = statusMeta(v.status)
            return (
              <div
                key={v.id}
                className="rounded-2xl border border-border bg-card p-4 transition hover:border-border/80"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-secondary px-1.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
                        {v.pix_type || '—'}
                      </span>
                      <span className={cn('rounded-md px-2 py-0.5 text-[0.65rem] font-semibold', meta.className)}>
                        {meta.label}
                      </span>
                    </div>
                    <button
                      onClick={() => v.pix_key && copy(v.pix_key)}
                      className="mt-1.5 flex max-w-full items-center gap-1.5 text-left"
                    >
                      <span className="truncate text-sm font-semibold text-foreground">
                        {v.pix_key || '—'}
                      </span>
                      {copied === v.pix_key ? (
                        <Check className="size-3.5 shrink-0 text-positive" />
                      ) : (
                        <Copy className="size-3.5 shrink-0 text-muted-foreground" />
                      )}
                    </button>
                    {v.email && (
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">{v.email}</p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-base font-bold tabular-nums text-foreground">
                      {formatBRL(v.amount_cents)}
                    </p>
                    <p className="mt-0.5 text-[0.7rem] text-muted-foreground">
                      {formatDate(v.created_at)}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border pt-2.5 text-[0.7rem] text-muted-foreground">
                  <span>
                    Tentativas:{' '}
                    <span className="font-semibold text-foreground">{v.attempts ?? 0}</span>
                  </span>
                  {v.transaction_id && (
                    <button
                      onClick={() => copy(v.transaction_id!)}
                      className="flex items-center gap-1 hover:text-foreground"
                    >
                      ID: <span className="font-mono">{v.transaction_id.slice(0, 12)}…</span>
                      {copied === v.transaction_id ? (
                        <Check className="size-3 text-positive" />
                      ) : (
                        <Copy className="size-3" />
                      )}
                    </button>
                  )}
                </div>

                {v.status === 'failed' && v.last_error && (
                  <div className="mt-2.5 flex items-start gap-2 rounded-xl bg-destructive/10 px-3 py-2">
                    <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-destructive" />
                    <p className="text-[0.7rem] leading-relaxed text-destructive">{v.last_error}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  danger,
}: {
  label: string
  value: string
  icon?: typeof ShieldCheck
  accent?: boolean
  danger?: boolean
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border p-4',
        accent
          ? 'border-primary/30 bg-primary/10'
          : danger
            ? 'border-destructive/30 bg-destructive/10'
            : 'border-border bg-card',
      )}
    >
      <div className="flex items-center gap-1.5">
        {Icon && <Icon className="size-3.5 text-muted-foreground" />}
        <p className="text-[0.7rem] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
      </div>
      <p
        className={cn(
          'mt-1.5 text-xl font-bold tabular-nums',
          accent ? 'text-primary' : danger ? 'text-destructive' : 'text-foreground',
        )}
      >
        {value}
      </p>
    </div>
  )
}
