'use client'

import { useEffect, useRef, useState } from 'react'
import { Lock, Loader2, Gift, ShieldCheck } from 'lucide-react'
import { CtaButton } from '@/components/cta-button'

type Phase = 'success' | 'loading' | 'reward'

export function WelcomePopup({ onClose }: { onClose?: () => void }) {
  const [open, setOpen] = useState(true)
  const [phase, setPhase] = useState<Phase>('success')

  // Notifica o pai quando o modal fecha (para iniciar as notificações de prova social)
  const prevOpen = useRef(false)
  useEffect(() => {
    if (prevOpen.current && !open) onClose?.()
    prevOpen.current = open
  }, [open, onClose])

  // Trava o scroll do body enquanto o modal estiver aberto.
  useEffect(() => {
    if (!open) return
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = original
    }
  }, [open])

  // Etapa 2: animação de "Preparando seu convite..." por 1.5s e avança para o resgate.
  useEffect(() => {
    if (phase !== 'loading') return
    const t = setTimeout(() => setPhase('reward'), 1500)
    return () => clearTimeout(t)
  }, [phase])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="invite-modal-title"
    >
      {/* Backdrop (sem fechar ao tocar — fluxo obrigatório) */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-[2px]" aria-hidden="true" />

      {/* Card */}
      <div className="animate-pop relative w-full max-w-[22.5rem] overflow-hidden rounded-3xl border border-primary/25 bg-card p-6 text-center shadow-2xl shadow-primary/20">
        {/* Brilho superior */}
        <div
          className="pointer-events-none absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-primary/25 blur-3xl"
          aria-hidden="true"
        />

        <img
          src="/images/luna-prive-logo.png"
          alt="Luna Privé"
          className="relative mx-auto mt-1 h-6 w-auto"
        />

        {/* Etapa 1: Conta criada com sucesso */}
        {phase === 'success' && (
          <div key="success" className="animate-pop relative">
            <div className="relative mx-auto mt-5 flex size-16 items-center justify-center">
              <span className="absolute inset-0 rounded-full border border-primary/30" aria-hidden="true" />
              <span className="absolute inset-1.5 rounded-full bg-primary/10" aria-hidden="true" />
              <Lock className="relative size-7 text-primary" aria-hidden="true" />
            </div>

            <h2
              id="invite-modal-title"
              className="relative mt-4 text-balance text-lg font-bold leading-tight text-foreground"
            >
              Código de Convite
            </h2>
            <p className="relative mt-2.5 text-pretty text-[0.8rem] leading-relaxed text-muted-foreground">
              Apenas usuárias convidadas podem se inscrever na plataforma. Digite seu código abaixo
              para ativar sua conta.
            </p>

            {/* Campo desativado — o código só é liberado pelo botão de resgate */}
            <label htmlFor="invite-code-input" className="sr-only">
              Código de convite
            </label>
            <input
              id="invite-code-input"
              type="text"
              disabled
              placeholder="DIGITE SEU CÓDIGO"
              className="relative mt-4 w-full cursor-not-allowed rounded-xl border border-border bg-background px-3.5 py-3 text-center text-sm font-semibold tracking-[0.2em] text-foreground placeholder:text-muted-foreground/45"
            />

            <p className="relative mt-3 text-pretty text-[0.75rem] font-medium leading-relaxed text-primary">
              Os códigos grátis estão desativados no momento, desbloqueie seu código no botão abaixo:
            </p>

            <p className="relative mt-3 rounded-xl border border-border bg-background px-3.5 py-2.5 text-[0.8rem] text-muted-foreground">
              Restam apenas <span className="font-bold text-primary">08</span> códigos hoje
            </p>

            <div className="relative mt-4">
              <CtaButton onClick={() => setPhase('loading')} className="animate-cta-pulse">
                <Gift className="size-4" aria-hidden="true" />
                Resgatar meu convite
              </CtaButton>
            </div>
          </div>
        )}

        {/* Etapa 2: Loading — Preparando seu convite... */}
        {phase === 'loading' && (
          <div key="loading" className="animate-pop relative flex flex-col items-center py-8">
            <Loader2 className="size-10 animate-spin text-primary" aria-hidden="true" />
            <p
              className="mt-4 text-base font-bold text-foreground"
              role="status"
              aria-live="polite"
            >
              Preparando seu convite...
            </p>
            <p className="mt-1.5 text-pretty text-[0.8rem] leading-relaxed text-muted-foreground">
              Verificando disponibilidade para você.
            </p>
          </div>
        )}

        {/* Etapa 3: Resgate liberado */}
        {phase === 'reward' && (
          <div key="reward" className="animate-pop relative">
            <div className="relative mx-auto mt-5 flex size-16 items-center justify-center">
              <span className="absolute inset-0 animate-ping rounded-full bg-primary/20" aria-hidden="true" />
              <span className="absolute inset-0 rounded-full border border-primary/40" aria-hidden="true" />
              <span className="absolute inset-1.5 rounded-full bg-primary/10" aria-hidden="true" />
              <Gift className="relative size-8 text-primary" aria-hidden="true" />
            </div>

            <h2 className="relative mt-4 text-balance text-lg font-bold leading-tight text-foreground">
              Restam poucos convites disponíveis!
            </h2>
            <p className="relative mt-2.5 text-pretty text-[0.8rem] leading-relaxed text-muted-foreground">
              Existem convites para serem resgatados com uma{' '}
              <span className="font-semibold text-primary">condição especial</span> que pode encerrar
              a qualquer momento! Toque abaixo e resgate agora mesmo o seu.
            </p>
            <p className="relative mt-2.5 text-pretty text-[0.8rem] font-medium leading-relaxed text-foreground">
              Será um prazer ter você aqui conosco!
            </p>

            <div className="relative mt-5">
              <CtaButton onClick={() => setOpen(false)} className="animate-cta-pulse">
                Resgatar Meu Convite
              </CtaButton>
            </div>

            <p className="relative mt-3.5 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="size-3.5 text-primary" aria-hidden="true" />
              Acesso 100% sigiloso e seguro
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
