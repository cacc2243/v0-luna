'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Ticket } from 'lucide-react'

interface ConfirmAcquireModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  /** Nome da usuária que aparecerá na mensagem. */
  userName: string
  /** Valor do convite em centavos (reflete o preço atual). */
  amountCents: number
}

// Formata centavos como moeda BRL: 2480 -> "24,80"
function formatCents(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function ConfirmAcquireModal({
  isOpen,
  onClose,
  onConfirm,
  userName,
  amountCents,
}: ConfirmAcquireModalProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  if (!isOpen || !mounted) return null

  const displayName = (userName || '').trim() || 'esta usuária'

  return createPortal(
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-acquire-title"
      onClick={onClose}
    >
      <div
        className="relative flex w-full max-w-xs flex-col items-center gap-4 rounded-3xl border border-border bg-card px-6 py-8 text-center shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground"
        >
          <X className="size-4" aria-hidden="true" />
        </button>

        <span className="flex size-12 items-center justify-center rounded-full bg-primary/12 ring-1 ring-primary/30">
          <Ticket className="size-6 text-primary" aria-hidden="true" />
        </span>

        <p
          id="confirm-acquire-title"
          className="text-pretty text-sm font-medium leading-relaxed text-foreground"
        >
          Iremos gerar um convite para a usuária{' '}
          <span className="font-bold text-primary">{displayName}</span>, podemos gerar o PIX de
          pagamento no valor de{' '}
          <span className="font-bold text-foreground">R${formatCents(amountCents)}</span>?
        </p>

        <button
          type="button"
          onClick={onConfirm}
          className="cta-gradient animate-cta-breathe mt-1 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-primary-foreground ring-1 ring-inset ring-white/20 transition-all duration-300 ease-out hover:brightness-110 active:scale-[0.98]"
        >
          Sim, gerar agora!
        </button>
      </div>
    </div>,
    document.body,
  )
}
