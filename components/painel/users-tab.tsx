'use client'

import { useState } from 'react'
import useSWR from 'swr'
import {
  Search,
  UserRound,
  Loader2,
  Ban,
  ShieldCheck,
  Trash2,
  AlertTriangle,
  Clock,
  X,
} from 'lucide-react'
import type { AdminUser } from '@/app/api/admin/users/route'
import { cn } from '@/lib/utils'

const fetcher = async (url: string) => {
  const r = await fetch(url)
  const json = await r.json()
  if (!r.ok || json?.error) throw new Error(json?.error || 'fetch_failed')
  return json as { users: AdminUser[]; total: number; fetchedAt: string }
}

function formatBRL(value: number | null) {
  if (value == null) return '—'
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDateTime(value: string | null) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return '—'
  }
}

type PendingAction =
  | { kind: 'delete'; user: AdminUser }
  | { kind: 'ban'; user: AdminUser }
  | { kind: 'unban'; user: AdminUser }

export function UsersTab() {
  const [query, setQuery] = useState('')
  const [submitted, setSubmitted] = useState('')
  const [pending, setPending] = useState<PendingAction | null>(null)
  const [working, setWorking] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const key = `/api/admin/users${submitted ? `?q=${encodeURIComponent(submitted)}` : ''}`
  const { data, error, isLoading, mutate, isValidating } = useSWR(key, fetcher, {
    revalidateOnFocus: false,
    keepPreviousData: true,
  })

  const users = data?.users || []

  function runSearch(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(query.trim())
  }

  async function confirmAction() {
    if (!pending) return
    setWorking(true)
    setActionError(null)
    try {
      let res: Response
      if (pending.kind === 'delete') {
        res = await fetch('/api/admin/users', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: pending.user.id }),
        })
      } else {
        res = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: pending.user.id,
            action: pending.kind === 'ban' ? 'ban' : 'unban',
          }),
        })
      }
      const json = await res.json()
      if (!res.ok || json?.error) throw new Error(json?.error || 'Falha na operação')
      setPending(null)
      await mutate()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Erro inesperado')
    } finally {
      setWorking(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <form
        onSubmit={runSearch}
        className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 focus-within:border-primary/60"
      >
        <Search className="size-4 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por email, usuário, nome ou ID..."
          className="w-full bg-transparent px-2 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/60"
        />
        {submitted && (
          <button
            type="button"
            onClick={() => {
              setQuery('')
              setSubmitted('')
            }}
            aria-label="Limpar busca"
            className="text-muted-foreground transition hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
        <button
          type="submit"
          className="shrink-0 rounded-lg bg-primary px-3.5 py-1.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          Buscar
        </button>
      </form>

      <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
        <h2 className="mb-1 text-base font-bold text-foreground">
          Usuários {data ? `(${data.total})` : ''}
        </h2>
        <p className="mb-4 text-xs text-muted-foreground">
          Banir bloqueia o acesso da conta. Excluir remove a conta e todos os dados vinculados de
          forma permanente.
        </p>

        {isLoading && !data ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        ) : error ? (
          <p className="py-10 text-center text-sm text-destructive">
            Erro ao carregar usuários.
          </p>
        ) : users.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            {submitted ? 'Nenhum usuário encontrado para essa busca.' : 'Nenhum usuário.'}
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {users.map((u) => {
              const title = u.displayName || u.username || u.email || 'Usuário'
              return (
                <div
                  key={u.id}
                  className="flex flex-col gap-3 rounded-xl border border-border/60 bg-background/40 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={cn(
                        'flex size-9 shrink-0 items-center justify-center rounded-full',
                        u.banned ? 'bg-destructive/15' : 'bg-primary/15',
                      )}
                    >
                      <UserRound
                        className={cn('size-4', u.banned ? 'text-destructive' : 'text-primary')}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-1.5 text-sm font-medium text-foreground">
                        <span className="truncate">{title}</span>
                        {u.username && (
                          <span className="text-xs text-muted-foreground">@{u.username}</span>
                        )}
                        {u.banned && (
                          <span className="rounded bg-destructive/15 px-1.5 py-0.5 text-[0.6rem] font-semibold uppercase text-destructive">
                            Banido
                          </span>
                        )}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {u.email || 'sem email'}
                      </p>
                      <p className="mt-0.5 flex items-center gap-2 text-[0.7rem] text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="size-3" />
                          {formatDateTime(u.createdAt)}
                        </span>
                        <span>Saldo {formatBRL(u.balance)}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {u.banned ? (
                      <button
                        onClick={() => {
                          setActionError(null)
                          setPending({ kind: 'unban', user: u })
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-secondary"
                      >
                        <ShieldCheck className="size-3.5" />
                        Desbanir
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setActionError(null)
                          setPending({ kind: 'ban', user: u })
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-400 transition hover:bg-amber-500/20"
                      >
                        <Ban className="size-3.5" />
                        Banir
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setActionError(null)
                        setPending({ kind: 'delete', user: u })
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-1.5 text-xs font-semibold text-destructive transition hover:bg-destructive/20"
                    >
                      <Trash2 className="size-3.5" />
                      Excluir
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {isValidating && data && (
          <p className="mt-3 text-center text-xs text-muted-foreground">Atualizando...</p>
        )}
      </section>

      {pending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            aria-label="Fechar"
            onClick={() => !working && setPending(null)}
            className="absolute inset-0 bg-background/70 backdrop-blur-sm"
          />
          <div className="relative w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-2xl">
            <div className="mb-3 flex items-center gap-2.5">
              <div
                className={cn(
                  'flex size-10 items-center justify-center rounded-full',
                  pending.kind === 'unban' ? 'bg-primary/15' : 'bg-destructive/15',
                )}
              >
                {pending.kind === 'unban' ? (
                  <ShieldCheck className="size-5 text-primary" />
                ) : (
                  <AlertTriangle className="size-5 text-destructive" />
                )}
              </div>
              <h3 className="text-base font-bold text-foreground">
                {pending.kind === 'delete'
                  ? 'Excluir conta'
                  : pending.kind === 'ban'
                    ? 'Banir conta'
                    : 'Desbanir conta'}
              </h3>
            </div>

            <p className="mb-4 text-sm text-muted-foreground">
              {pending.kind === 'delete' ? (
                <>
                  Esta ação é <strong className="text-foreground">permanente</strong>. A conta{' '}
                  <strong className="text-foreground">
                    {pending.user.email || pending.user.username || pending.user.id}
                  </strong>{' '}
                  e todos os dados vinculados (packs, vendas, conversas, transações) serão
                  removidos.
                </>
              ) : pending.kind === 'ban' ? (
                <>
                  A conta{' '}
                  <strong className="text-foreground">
                    {pending.user.email || pending.user.username || pending.user.id}
                  </strong>{' '}
                  ficará impedida de fazer login até ser desbanida.
                </>
              ) : (
                <>
                  A conta{' '}
                  <strong className="text-foreground">
                    {pending.user.email || pending.user.username || pending.user.id}
                  </strong>{' '}
                  poderá fazer login novamente.
                </>
              )}
            </p>

            {actionError && (
              <p className="mb-3 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {actionError}
              </p>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setPending(null)}
                disabled={working}
                className="flex-1 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-secondary disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmAction}
                disabled={working}
                className={cn(
                  'flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50',
                  pending.kind === 'unban'
                    ? 'bg-primary text-primary-foreground hover:opacity-90'
                    : 'bg-destructive text-destructive-foreground hover:opacity-90',
                )}
              >
                {working && <Loader2 className="size-4 animate-spin" />}
                {pending.kind === 'delete'
                  ? 'Excluir'
                  : pending.kind === 'ban'
                    ? 'Banir'
                    : 'Desbanir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
