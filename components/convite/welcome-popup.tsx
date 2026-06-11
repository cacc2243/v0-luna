'use client'

import { useEffect, useRef, useState } from 'react'
import { Gift, ChevronRight, ShieldCheck } from 'lucide-react'

type Step = 'intro' | 'loading' | 'surprise' | 'closing'

const CODES_LEFT = 11

function CircleLoader({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-5 py-2">
      <span className="relative flex size-20 items-center justify-center" aria-hidden="true">
        {/* Anel de fundo + anel girando */}
        <svg className="size-20 animate-spin [animation-duration:1.1s]" viewBox="0 0 50 50">
          <circle
            cx="25"
            cy="25"
            r="20"
            fill="none"
            className="stroke-border"
            strokeWidth="4"
          />
          <circle
            cx="25"
            cy="25"
            r="20"
            fill="none"
            className="stroke-primary"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="125.6"
            strokeDashoffset="88"
          />
        </svg>
        <Gift className="absolute size-7 text-primary" />
      </span>
      <p
        className="text-pretty text-center text-sm font-medium leading-relaxed text-muted-foreground"
        role="status"
        aria-live="polite"
      >
        {label}
      </p>
    </div>
  )
}

export function WelcomePopup() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>('intro')
  const [code, setCode] = useState('')

  // Abre o modal automaticamente ao entrar na tela.
  useEffect(() => {
    const t = setTimeout(() => setOpen(true), 350)
    return () => clearTimeout(t)
  }, [])

  // Trava o scroll do body enquanto o modal estiver aberto.
  useEffect(() => {
    if (!open) return
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = original
    }
  }, [open])

  // Loading "buscando convites" -> etapa surpresa.
  useEffect(() => {
    if (step !== 'loading') return
    const t = setTimeout(() => setStep('surprise'), 2600)
    return () => clearTimeout(t)
  }, [step])

  // Loading final (2s) antes de fechar o modal.
  useEffect(() => {
    if (step !== 'closing') return
    const t = setTimeout(() => setOpen(false), 2000)
    return () => clearTimeout(t)
  }, [step])

  if (!open) return null

  const isInputDisabled = step !== 'intro'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="invite-modal-title"
    >
      {/* Backdrop (sem fechar ao tocar — fluxo obrigatório) */}
      <div className="absolute inset-0 bg-background/85 backdrop-blur-md" aria-hidden="true" />

      {/* Card */}
      <div className="animate-pop relative flex max-h-[90dvh] w-full max-w-sm flex-col overflow-hidden rounded-3xl bg-card shadow-2xl shadow-primary/25">
        {/* Borda em gradiente: forte no topo, suavizando até a base */}
        <div
          className="pointer-events-none absolute inset-0 z-20 rounded-3xl"
          aria-hidden="true"
          style={{
            padding: '1.25px',
            background:
              'linear-gradient(to bottom, oklch(0.5 0.15 15 / 0.95), oklch(0.6 0.16 15 / 0.32) 45%, oklch(0.66 0.17 15 / 0.08) 100%)',
            WebkitMask:
              'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
          }}
        />
        {/* Imagem de fundo */}
        <div className="absolute inset-0" aria-hidden="true">
          <img
            src="/images/convite-fundo.jpg"
            alt=""
            className="size-full object-cover object-center"
          />
          {/* Camadas para legibilidade do texto sobre a imagem */}
          <div className="absolute inset-0 bg-card/65" />
          <div className="absolute inset-0 bg-gradient-to-b from-card/30 via-card/60 to-card/90" />
        </div>

        {/* Conteúdo */}
        <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto px-6 pb-7 pt-8 text-center">
          {step === 'loading' || step === 'closing' ? (
            <div className="flex flex-1 flex-col items-center justify-center py-6">
              <h2
                id="invite-modal-title"
                className="text-balance text-xl font-bold leading-tight text-foreground"
              >
                {step === 'loading' ? 'Aguarde um momento' : 'Preparando sua surpresa'}
              </h2>
              <div className="mt-6">
                <CircleLoader
                  label={
                    step === 'loading'
                      ? 'Buscando códigos de convites...'
                      : 'Só um instante...'
                  }
                />
              </div>
            </div>
          ) : (
            <>
              {/* Logo completa */}
              <img
                src="/images/luna-prive-logo.png"
                alt="Luna Privé"
                className="mx-auto h-11 w-auto"
              />

              <h2
                id="invite-modal-title"
                className="mt-5 text-balance text-2xl font-bold leading-tight text-foreground"
              >
                Código de Convite
              </h2>
              <p className="mx-auto mt-2.5 max-w-[18rem] text-pretty text-sm leading-relaxed text-muted-foreground">
                Apenas usuárias convidadas podem se inscrever na plataforma
                {step === 'intro' ? '. Digite seu código abaixo para ativar sua conta.' : '.'}
              </p>

              {/* Campo de código */}
              <input
                type="text"
                inputMode="text"
                autoComplete="off"
                disabled={isInputDisabled}
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="DIGITE SEU CÓDIGO"
                aria-label="Código de convite"
                className="mt-6 w-full rounded-2xl border border-border/70 bg-background/60 px-5 py-3.5 text-center text-sm font-semibold uppercase tracking-[0.25em] text-foreground placeholder:tracking-[0.2em] placeholder:text-muted-foreground/60 focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
              />

              {step === 'intro' && (
                <p className="mt-3.5 text-pretty text-[0.8rem] font-medium leading-relaxed text-primary">
                  Os códigos grátis estão desativados no momento, desbloqueie seu código no botão
                  abaixo:
                </p>
              )}

              {/* Contador de códigos restantes */}
              <div className="mt-3 flex items-center justify-center gap-2 rounded-2xl border border-border/60 bg-background/50 px-5 py-3.5">
                <span className="size-1.5 animate-pulse rounded-full bg-primary" aria-hidden="true" />
                <p className="text-sm text-muted-foreground">
                  Restam apenas <span className="font-bold text-primary">{CODES_LEFT}</span> códigos
                  hoje
                </p>
              </div>

              {/* Bloco surpresa */}
              {step === 'surprise' && (
                <div className="animate-pop mt-3 rounded-2xl border border-primary/50 bg-primary/[0.07] px-5 py-4">
                  <p className="text-pretty text-[0.8rem] leading-relaxed text-muted-foreground">
                    Não disponibilizamos mais convites gratuitos.
                  </p>
                  <p className="mt-1.5 text-balance text-base font-bold leading-snug text-primary">
                    Mas, temos uma surpresa para você...
                  </p>
                </div>
              )}

              {/* Botão de ação */}
              <button
                type="button"
                onClick={() => setStep(step === 'intro' ? 'loading' : 'closing')}
                className="luna-gradient mt-5 flex w-full items-center justify-center gap-2.5 rounded-2xl py-4 text-base font-bold text-primary-foreground shadow-lg shadow-primary/30 transition hover:scale-[1.02] active:scale-[0.98]"
              >
                <Gift className="size-5" aria-hidden="true" />
                {step === 'intro' ? 'Resgatar meu código' : 'Ver surpresa'}
                <ChevronRight className="size-5" aria-hidden="true" />
              </button>

              {step === 'intro' && (
                <p className="mt-4 flex items-center justify-center gap-1.5 text-[0.7rem] text-muted-foreground/80">
                  <ShieldCheck className="size-3.5 text-positive" aria-hidden="true" />
                  Ambiente seguro e verificado
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
