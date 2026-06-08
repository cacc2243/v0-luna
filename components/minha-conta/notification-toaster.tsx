'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { ShoppingBag, MessageCircle, X } from 'lucide-react'
import type { Notification } from '@/app/minha-conta/actions'

// ─────────────────────────────────────────────────────────────────────────────
// Toaster estilo notificacao de app: aparece no topo, sobre todo o conteudo,
// com animacao leve de entrada e saida. Dispara ao detectar novas notificacoes
// de venda ("sale") e de mensagem ("message").
// ─────────────────────────────────────────────────────────────────────────────

type ToastKind = 'sale' | 'message'

type Toast = {
  key: string
  kind: ToastKind
  title: string
  description: string
  amount: number | null
  leaving: boolean
}

const DISPLAY_MS = 4200

function brl(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

// Extrai um valor em reais do texto da notificacao (ex.: "por R$ 249,00")
function extractAmount(text: string | null): number | null {
  if (!text) return null
  const match = text.match(/R\$\s*([\d.]+,\d{2})/)
  if (!match) return null
  const normalized = match[1].replace(/\./g, '').replace(',', '.')
  const value = Number.parseFloat(normalized)
  return Number.isFinite(value) ? value : null
}

// Extrai o nome do pack entre aspas (ex.: 'comprar "Pack 03" por...')
function extractPackTitle(text: string | null): string | null {
  if (!text) return null
  const match = text.match(/"([^"]+)"/)
  return match ? match[1] : null
}

interface NotificationToasterProps {
  notifications: Notification[]
}

export function NotificationToaster({ notifications }: NotificationToasterProps) {
  // Exibe apenas UM toast por vez; os demais aguardam na fila.
  const [current, setCurrent] = useState<Toast | null>(null)
  const queue = useRef<Toast[]>([])
  // ids ja vistos para nao re-disparar o mesmo toast
  const seenIds = useRef<Set<string>>(new Set())
  // momento em que o app foi aberto: so notificamos o que nascer depois disso
  const mountedAt = useRef<number>(Date.now())
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  // Mostra o proximo da fila (se houver) quando nada estiver visivel
  const showNext = useCallback(() => {
    const next = queue.current.shift()
    if (!next) return
    setCurrent(next)
    const t = setTimeout(() => dismissRef.current(), DISPLAY_MS)
    timers.current.push(t)
  }, [])

  // Encerra o toast atual com animacao de saida e, ao terminar, exibe o proximo
  const dismiss = useCallback(() => {
    setCurrent((prev) => (prev ? { ...prev, leaving: true } : prev))
    const t = setTimeout(() => {
      setCurrent(null)
      showNext()
    }, 340)
    timers.current.push(t)
  }, [showNext])

  // Ref para permitir que o timer agendado em showNext chame a versao atual de dismiss
  const dismissRef = useRef(dismiss)
  useEffect(() => {
    dismissRef.current = dismiss
  }, [dismiss])

  useEffect(() => {
    // So consideramos notificacoes de venda/mensagem CRIADAS depois que o app
    // foi aberto. Isso evita que notificacoes antigas apareçam em cascata quando
    // os dados carregam (SWR) ou quando o usuario volta ao app.
    const fresh = notifications
      .filter((n) => {
        if (n.type !== 'sale' && n.type !== 'message') return false
        if (seenIds.current.has(n.id)) return false
        const createdMs = new Date(n.created_at).getTime()
        return Number.isFinite(createdMs) && createdMs >= mountedAt.current
      })
      .reverse()

    if (fresh.length === 0) return

    const newToasts: Toast[] = fresh.map((n) => {
      seenIds.current.add(n.id)
      if (n.type === 'sale') {
        const packTitle = extractPackTitle(n.description)
        return {
          key: n.id,
          kind: 'sale' as ToastKind,
          title: packTitle ? `Você vendeu o ${packTitle}` : 'Nova venda realizada',
          description: 'agora',
          amount: extractAmount(n.description),
          leaving: false,
        }
      }
      return {
        key: n.id,
        kind: 'message' as ToastKind,
        title: n.title,
        description: n.description ?? '',
        amount: null,
        leaving: false,
      }
    })

    // Enfileira os novos toasts e, se nada estiver visivel, mostra o primeiro
    queue.current.push(...newToasts)
    if (!current) showNext()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications])

  useEffect(() => {
    const all = timers.current
    return () => {
      all.forEach(clearTimeout)
    }
  }, [])

  if (!current) return null

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[80] flex flex-col items-center px-3 pt-[max(0.75rem,env(safe-area-inset-top))]"
      role="region"
      aria-live="polite"
      aria-label="Notificações"
    >
      <ToastCard key={current.key} toast={current} onClose={() => dismiss()} />
    </div>
  )
}

function ToastCard({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const isSale = toast.kind === 'sale'
  const Icon = isSale ? ShoppingBag : MessageCircle

  return (
    <div
      className={`pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl border border-border bg-card/95 px-3.5 py-3 shadow-xl shadow-black/30 backdrop-blur-md ${
        toast.leaving ? 'animate-toast-leave' : 'animate-toast-enter'
      }`}
    >
      <span
        className={`flex size-11 shrink-0 items-center justify-center rounded-full ${
          isSale ? 'bg-primary/15 text-primary' : 'bg-accent/15 text-accent'
        }`}
      >
        <Icon className="size-5" aria-hidden="true" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-foreground">{toast.title}</p>
        <p className="truncate text-xs text-muted-foreground">
          {toast.description || 'agora'}
        </p>
      </div>

      {isSale && toast.amount != null && (
        <span className="shrink-0 text-sm font-bold text-primary">+{brl(toast.amount)}</span>
      )}

      <button
        type="button"
        onClick={onClose}
        aria-label="Fechar notificação"
        className="shrink-0 rounded-full p-1 text-muted-foreground/70 transition hover:bg-muted hover:text-foreground"
      >
        <X className="size-4" />
      </button>
    </div>
  )
}
