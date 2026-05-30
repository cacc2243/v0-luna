'use client'

import { useState } from 'react'
import { ShieldCheck, Lock } from 'lucide-react'
import { CtaButton } from '@/components/cta-button'

export function AgeGate({ onConfirm }: { onConfirm: () => void }) {
  const [leaving, setLeaving] = useState(false)
  const [denied, setDenied] = useState(false)

  const handleConfirm = () => {
    setLeaving(true)
    setTimeout(onConfirm, 320)
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center px-5 transition-opacity duration-300 ${
        leaving ? 'opacity-0' : 'opacity-100'
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="age-gate-title"
    >
      {/* Overlay que escurece a tela inicial ao fundo */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-md" aria-hidden="true" />

      <div
        className={`animate-pop relative w-full max-w-sm overflow-hidden rounded-3xl border border-primary/25 bg-card p-7 text-center shadow-2xl shadow-primary/20 transition-transform duration-300 ${
          leaving ? 'scale-95' : 'scale-100'
        }`}
      >
        {/* Brilho superior */}
        <div
          className="pointer-events-none absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-primary/25 blur-3xl"
          aria-hidden="true"
        />

        <img
          src="/images/luna-prive-logo.png"
          alt="Luna Privé"
          className="relative mx-auto mt-2 h-11 w-auto"
        />

        <h2
          id="age-gate-title"
          className="relative mt-5 text-balance text-xl font-bold leading-tight text-foreground"
        >
          Conteúdo para maiores de idade
        </h2>
        <p className="relative mt-2.5 text-pretty text-sm leading-relaxed text-muted-foreground">
          Para acessar a plataforma, confirme que você tem{' '}
          <span className="font-semibold text-primary">18 anos ou mais</span>.
        </p>

        {/* Selos de confiança */}
        <div className="relative mt-5 flex items-center justify-center gap-4 text-[0.7rem] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Lock className="size-3.5 text-positive" aria-hidden="true" />
            100% sigiloso
          </span>
          <span className="size-1 rounded-full bg-muted-foreground/40" />
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="size-3.5 text-positive" aria-hidden="true" />
            LGPD
          </span>
        </div>

        <div className="relative mt-6">
          <CtaButton onClick={handleConfirm}>Confirmar</CtaButton>
          <button
            type="button"
            onClick={() => setDenied(true)}
            className="mt-4 w-full text-xs text-muted-foreground/70 transition-colors hover:text-muted-foreground"
          >
            Não, sou menor de idade
          </button>
        </div>

        {denied && (
          <p className="relative mt-3 text-pretty text-xs leading-relaxed text-destructive">
            Este conteúdo é exclusivo para maiores de 18 anos. Você não pode continuar.
          </p>
        )}
      </div>
    </div>
  )
}
