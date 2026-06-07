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
  const [toasts, setToasts] = useState<Toast[]>([])
  // ids ja vistos para nao re-disparar toasts antigos no primeiro carregamento
  const seenIds = useRef<Set<string>>(new Set())
  const initialized = useRef(false)
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>[]>>({})

  const dismiss = useCallback((key: string) => {
    // dispara a animacao de saida e remove apos ela terminar
    setToasts((prev) => prev.map((t) => (t.key === key ? { ...t, leaving: true } : t)))
    const t = setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.key !== key))
    }, 340)
    timers.current[key] = [...(timers.current[key] || []), t]
  }, [])

  useEffect(() => {
    // No primeiro render apenas registra o que ja existe (sem disparar toasts)
    if (!initialized.current) {
      for (const n of notifications) seenIds.current.add(n.id)
      initialized.current = true
      return
    }

    // Detecta notificacoes novas de venda/mensagem (ordem do mais novo p/ mais antigo)
    const fresh = notifications
      .filter((n) => (n.type === 'sale' || n.type === 'message') && !seenIds.current.has(n.id))
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

    // Mantem no maximo 3 toasts simultaneos na pilha
    setToasts((prev) => [...newToasts, ...prev].slice(0, 3))

    // Agenda o auto-dismiss de cada novo toast
    for (const toast of newToasts) {
      const t = setTimeout(() => dismiss(toast.key), DISPLAY_MS)
      timers.current[toast.key] = [...(timers.current[toast.key] || []), t]
    }
  }, [notifications, dismiss])

  useEffect(() => {
    const all = timers.current
    return () => {
      Object.values(all).forEach((arr) => arr.forEach(clearTimeout))
    }
  }, [])

  if (toasts.length === 0) return null

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[80] flex flex-col items-center gap-2 px-3 pt-[max(0.75rem,env(safe-area-inset-top))]"
      role="region"
      aria-live="polite"
      aria-label="Notificações"
    >
      {toasts.map((toast) => (
        <ToastCard key={toast.key} toast={toast} onClose={() => dismiss(toast.key)} />
      ))}
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
