'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  X,
  Send,
  ArrowLeft,
  Loader2,
  MessageCircle,
  Plus,
  Headphones,
  CheckCircle2,
  Clock,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export type SupportTicket = {
  id: string
  user_id: string
  subject: string
  status: 'open' | 'answered' | 'closed'
  last_message: string | null
  last_message_at: string
  unread_count: number
  created_at: string
}

export type SupportMessage = {
  id: string
  ticket_id: string
  user_id: string
  is_from_support: boolean
  content: string
  created_at: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Data helpers (client-side, igual ao resto do app /minha-conta)
// ─────────────────────────────────────────────────────────────────────────────

async function getSupportTickets(): Promise<SupportTicket[]> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) return []

  const { data, error } = await supabase
    .from('support_tickets')
    .select('*')
    .eq('user_id', user.id)
    .order('last_message_at', { ascending: false })

  if (error) {
    console.error('[v0] getSupportTickets error:', error.message)
    return []
  }
  return (data || []) as SupportTicket[]
}

async function getSupportMessages(ticketId: string): Promise<SupportMessage[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('support_messages')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[v0] getSupportMessages error:', error.message)
    return []
  }
  return (data || []) as SupportMessage[]
}

async function createSupportTicket(subject: string, message: string) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) return { error: 'Você precisa estar logado para abrir um ticket.' }

  const cleanSubject = subject.trim() || 'Atendimento'
  const cleanMessage = message.trim()
  if (!cleanMessage) return { error: 'Escreva uma mensagem.' }

  const { data: ticket, error: ticketError } = await supabase
    .from('support_tickets')
    .insert({
      user_id: user.id,
      subject: cleanSubject,
      status: 'open',
      last_message: cleanMessage,
      last_message_at: new Date().toISOString(),
    })
    .select('*')
    .single()

  if (ticketError || !ticket) {
    return { error: ticketError?.message || 'Não foi possível criar o ticket.' }
  }

  const { error: msgError } = await supabase.from('support_messages').insert({
    ticket_id: ticket.id,
    user_id: user.id,
    is_from_support: false,
    content: cleanMessage,
  })

  if (msgError) return { error: msgError.message }

  return { success: true as const, ticket: ticket as SupportTicket }
}

async function sendSupportMessage(ticketId: string, message: string) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) return { error: 'Você precisa estar logado.' }

  const cleanMessage = message.trim()
  if (!cleanMessage) return { error: 'Escreva uma mensagem.' }

  const { data: inserted, error: msgError } = await supabase
    .from('support_messages')
    .insert({
      ticket_id: ticketId,
      user_id: user.id,
      is_from_support: false,
      content: cleanMessage,
    })
    .select('*')
    .single()

  if (msgError) return { error: msgError.message }

  await supabase
    .from('support_tickets')
    .update({
      last_message: cleanMessage,
      last_message_at: new Date().toISOString(),
      status: 'open',
    })
    .eq('id', ticketId)
    .eq('user_id', user.id)

  return { success: true as const, message: inserted as SupportMessage }
}

const WHATSAPP_NUMBER = '5561981107346'
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  'Olá! Preciso de ajuda com a minha conta na Luna Prive.',
)}`

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

const STATUS_LABEL: Record<SupportTicket['status'], string> = {
  open: 'Em aberto',
  answered: 'Respondido',
  closed: 'Encerrado',
}

type View = 'home' | 'list' | 'chat'

export function SupportModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [view, setView] = useState<View>('home')
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [loadingTickets, setLoadingTickets] = useState(false)

  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null)
  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)

  const [draft, setDraft] = useState('')
  const [subject, setSubject] = useState('')
  const [sending, setSending] = useState(false)
  const [isNewTicket, setIsNewTicket] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const scrollRef = useRef<HTMLDivElement>(null)

  const loadTickets = useCallback(async () => {
    setLoadingTickets(true)
    const data = await getSupportTickets()
    setTickets(data)
    setLoadingTickets(false)
  }, [])

  // Carrega os tickets ao abrir.
  useEffect(() => {
    if (isOpen) {
      setView('home')
      loadTickets()
    }
  }, [isOpen, loadTickets])

  // Rola para a última mensagem.
  useEffect(() => {
    if (view === 'chat') {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
    }
  }, [messages, view])

  const openTicket = useCallback(async (ticket: SupportTicket) => {
    setActiveTicket(ticket)
    setIsNewTicket(false)
    setView('chat')
    setLoadingMessages(true)
    const data = await getSupportMessages(ticket.id)
    setMessages(data)
    setLoadingMessages(false)
  }, [])

  const startNewTicket = useCallback(() => {
    setActiveTicket(null)
    setMessages([])
    setSubject('')
    setDraft('')
    setIsNewTicket(true)
    setView('chat')
  }, [])

  const handleSend = useCallback(async () => {
    const content = draft.trim()
    if (!content || sending) return
    setSending(true)
    setErrorMsg(null)

    if (isNewTicket && !activeTicket) {
      const res = await createSupportTicket(subject, content)
      if ('success' in res && res.success) {
        setActiveTicket(res.ticket)
        setIsNewTicket(false)
        setDraft('')
        const data = await getSupportMessages(res.ticket.id)
        setMessages(data)
        loadTickets()
      } else {
        setErrorMsg('error' in res ? res.error : 'Não foi possível abrir o ticket.')
      }
    } else if (activeTicket) {
      const res = await sendSupportMessage(activeTicket.id, content)
      if ('success' in res && res.success) {
        setMessages((prev) => [...prev, res.message])
        setDraft('')
        loadTickets()
      } else {
        setErrorMsg('error' in res ? res.error : 'Não foi possível enviar a mensagem.')
      }
    }
    setSending(false)
  }, [draft, sending, isNewTicket, activeTicket, subject, loadTickets])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
      {/* Overlay */}
      <button
        type="button"
        aria-label="Fechar suporte"
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />

      {/* Painel */}
      <div className="relative flex h-[88vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl border border-border bg-card shadow-2xl sm:h-[640px] sm:rounded-3xl">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-3.5">
          {view !== 'home' ? (
            <button
              type="button"
              onClick={() => setView(view === 'chat' ? 'list' : 'home')}
              className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition active:scale-95"
              aria-label="Voltar"
            >
              <ArrowLeft className="size-5" />
            </button>
          ) : (
            <span className="flex size-9 items-center justify-center rounded-full bg-primary/10">
              <Headphones className="size-5 text-primary" />
            </span>
          )}
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-foreground">
              {view === 'chat'
                ? activeTicket?.subject || 'Novo atendimento'
                : view === 'list'
                  ? 'Meus tickets'
                  : 'Suporte'}
            </h2>
            <p className="text-[0.7rem] text-muted-foreground">
              {view === 'chat' ? 'Resposta em até 24h' : 'Como podemos ajudar?'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition active:scale-95"
            aria-label="Fechar"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* HOME */}
        {view === 'home' && (
          <div className="flex-1 overflow-y-auto px-4 py-5">
            {/* WhatsApp */}
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4 transition active:scale-[0.99]"
            >
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <MessageCircle className="size-6 text-primary" />
              </span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Conversar no WhatsApp</p>
                <p className="text-xs text-muted-foreground">Atendimento direto e rápido</p>
              </div>
              <span className="rounded-full bg-primary px-3 py-1 text-[0.7rem] font-semibold text-primary-foreground">
                Abrir
              </span>
            </a>

            {/* Chat via ticket */}
            <div className="mt-4 rounded-2xl border border-border bg-background/40 p-4">
              <div className="flex items-center gap-3">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-secondary">
                  <Headphones className="size-6 text-foreground" />
                </span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">Chat online via ticket</p>
                  <p className="text-xs text-muted-foreground">Abra um chamado e acompanhe aqui</p>
                </div>
              </div>
              <button
                type="button"
                onClick={startNewTicket}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition active:scale-[0.99]"
              >
                <Plus className="size-4" />
                Abrir novo ticket
              </button>
            </div>

            {/* Tickets em aberto */}
            <div className="mt-6">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Meus tickets
                </h3>
                {tickets.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setView('list')}
                    className="text-xs font-medium text-primary"
                  >
                    Ver todos
                  </button>
                )}
              </div>

              {loadingTickets ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="size-5 animate-spin text-muted-foreground" />
                </div>
              ) : tickets.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
                  Você ainda não tem tickets abertos.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {tickets.slice(0, 3).map((t) => (
                    <TicketRow key={t.id} ticket={t} onClick={() => openTicket(t)} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* LIST */}
        {view === 'list' && (
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {loadingTickets ? (
              <div className="flex justify-center py-6">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : tickets.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
                Nenhum ticket encontrado.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {tickets.map((t) => (
                  <TicketRow key={t.id} ticket={t} onClick={() => openTicket(t)} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* CHAT */}
        {view === 'chat' && (
          <>
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
              {isNewTicket && (
                <div className="mb-4">
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Assunto
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Ex: Dúvida sobre saque"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary"
                  />
                </div>
              )}

              {loadingMessages ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="size-5 animate-spin text-muted-foreground" />
                </div>
              ) : messages.length === 0 && isNewTicket ? (
                <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
                  <span className="flex size-12 items-center justify-center rounded-full bg-primary/10">
                    <Headphones className="size-6 text-primary" />
                  </span>
                  <p className="text-sm font-medium text-foreground">Conte o que está acontecendo</p>
                  <p className="max-w-[15rem] text-xs text-muted-foreground">
                    Nossa equipe responde o mais rápido possível, normalmente em até 24h.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex ${m.is_from_support ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 ${
                          m.is_from_support
                            ? 'rounded-tl-sm bg-secondary text-foreground'
                            : 'rounded-tr-sm bg-primary text-primary-foreground'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                          {m.content}
                        </p>
                        <p
                          className={`mt-1 text-right text-[0.6rem] ${
                            m.is_from_support ? 'text-muted-foreground' : 'text-primary-foreground/70'
                          }`}
                        >
                          {formatTime(m.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-border bg-card px-3 py-3">
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
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSend()
                    }
                  }}
                  rows={isNewTicket ? 3 : 1}
                  placeholder={isNewTicket ? 'Descreva o que está acontecendo...' : 'Digite sua mensagem...'}
                  className="max-h-28 min-h-[2.75rem] flex-1 resize-none rounded-2xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition focus:border-primary"
                />
                {!isNewTicket && (
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={!draft.trim() || sending}
                    className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition active:scale-95 disabled:opacity-40"
                    aria-label="Enviar"
                  >
                    {sending ? (
                      <Loader2 className="size-5 animate-spin" />
                    ) : (
                      <Send className="size-5" />
                    )}
                  </button>
                )}
              </div>

              {isNewTicket && (
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!draft.trim() || sending}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground transition active:scale-[0.98] disabled:opacity-40"
                >
                  {sending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Criando ticket...
                    </>
                  ) : (
                    <>
                      <Plus className="size-4" />
                      Criar ticket de suporte
                    </>
                  )}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function TicketRow({ ticket, onClick }: { ticket: SupportTicket; onClick: () => void }) {
  const isOpen = ticket.status !== 'closed'
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-left transition active:scale-[0.99]"
    >
      <span
        className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
          isOpen ? 'bg-primary/10' : 'bg-secondary'
        }`}
      >
        {isOpen ? (
          <Clock className="size-5 text-primary" />
        ) : (
          <CheckCircle2 className="size-5 text-muted-foreground" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{ticket.subject}</p>
        <p className="truncate text-xs text-muted-foreground">{ticket.last_message}</p>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className="text-[0.65rem] text-muted-foreground">{formatDate(ticket.last_message_at)}</span>
        <span
          className={`rounded-full px-2 py-0.5 text-[0.6rem] font-semibold ${
            isOpen ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'
          }`}
        >
          {STATUS_LABEL[ticket.status]}
        </span>
      </div>
    </button>
  )
}
