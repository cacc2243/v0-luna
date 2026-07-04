'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Loader2 } from 'lucide-react'

interface PreCheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  /** Avança/encerra a etapa de geração do PIX. */
  onConfirm: () => void
  email: string
  amountCents: number
  /**
   * Quando o PIX já está 100% pronto para ser exibido. Enquanto false, a
   * animação permanece na tela. Quando não informado (undefined), mantém o
   * comportamento legado de avançar após um tempo fixo.
   */
  ready?: boolean
  /** Tempo mínimo (ms) que a animação fica visível antes de avançar. */
  minMs?: number
}

export function PreCheckoutModal({ isOpen, onConfirm, ready, minMs = 1400 }: PreCheckoutModalProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const confirmRef = useRef(onConfirm)
  confirmRef.current = onConfirm

  // A animação permanece até que (1) o tempo mínimo tenha passado e (2) o PIX
  // esteja pronto. No modo legado (ready === undefined) trata como "sempre
  // pronto" e apenas respeita o tempo mínimo, evitando lacunas na tela.
  const isReady = ready === undefined ? true : ready
  const isReadyRef = useRef(isReady)
  isReadyRef.current = isReady

  useEffect(() => {
    if (!isOpen) return
    const start = performance.now()
    let raf = 0
    const tick = () => {
      const elapsed = performance.now() - start
      if (isReadyRef.current && elapsed >= minMs) {
        confirmRef.current()
        return
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [isOpen, minMs])

  if (!isOpen || !mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
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
