'use client'

import { useEffect, useState } from 'react'
import { X, PartyPopper } from 'lucide-react'

export function WelcomePopup() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setOpen(true), 450)
    return () => clearTimeout(t)
  }, [])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-popup-title"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Fechar aviso"
        onClick={() => setOpen(false)}
        className="absolute inset-0 bg-background/70 backdrop-blur-sm"
      />

      {/* Card */}
      <div className="animate-pop luna-border relative w-full max-w-xs overflow-hidden rounded-2xl bg-card px-5 py-6 text-center shadow-2xl shadow-primary/20">
        <button
          type="button"
          aria-label="Fechar"
          onClick={() => setOpen(false)}
          className="absolute right-3 top-3 flex size-7 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" aria-hidden="true" />
        </button>

        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/12 text-primary">
          <PartyPopper className="size-6" aria-hidden="true" />
        </span>

        <h2
          id="welcome-popup-title"
          className="mt-4 text-balance text-lg font-bold leading-tight text-foreground"
        >
          Boas notícias!
        </h2>
        <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">
          Ainda temos convites para o <span className="font-semibold text-primary">Luna Privé</span>{' '}
          disponíveis!
        </p>

        <button
          type="button"
          onClick={() => setOpen(false)}
          className="mt-5 w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground transition hover:scale-[1.02] active:scale-[0.98]"
        >
          Garantir meu convite
        </button>
      </div>
    </div>
  )
}
