'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

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
        className="relative flex w-full max-w-xs flex-col overflow-hidden rounded-3xl border border-border bg-card text-center shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-3 top-3 z-10 flex size-8 items-center justify-center rounded-full bg-black/40 text-white/90 backdrop-blur-sm transition hover:bg-black/60 hover:text-white"
        >
          <X className="size-4" aria-hidden="true" />
        </button>

        {/* Banner do topo */}
        <img
          src="/images/convite-banner.png"
          alt="Seu Convite Luna Privé está a um passo: seguro e privado, sem exposição do seu nome e pagamento via PIX"
          className="aspect-[2/1] w-full object-cover"
        />

        <div className="flex flex-col gap-4 px-6 pb-7 pt-6">
          <p
            id="confirm-acquire-title"
            className="text-pretty text-center text-sm leading-relaxed text-muted-foreground"
          >
            Vamos gerar um convite para a usuária{' '}
            <span className="font-semibold text-foreground">{displayName}</span>. Confirma a geração
            do PIX de pagamento?
          </p>

          {/* Destaque do valor */}
          <div className="flex flex-col items-center gap-1 rounded-2xl border border-primary/25 bg-primary/5 px-4 py-3.5">
            <span className="text-[0.7rem] font-medium uppercase tracking-wider text-muted-foreground">
              Valor do convite
            </span>
            <span className="whitespace-nowrap text-3xl font-extrabold leading-none tracking-tight text-primary tabular-nums">
              R$ {formatCents(amountCents)}
            </span>
          </div>

          <button
            type="button"
            onClick={onConfirm}
            className="cta-gradient animate-cta-breathe flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-primary-foreground ring-1 ring-inset ring-white/20 transition-all duration-300 ease-out hover:brightness-110 active:scale-[0.98]"
          >
            Sim, gerar agora!
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
