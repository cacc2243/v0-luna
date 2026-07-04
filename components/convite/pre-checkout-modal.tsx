'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Loader2 } from 'lucide-react'

interface PreCheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  /** Avança para a geração do PIX. */
  onConfirm: () => void
  email: string
  amountCents: number
}

export function PreCheckoutModal({ isOpen, onConfirm }: PreCheckoutModalProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const confirmRef = useRef(onConfirm)
  confirmRef.current = onConfirm

  // Assim que o modal abre, aguardamos um breve instante e avançamos
  // automaticamente para a geração do PIX.
  useEffect(() => {
    if (!isOpen) return
    const t = setTimeout(() => confirmRef.current(), 1600)
    return () => clearTimeout(t)
  }, [isOpen])

  if (!isOpen || !mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative flex w-full max-w-xs flex-col items-center gap-4 rounded-3xl border border-border bg-card px-6 py-8 text-center shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <span className="flex size-12 items-center justify-center rounded-full bg-primary/12 ring-1 ring-primary/30">
          <Loader2 className="size-6 animate-spin text-primary" aria-hidden="true" />
        </span>
        <p className="text-pretty text-sm font-medium leading-relaxed text-foreground">
          Aguardando enquanto geramos seu pagamento...
        </p>
      </div>
    </div>,
    document.body,
  )
}
