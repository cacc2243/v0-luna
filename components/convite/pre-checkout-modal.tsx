'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  Check,
  Loader2,
  Mail,
  ShieldCheck,
  Gift,
  ChevronRight,
  Sparkles,
  Lock,
} from 'lucide-react'

interface PreCheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  /** Avança para a geração do PIX. */
  onConfirm: () => void
  email: string
  amountCents: number
}

const STEPS = [
  { label: 'Confirmando seus dados', icon: ShieldCheck },
  { label: 'Reservando seu Convite Especial', icon: Gift },
  { label: 'Preparando pagamento seguro via PIX', icon: Lock },
]

function formatCents(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function PreCheckoutModal({
  isOpen,
  onClose,
  onConfirm,
  email,
  amountCents,
}: PreCheckoutModalProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // Quantos passos já foram concluídos (0..STEPS.length). Quando atinge o total,
  // revelamos o CTA para gerar o PIX.
  const [completed, setCompleted] = useState(0)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  // Reinicia e roda a sequência animada sempre que o modal abre.
  useEffect(() => {
    if (!isOpen) return
    setCompleted(0)
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []

    STEPS.forEach((_, i) => {
      const t = setTimeout(() => setCompleted(i + 1), 700 * (i + 1))
      timersRef.current.push(t)
    })

    return () => {
      timersRef.current.forEach(clearTimeout)
      timersRef.current = []
    }
  }, [isOpen])

  if (!isOpen || !mounted) return null

  const done = completed >= STEPS.length
  const progress = Math.round((completed / STEPS.length) * 100)

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/80 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="relative flex max-h-[96dvh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl border border-border bg-card shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300 sm:rounded-3xl sm:zoom-in-95">
        {/* Imagem de fundo (mesma do /convite) */}
        <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
          <img src="/images/background.png" alt="" className="size-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/82 to-background/90" />
        </div>

        {/* Botão fechar */}
        <button
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-4 top-4 z-20 rounded-full bg-background/60 p-2 text-muted-foreground backdrop-blur-sm transition hover:bg-muted hover:text-foreground"
        >
          <X className="size-5" />
        </button>

        <div className="relative z-10 overflow-y-auto px-5 pb-6 pt-7 sm:px-7">
          {/* Header */}
          <div className="flex flex-col items-center text-center">
            <img src="/images/luna-prive-logo.png" alt="Luna Privé" className="h-7 w-auto" />

            <div className="relative mt-5 flex size-16 items-center justify-center">
              {/* Glow rosa suave atras do icone */}
              <span
                className="absolute inset-0 rounded-full bg-primary/30 blur-xl"
                aria-hidden="true"
              />
              <span className="relative flex size-16 items-center justify-center rounded-2xl bg-primary/12 ring-1 ring-primary/30">
                {done ? (
                  <Sparkles className="size-7 text-primary" aria-hidden="true" />
                ) : (
                  <Loader2 className="size-7 animate-spin text-primary" aria-hidden="true" />
                )}
              </span>
            </div>

            <h2 className="mt-4 text-balance text-xl font-extrabold leading-tight tracking-tight text-foreground sm:text-2xl">
              {done ? 'Convite Especial pronto!' : 'Gerando seu Convite Especial'}
            </h2>
            <p className="mt-1 text-pretty text-sm text-muted-foreground">
              {done
                ? 'É só concluir o pagamento via PIX para liberar tudo.'
                : 'Estamos preparando seu acesso exclusivo ao Luna Privé.'}
            </p>
          </div>

          {/* Barra de progresso */}
          <div className="mt-6 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="cta-gradient h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Checklist animado */}
          <ul className="mt-5 flex flex-col gap-2.5">
            {STEPS.map((step, i) => {
              const isDone = completed > i
              const isActive = completed === i
              const StepIcon = step.icon
              return (
                <li
                  key={step.label}
                  className={`flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all duration-300 ${
                    isDone
                      ? 'border-primary/40 bg-primary/[0.06]'
                      : isActive
                        ? 'border-border/70 bg-background/50'
                        : 'border-border/40 bg-background/30 opacity-55'
                  }`}
                >
                  <span
                    className={`flex size-8 shrink-0 items-center justify-center rounded-full transition-colors ${
                      isDone
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-muted-foreground'
                    }`}
                  >
                    {isDone ? (
                      <Check className="size-4" aria-hidden="true" />
                    ) : isActive ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <StepIcon className="size-4" aria-hidden="true" />
                    )}
                  </span>
                  <span
                    className={`text-sm font-medium ${
                      isDone || isActive ? 'text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    {step.label}
                  </span>
                </li>
              )
            })}
          </ul>

          {/* Confirmação dos dados */}
          <div className="mt-5 rounded-2xl border border-border/60 bg-background/50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Confirme seus dados
            </p>
            <div className="mt-3 flex items-center gap-2.5">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary">
                <Mail className="size-3.5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] text-muted-foreground">Código enviado para</p>
                <p className="truncate text-sm font-semibold text-foreground">
                  {email || 'seu e-mail'}
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-3">
              <span className="text-sm text-muted-foreground">Valor do convite</span>
              <span className="text-sm font-bold text-foreground">R${formatCents(amountCents)}</span>
            </div>
          </div>

          {/* Aviso de imediaticidade */}
          <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-primary/30 bg-primary/[0.06] px-4 py-3">
            <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
            <p className="text-pretty text-xs font-medium leading-relaxed text-foreground">
              Assim que o pagamento for confirmado, seu{' '}
              <span className="font-bold text-primary">Código de Convite</span> chega no e-mail{' '}
              <span className="font-semibold">na hora</span> — tudo acontece imediatamente.
            </p>
          </div>

          {/* CTA */}
          <button
            type="button"
            onClick={onConfirm}
            disabled={!done}
            className="cta-gradient mt-6 flex w-full items-center justify-center gap-2.5 rounded-2xl py-4 text-base font-bold text-primary-foreground ring-1 ring-inset ring-white/20 transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100"
          >
            {done ? (
              <>
                <Gift className="size-5" aria-hidden="true" />
                Gerar meu PIX agora
                <ChevronRight className="size-5" aria-hidden="true" />
              </>
            ) : (
              <>
                <Loader2 className="size-5 animate-spin" aria-hidden="true" />
                Gerando...
              </>
            )}
          </button>

          <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
            <Lock className="size-3" aria-hidden="true" />
            Pagamento 100% seguro e anônimo
          </p>
        </div>
      </div>
    </div>,
    document.body,
  )
}
