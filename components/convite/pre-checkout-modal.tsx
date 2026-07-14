'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { Loader2, ShieldCheck, Ticket, Lock } from 'lucide-react'

interface PreCheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  /** Chamado quando a usuária envia um CPF válido; o pai inicia a geração do PIX. */
  onSubmitCpf: (document: string) => void
  /** Chamado quando a animação terminou e o PIX está pronto: fecha esta etapa. */
  onDone: () => void
  email: string
  amountCents: number
  /** PIX 100% gerado e pronto para exibir. Enquanto false, mantém o "finalizando". */
  ready?: boolean
  /** Config do admin: quando true, exibe a etapa de CPF antes de gerar o PIX. */
  requireCpf?: boolean
}

function formatCents(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/** Aplica a máscara 000.000.000-00 progressivamente. */
function maskCpf(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 11)
  return d
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4')
}

/** Valida os dígitos verificadores do CPF. */
function isValidCpf(cpf: string): boolean {
  const c = cpf.replace(/\D/g, '')
  if (c.length !== 11 || /^(\d)\1{10}$/.test(c)) return false
  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(c[i]) * (10 - i)
  let r = (sum * 10) % 11
  if (r === 10) r = 0
  if (r !== parseInt(c[9])) return false
  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(c[i]) * (11 - i)
  r = (sum * 10) % 11
  if (r === 10) r = 0
  return r === parseInt(c[10])
}

const STEPS = [
  { icon: ShieldCheck, label: 'Validando seus dados' },
  { icon: Ticket, label: 'Reservando seu convite exclusivo' },
  { icon: Lock, label: 'Preparando pagamento seguro' },
]

type Phase = 'loading' | 'cpf' | 'finalizing'

export function PreCheckoutModal({
  isOpen,
  onSubmitCpf,
  onDone,
  amountCents,
  ready,
  requireCpf = false,
}: PreCheckoutModalProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const [phase, setPhase] = useState<Phase>('loading')
  const [activeStep, setActiveStep] = useState(0)
  const [cpf, setCpf] = useState('')
  const [error, setError] = useState('')

  // Reinicia todo o estado sempre que a etapa é aberta.
  useEffect(() => {
    if (isOpen) {
      setPhase('loading')
      setActiveStep(0)
      setCpf('')
      setError('')
    }
  }, [isOpen])

  // Fase "loading": avança os passos em sequência. Ao terminar, vai para a
  // etapa de CPF (se exigida) ou dispara a geração do PIX direto e segue para
  // "finalizing".
  const onSubmitCpfRef = useRef(onSubmitCpf)
  onSubmitCpfRef.current = onSubmitCpf
  useEffect(() => {
    if (!isOpen || phase !== 'loading') return
    const stepMs = 700
    const timers: ReturnType<typeof setTimeout>[] = []
    STEPS.forEach((_, i) => {
      timers.push(setTimeout(() => setActiveStep(i + 1), stepMs * (i + 1)))
    })
    timers.push(
      setTimeout(() => {
        if (requireCpf) {
          setPhase('cpf')
        } else {
          // Sem CPF: gera o PIX sem documento e mostra o "finalizando".
          onSubmitCpfRef.current('')
          setPhase('finalizing')
        }
      }, stepMs * STEPS.length + 450),
    )
    return () => timers.forEach(clearTimeout)
  }, [isOpen, phase, requireCpf])

  // Fase "finalizing": quando o PIX fica pronto, encerra a etapa.
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone
  useEffect(() => {
    if (phase !== 'finalizing' || !ready) return
    const t = setTimeout(() => onDoneRef.current(), 300)
    return () => clearTimeout(t)
  }, [phase, ready])

  if (!isOpen || !mounted) return null

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!isValidCpf(cpf)) {
      setError('Digite um CPF válido para gerar a cobrança.')
      return
    }
    setError('')
    onSubmitCpf(cpf.replace(/\D/g, ''))
    setPhase('finalizing')
  }

  const priceLabel = `R$ ${formatCents(amountCents)}`

  return createPortal(
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center px-4 py-6"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop — igual aos modais de entrada */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-[2px]" aria-hidden="true" />

      {/* Card — mesmo layout dos modais de entrada */}
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

        {/* ── Fase: gerando convite (animação de etapas) ── */}
        {(phase === 'loading' || phase === 'finalizing') && (
          <div className="relative flex flex-col items-center pt-5">
            <span className="relative flex size-16 items-center justify-center">
              <span className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
              <span className="relative flex size-16 items-center justify-center rounded-full bg-primary/12 ring-1 ring-primary/30">
                <Loader2 className="size-7 animate-spin text-primary" aria-hidden="true" />
              </span>
            </span>

            <p className="mt-5 text-xs font-semibold uppercase tracking-widest text-primary">
              Aguarde
            </p>
            <h2 className="mt-1.5 text-balance text-lg font-bold leading-snug text-foreground">
              {phase === 'finalizing'
                ? 'Gerando seu PIX Luna Privé!'
                : 'Gerando seu convite Luna Privé!'}
            </h2>

            {/* Etapa atual (uma por vez, substituindo conforme avança) */}
            <div className="mt-6 flex h-14 w-full items-center justify-center">
              {(() => {
                const idx = phase === 'finalizing' ? STEPS.length - 1 : Math.min(activeStep, STEPS.length - 1)
                const step = STEPS[idx]
                return (
                  <div
                    key={step.label}
                    className="flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 animate-in fade-in slide-in-from-bottom-1 duration-300"
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
                      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    </span>
                    <span className="flex-1 text-left text-xs font-medium text-foreground">{step.label}</span>
                  </div>
                )
              })()}
            </div>

            {/* Progresso das etapas (pontos) */}
            <div className="mt-4 flex items-center justify-center gap-1.5">
              {STEPS.map((step, i) => {
                const idx = phase === 'finalizing' ? STEPS.length - 1 : Math.min(activeStep, STEPS.length - 1)
                return (
                  <span
                    key={step.label}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === idx ? 'w-5 bg-primary' : i < idx ? 'w-1.5 bg-emerald-400' : 'w-1.5 bg-muted/50'
                    }`}
                  />
                )
              })}
            </div>
          </div>
        )}

        {/* ── Fase: CPF ── */}
        {phase === 'cpf' && (
          <form
            onSubmit={handleSubmit}
            className="relative flex flex-col pt-5 animate-in fade-in slide-in-from-bottom-2 duration-300"
          >
            <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/12 ring-1 ring-primary/30">
              <ShieldCheck className="size-6 text-primary" aria-hidden="true" />
            </span>
            <h2 className="mt-4 text-center text-lg font-bold leading-snug text-foreground">
              Informe seu CPF
            </h2>
            <p className="mx-auto mt-2 max-w-xs text-pretty text-center text-sm leading-relaxed text-muted-foreground">
              Precisamos do seu CPF para gerarmos a cobrança de{' '}
              <span className="font-semibold text-foreground">{priceLabel}</span> — pagamento via
              PIX.
            </p>

            <label htmlFor="cpf-input" className="sr-only">
              CPF
            </label>
            <input
              id="cpf-input"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="000.000.000-00"
              value={cpf}
              onChange={(e) => {
                setCpf(maskCpf(e.target.value))
                if (error) setError('')
              }}
              className={`mt-6 w-full rounded-2xl border bg-background/60 px-4 py-4 text-center font-montserrat text-xl font-medium tracking-wider text-foreground outline-none transition focus:ring-2 ${
                error
                  ? 'border-destructive/70 focus:ring-destructive/30'
                  : 'border-border focus:border-primary/60 focus:ring-primary/30'
              }`}
              aria-invalid={Boolean(error)}
              autoFocus
            />
            {error && (
              <p className="mt-2 text-center text-xs font-medium text-destructive">{error}</p>
            )}

            <button
              type="submit"
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 text-base font-bold text-white transition hover:brightness-110 active:scale-[0.98]"
            >
              GERAR PIX {priceLabel}
            </button>

            <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
              <Lock className="size-3.5" aria-hidden="true" />
              Seus dados são 100% anônimos.
            </p>
          </form>
        )}
      </div>
    </div>,
    document.body,
  )
}
