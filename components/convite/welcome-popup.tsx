'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Lock,
  Zap,
  Crown,
  Info,
  Sparkles,
  ChevronRight,
  Loader2,
  VenusAndMars,
} from 'lucide-react'

type Step = 'verifying' | 'input' | 'paid'

const CODES_LEFT = 11
const CODES_TOTAL = 50

/* Cabeçalho compartilhado por todos os estados do modal */
function AccessHeader() {
  return (
    <div className="flex items-center gap-3.5">
      <span className="relative flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary">
        <Lock className="size-5" aria-hidden="true" />
        <span
          className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-primary ring-2 ring-card"
          aria-hidden="true"
        />
      </span>
      <div className="text-left leading-tight">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-primary">
          Acesso privado
        </p>
        <h2
          id="invite-modal-title"
          className="mt-0.5 text-xl font-extrabold text-foreground"
        >
          Código de <span className="text-primary">Acesso</span>
        </h2>
      </div>
    </div>
  )
}

export function WelcomePopup({ onClose }: { onClose?: () => void }) {
  const [open, setOpen] = useState(true)
  const [step, setStep] = useState<Step>('verifying')

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

  // Estado inicial "verificando" avança automaticamente para a inserção do código.
  useEffect(() => {
    if (step !== 'verifying') return
    const t = setTimeout(() => setStep('input'), 3200)
    return () => clearTimeout(t)
  }, [step])

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
      <div className="animate-pop relative flex max-h-[90dvh] w-full max-w-sm flex-col overflow-hidden rounded-3xl bg-card shadow-2xl shadow-primary/25">
        {/* Borda em gradiente: forte no topo, suavizando até a base */}
        <div
          className="pointer-events-none absolute inset-0 z-20 rounded-3xl"
          aria-hidden="true"
          style={{
            padding: '1.25px',
            background:
              'linear-gradient(to bottom, oklch(0.56 0.23 9 / 0.95), oklch(0.6 0.21 10 / 0.32) 45%, oklch(0.62 0.21 12 / 0.08) 100%)',
            WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
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
          <div className="absolute inset-0 bg-card/70" />
          <div className="absolute inset-0 bg-gradient-to-b from-card/40 via-card/65 to-card/90" />
        </div>

        {/* Conteúdo */}
        <div className="relative z-10 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 pb-7 pt-7">
          <AccessHeader />

          {/* Estado: Verificando disponibilidade */}
          {step === 'verifying' && (
            <>
              <p
                className="text-pretty text-sm leading-relaxed text-muted-foreground"
                role="status"
                aria-live="polite"
              >
                Verificando disponibilidade de códigos na sua região...
              </p>

              <div className="grid grid-cols-6 gap-2" aria-hidden="true">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex aspect-square items-center justify-center rounded-xl border border-border/60 bg-background/50"
                  >
                    <Loader2 className="size-4 animate-spin text-primary/70" />
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-border/60 bg-background/50 px-4 py-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Códigos restantes hoje</p>
                  <p className="text-sm font-bold">
                    <span className="text-primary">{CODES_LEFT}</span>{' '}
                    <span className="text-muted-foreground">/ {CODES_TOTAL}</span>
                  </p>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border/60">
                  <div
                    className="luna-gradient h-full rounded-full transition-all"
                    style={{ width: `${(CODES_LEFT / CODES_TOTAL) * 100}%` }}
                  />
                </div>
              </div>

              <button
                type="button"
                disabled
                className="flex w-full items-center justify-center gap-2.5 rounded-2xl border border-border/70 bg-background/40 py-4 text-base font-bold text-muted-foreground"
              >
                <Loader2 className="size-5 animate-spin" aria-hidden="true" />
                Verificando...
              </button>
            </>
          )}

          {/* Estado: Inserir código */}
          {step === 'input' && (
            <>
              <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
                Plataforma fechada. Insira seu código para garantir sua entrada anônima e segura no
                Luna Privé.
              </p>

              <div className="grid grid-cols-6 gap-2" aria-hidden="true">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex aspect-square items-center justify-center rounded-xl border border-border/60 bg-background/50"
                  >
                    <span className="size-1.5 rounded-full bg-muted-foreground/40" />
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2.5 rounded-2xl border border-primary/40 bg-primary/[0.07] px-4 py-3">
                <Sparkles className="size-4 shrink-0 text-primary" aria-hidden="true" />
                <p className="text-pretty text-xs font-medium leading-relaxed text-primary">
                  Códigos grátis esgotados. Desbloqueie abaixo:
                </p>
              </div>

              <button
                type="button"
                onClick={() => setStep('paid')}
                className="cta-gradient flex w-full items-center justify-center gap-2.5 rounded-2xl py-4 text-base font-bold text-primary-foreground transition hover:brightness-110 hover:scale-[1.02] active:scale-[0.98]"
              >
                <VenusAndMars className="size-5" aria-hidden="true" />
                Desbloquear meu código
                <ChevronRight className="size-5" aria-hidden="true" />
              </button>
            </>
          )}

          {/* Estado: Acesso pago */}
          {step === 'paid' && (
            <>
              <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
                Códigos grátis esgotados. Garanta seu acesso pela opção paga abaixo.
              </p>

              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { icon: Lock, label: 'Anônimo' },
                  { icon: Zap, label: 'Imediato' },
                  { icon: Crown, label: 'Vitalício' },
                ].map((b) => (
                  <div
                    key={b.label}
                    className="flex flex-col items-center gap-2 rounded-2xl border border-border/60 bg-background/50 py-3.5"
                  >
                    <b.icon className="size-5 text-primary" aria-hidden="true" />
                    <span className="text-xs font-semibold text-foreground">{b.label}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-start gap-2.5 rounded-2xl border border-border/60 bg-background/40 px-4 py-3">
                <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                <p className="text-pretty text-xs leading-relaxed text-muted-foreground">
                  Quantidade de acessos é{' '}
                  <strong className="font-bold text-foreground">limitada</strong> para{' '}
                  <strong className="font-bold text-foreground">garantir</strong> qualidade da
                  plataforma.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="cta-gradient flex w-full items-center justify-center gap-2.5 rounded-2xl py-4 text-base font-bold text-primary-foreground transition hover:brightness-110 hover:scale-[1.02] active:scale-[0.98]"
              >
                <VenusAndMars className="size-5" aria-hidden="true" />
                Garantir meu acesso
                <ChevronRight className="size-5" aria-hidden="true" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
