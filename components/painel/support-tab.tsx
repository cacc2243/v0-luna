'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import useSWR from 'swr'
import {
  Loader2,
  Send,
  Headphones,
  UserRound,
  ArrowLeft,
  CheckCircle2,
  RotateCcw,
  Clock,
  Mail,
} from 'lucide-react'
import type { AdminSupportTicket, AdminSupportMessage } from '@/app/api/admin/support/route'
import { cn } from '@/lib/utils'

const fetcher = async (url: string) => {
  const r = await fetch(url)
  const json = await r.json()
  if (!r.ok || json?.error) throw new Error(json?.error || 'fetch_failed')
  return json
}

const STATUS_META: Record<
  AdminSupportTicket['status'],
  { label: string; className: string }
> = {
  open: { label: 'Em aberto', className: 'bg-amber-500/15 text-amber-400' },
  answered: { label: 'Respondido', className: 'bg-primary/15 text-primary' },
  closed: { label: 'Encerrado', className: 'bg-secondary text-muted-foreground' },
}

function formatDateTime(iso: string) {
  try {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return '—'
  }
}

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

function ticketName(t: AdminSupportTicket) {
  return t.display_name || t.username || t.email || 'Usuário'
}

export function SupportTab() {
  const { data, error, isLoading, mutate, isValidating } = useSWR<{
    tickets: AdminSupportTicket[]
    total: number
    openCount: number
    fetchedAt: string
  }>('/api/admin/support', fetcher, {
    refreshInterval: 15000,
    revalidateOnFocus: true,
    keepPreviousData: true,
  })

  const tickets = data?.tickets || []
  const [activeId, setActiveId] = useState<string | null>(null)
  const activeTicket = tickets.find((t) => t.id === activeId) || null

  return (
    <div className="flex flex-col gap-4">
      {/* Cabeçalho com contadores */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="rounded-2xl border border-border bg-card px-4 py-3">
          <p className="text-xs text-muted-foreground">Tickets em aberto</p>
          <p className="text-xl font-bold text-foreground">{data?.openCount ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card px-4 py-3">
          <p className="text-xs text-muted-foreground">Total de tickets</p>
          <p className="text-xl font-bold text-foreground">{data?.total ?? 0}</p>
        </div>
        {isValidating && (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" /> Atualizando
          </span>
        )}
      </div>

      {isLoading && !data ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      ) : error ? (
        <p className="py-10 text-center text-sm text-destructive">Erro ao carregar os tickets.</p>
      ) : tickets.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border py-16 text-center">
          <Headphones className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Nenhum ticket de suporte ainda.</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,22rem)_1fr]">
          {/* Lista de tickets */}
          <div
            className={cn(
              'flex-col gap-2',
              activeTicket ? 'hidden lg:flex' : 'flex',
            )}
          >
            {tickets.map((t) => {
              const meta = STATUS_META[t.status]
              const active = t.id === activeId
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveId(t.id)}
                  className={cn(
                    'flex items-start gap-3 rounded-2xl border p-3 text-left transition',
                    active
                      ? 'border-primary/60 bg-primary/5'
                      : 'border-border bg-card hover:border-primary/30',
                  )}
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary">
                    <UserRound className="size-4 text-foreground" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {ticketName(t)}
                      </p>
                      <span className="shrink-0 text-[0.65rem] text-muted-foreground">
                        {formatDateTime(t.last_message_at)}
                      </span>
                    </div>
                    <p className="truncate text-xs font-medium text-foreground/80">{t.subject}</p>
                    <p className="truncate text-xs text-muted-foreground">{t.last_message}</p>
                    <span
                      className={cn(
                        'mt-1.5 inline-block rounded-full px-2 py-0.5 text-[0.6rem] font-semibold',
                        meta.className,
                      )}
                    >
                      {meta.label}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Conversa */}
          <div className={cn(activeTicket ? 'block' : 'hidden lg:block')}>
            {activeTicket ? (
              <TicketConversation
                ticket={activeTicket}
                onBack={() => setActiveId(null)}
                onChanged={() => mutate()}
              />
            ) : (
              <div className="flex h-full min-h-[24rem] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border text-center">
                <Headphones className="size-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Selecione um ticket para ver a conversa e responder.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function TicketConversation({
  ticket,
  onBack,
  onChanged,
}: {
  ticket: AdminSupportTicket
  onBack: () => void
  onChanged: () => void
}) {
  const { data, isLoading, mutate } = useSWR<{ messages: AdminSupportMessage[] }>(
    `/api/admin/support?ticketId=${ticket.id}`,
    fetcher,
    { refreshInterval: 10000, keepPreviousData: true },
  )
  const messages = data?.messages || []

  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [statusWorking, setStatusWorking] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages])

  const handleSend = useCallback(async () => {
    const content = draft.trim()
    if (!content || sending) return
    setSending(true)
    setErrorMsg(null)
    try {
      const res = await fetch('/api/admin/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: ticket.id, message: content }),
      })
      const json = await res.json()
      if (!res.ok || json?.error) throw new Error(json?.error || 'Falha ao enviar')
      setDraft('')
      await mutate()
      onChanged()
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao enviar')
    } finally {
      setSending(false)
    }
  }, [draft, sending, ticket.id, mutate, onChanged])

  const changeStatus = useCallback(
    async (status: 'open' | 'closed') => {
      setStatusWorking(true)
      setErrorMsg(null)
      try {
        const res = await fetch('/api/admin/support', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ticketId: ticket.id, status }),
        })
        const json = await res.json()
        if (!res.ok || json?.error) throw new Error(json?.error || 'Falha ao atualizar')
        onChanged()
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'Erro ao atualizar')
      } finally {
        setStatusWorking(false)
      }
    },
    [ticket.id, onChanged],
  )

  return (
    <div className="flex h-[calc(100dvh-16rem)] min-h-[26rem] flex-col overflow-hidden rounded-2xl border border-border bg-card">
      {/* Cabeçalho da conversa */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <button
          onClick={onBack}
          className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-secondary lg:hidden"
          aria-label="Voltar"
        >
          <ArrowLeft className="size-5" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-foreground">{ticket.subject}</p>
          <p className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
            <span className="font-medium text-foreground/80">{ticketName(ticket)}</span>
            {ticket.email && (
              <>
                <Mail className="size-3" />
                <span className="truncate">{ticket.email}</span>
              </>
            )}
          </p>
        </div>
        {ticket.status !== 'closed' ? (
          <button
            onClick={() => changeStatus('closed')}
            disabled={statusWorking}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-secondary disabled:opacity-50"
          >
            {statusWorking ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="size-3.5" />
            )}
            Encerrar
          </button>
        ) : (
          <button
            onClick={() => changeStatus('open')}
            disabled={statusWorking}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-secondary disabled:opacity-50"
          >
            {statusWorking ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <RotateCcw className="size-3.5" />
            )}
            Reabrir
          </button>
        )}
      </div>

      {/* Mensagens */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
        {isLoading && !data ? (
          <div className="flex justify-center py-8">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((m) => (
              <div
                key={m.id}
                className={cn('flex', m.is_from_support ? 'justify-end' : 'justify-start')}
              >
                <div
                  className={cn(
                    'max-w-[80%] rounded-2xl px-3.5 py-2.5',
                    m.is_from_support
                      ? 'rounded-tr-sm bg-primary text-primary-foreground'
                      : 'rounded-tl-sm bg-secondary text-foreground',
                  )}
                >
                  <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                    {m.content}
                  </p>
                  <p
                    className={cn(
                      'mt-1 flex items-center justify-end gap-1 text-[0.6rem]',
                      m.is_from_support ? 'text-primary-foreground/70' : 'text-muted-foreground',
                    )}
                  >
                    {!m.is_from_support && <Clock className="size-2.5" />}
                    {formatTime(m.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Resposta */}
      <div className="border-t border-border px-3 py-3">
        {errorMsg && (
          <p className="mb-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {errorMsg}
          </p>
        )}
        <div className="flex items-end gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault()
                handleSend()
              }
            }}
            rows={1}
            placeholder="Escreva a resposta..."
            className="max-h-32 min-h-[2.75rem] flex-1 resize-none rounded-2xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition focus:border-primary"
          />
          <button
            onClick={handleSend}
            disabled={!draft.trim() || sending}
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition active:scale-95 disabled:opacity-40"
            aria-label="Enviar resposta"
          >
            {sending ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5" />}
          </button>
        </div>
      </div>
    </div>
  )
}
