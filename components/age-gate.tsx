'use client'

import { useState } from 'react'
import { CtaButton } from '@/components/cta-button'

export function AgeGate({ onConfirm }: { onConfirm: () => void }) {
  const [leaving, setLeaving] = useState(false)

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
      <div className="absolute inset-0 bg-background/40 backdrop-blur-[2px]" aria-hidden="true" />

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

        <div className="relative mt-6">
          <CtaButton onClick={handleConfirm}>Confirmar</CtaButton>
        </div>
      </div>
    </div>
  )
}
