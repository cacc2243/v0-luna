'use client'

import { useEffect, useRef, useState } from 'react'
import { Gift, ChevronRight } from 'lucide-react'

type Step = 'intro' | 'loading' | 'surprise'

const CODES_LEFT = 11

export function WelcomePopup() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>('intro')
  const [code, setCode] = useState('')
  const [progress, setProgress] = useState(0)

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

  // Anima a barra de progresso e avança para a etapa "surpresa".
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null)
  useEffect(() => {
    if (step !== 'loading') return
    setProgress(0)
    progressRef.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          if (progressRef.current) clearInterval(progressRef.current)
          return 100
        }
        return p + 2
      })
    }, 55)
    const done = setTimeout(() => setStep('surprise'), 3000)
    return () => {
      if (progressRef.current) clearInterval(progressRef.current)
      clearTimeout(done)
    }
  }, [step])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="invite-modal-title"
    >
      {/* Backdrop (sem fechar ao tocar — fluxo obrigatório) */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-md" aria-hidden="true" />

      {/* Card */}
      <div className="animate-pop luna-border relative w-full max-w-sm overflow-hidden rounded-3xl bg-card px-6 py-8 text-center shadow-2xl shadow-primary/25">
        {/* Ícone presente */}
        <span
          className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-[0_0_24px_oklch(0.66_0.17_15/0.45)] ring-1 ring-primary/40"
          aria-hidden="true"
        >
          <Gift className="size-7" />
        </span>

        {step === 'loading' ? (
          <>
            <h2 id="invite-modal-title" className="mt-6 text-balance text-2xl font-bold leading-tight text-foreground">
              Aguarde um momento
            </h2>
            <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground" role="status" aria-live="polite">
              Buscando códigos de convites...
            </p>
            <div className="mt-7 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-100 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>
          </>
        ) : (
          <>
            <h2 id="invite-modal-title" className="mt-5 text-balance text-2xl font-bold leading-tight text-foreground">
              Código de Convite
            </h2>
            <p className="mt-3 text-pretty text-sm leading-relaxed text-muted-foreground">
              Apenas usuárias convidadas podem se inscrever na plataforma
              {step === 'intro' ? '. Digite seu código abaixo para ativar sua conta.' : '.'}
            </p>

            {/* Campo de código */}
            <input
              type="text"
              inputMode="text"
              autoComplete="off"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="DIGITE SEU CÓDIGO"
              aria-label="Código de convite"
              className="mt-6 w-full rounded-2xl border border-border/70 bg-background/50 px-5 py-4 text-center text-sm font-semibold uppercase tracking-[0.25em] text-foreground placeholder:text-muted-foreground/70 focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />

            {step === 'intro' && (
              <p className="mt-4 text-pretty text-sm font-medium leading-relaxed text-primary">
                Os códigos grátis estão desativados no momento, desbloqueie seu código no botão abaixo:
              </p>
            )}

            {/* Contador de códigos restantes */}
            <div className="mt-4 rounded-2xl border border-border/60 bg-background/50 px-5 py-4">
              <p className="text-sm text-muted-foreground">
                Restam apenas <span className="font-bold text-primary">{CODES_LEFT}</span> códigos hoje
              </p>
            </div>

            {/* Bloco surpresa */}
            {step === 'surprise' && (
              <div className="animate-pop mt-4 rounded-2xl border border-primary/50 bg-primary/5 px-5 py-5">
                <p className="text-pretty text-sm leading-relaxed text-foreground">
                  Não disponibilizamos mais convites gratuitos.
                </p>
                <p className="mt-2 text-balance text-lg font-bold leading-snug text-primary">
                  Mas, temos uma surpresa para você...
                </p>
              </div>
            )}

            {/* Botão de ação */}
            <button
              type="button"
              onClick={() => (step === 'intro' ? setStep('loading') : setOpen(false))}
              className="luna-gradient mt-6 flex w-full items-center justify-center gap-2.5 rounded-2xl py-4 text-base font-bold text-primary-foreground shadow-lg shadow-primary/30 transition hover:scale-[1.02] active:scale-[0.98]"
            >
              {step === 'intro' ? (
                <>
                  <Gift className="size-5" aria-hidden="true" />
                  Resgatar meu código
                  <ChevronRight className="size-5" aria-hidden="true" />
                </>
              ) : (
                <>
                  <Gift className="size-5" aria-hidden="true" />
                  Ver surpresa
                  <ChevronRight className="size-5" aria-hidden="true" />
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
