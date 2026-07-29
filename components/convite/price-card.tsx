'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, Gift, Clock, X, AlertTriangle } from 'lucide-react'

const benefits = [
  'Código de Convite Luna Prive',
  'Comece a vender agora mesmo',
  'Suporte 100% sigiloso',
  'Acesso imediato por E-mail',
]

// Formata centavos como moeda BRL: 2480 -> "24,80"
function formatCents(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function PriceCard({
  onAcquire,
  amountCents = 2480,
  priceReady = true,
}: {
  onAcquire?: () => void
  amountCents?: number
  priceReady?: boolean
}) {
  // Preco "de" (ancora) fixo em R$ 109,00. O desconto e calculado a partir do
  // preco atual em relacao a esse valor ancora.
  const originalCents = 10900
  const discountPercent = Math.max(0, Math.round((1 - amountCents / originalCents) * 100))

  // Popup de confirmacao com aviso de urgencia (10 min) antes de gerar o PIX.
  const [showConfirm, setShowConfirm] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(600)

  // Portal so pode renderizar apos montar no cliente (evita erro de SSR).
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // Contador regressivo de 10 minutos, reiniciado sempre que o popup abre.
  useEffect(() => {
    if (!showConfirm) return
    setSecondsLeft(600)
    const id = setInterval(() => {
      setSecondsLeft((s) => (s <= 1 ? 0 : s - 1))
    }, 1000)
    return () => clearInterval(id)
  }, [showConfirm])

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const ss = String(secondsLeft % 60).padStart(2, '0')

  function handleConfirm() {
    setShowConfirm(false)
    onAcquire?.()
  }

  return (
    <section aria-labelledby="investimento" className="relative isolate">
      {/* Glow rosa suave atras do card */}
      <div
        className="pointer-events-none absolute -inset-1 rounded-[2.5rem] bg-primary/15 blur-xl"
        aria-hidden="true"
      />
      <div className="luna-border-top relative z-10 overflow-hidden rounded-3xl border border-border/50 bg-card px-6 py-7 shadow-2xl shadow-black/40">
        {/* Imagem de fundo (mesma do /convite) com degradê escuro por cima */}
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <img
            src="/images/background.png"
            alt=""
            className="size-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/70 to-background/82" />
          <div className="absolute inset-0 bg-background/35" />
        </div>

        {/* Logo Luna Privé */}
        <div className="relative mb-3 flex justify-center">
          <img
            src="/images/luna-prive-logo.png"
            alt="Luna Privé"
            className="h-14 w-auto"
          />
        </div>

        {/* Preço centralizado */}
        <div className="relative flex flex-col items-center text-center">
          <h2 id="investimento" className="sr-only">
            Investimento único
          </h2>

          <div
            className={`flex items-center justify-center gap-2.5 transition-all duration-300 ${
              priceReady ? 'blur-0 opacity-100' : 'blur-md opacity-70'
            }`}
            aria-hidden={!priceReady}
          >
            <span className="font-montserrat text-base font-semibold text-muted-foreground line-through decoration-primary/70">
              R${formatCents(originalCents)}
            </span>
            <span className="rounded-full bg-positive/15 px-2.5 py-0.5 text-xs font-bold text-positive">
              -{discountPercent}%
            </span>
          </div>

          <div
            className={`mt-1 flex items-baseline justify-center gap-1 transition-all duration-300 ${
              priceReady ? 'blur-0 opacity-100' : 'blur-md opacity-70'
            }`}
            aria-hidden={!priceReady}
          >
            <span className="font-montserrat text-4xl font-bold leading-none tracking-tight text-foreground sm:text-5xl">R$</span>
            <span className="font-montserrat text-4xl font-bold leading-none tracking-tight text-foreground sm:text-5xl">
              {formatCents(amountCents)}
            </span>
          </div>

          <span className="mt-2 text-sm text-muted-foreground">Pagamento único via PIX</span>
        </div>

        {/* Benefícios — lista única */}
        <ul className="relative mt-5 flex flex-col items-center gap-3.5">
          {benefits.map((b) => (
            <li key={b} className="flex items-center justify-center gap-3">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Check className="size-3.5" aria-hidden="true" />
              </span>
              <span className="text-sm font-medium text-foreground">{b}</span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <button
          type="button"
          onClick={() => setShowConfirm(true)}
          disabled={!priceReady}
          className="cta-gradient cta-3d animate-cta-breathe relative mt-7 flex w-full items-center justify-center gap-2 rounded-2xl px-3 py-4 text-[0.95rem] font-bold text-white hover:brightness-110 disabled:cursor-not-allowed disabled:animate-none disabled:opacity-60 sm:gap-2.5 sm:text-base"
        >
          {priceReady && <Gift className="size-5 shrink-0" aria-hidden="true" />}
          <span className="whitespace-nowrap">
            {priceReady ? 'GERAR PIX DO CONVITE!' : 'Carregando valor...'}
          </span>
        </button>
      </div>

      {/* Popup de confirmação com aviso de urgência (renderizado via portal no
          body para não ficar preso ao stacking context do card e ser coberto
          por outros elementos ao rolar a página). */}
      {mounted &&
        showConfirm &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            className="fixed inset-0 z-[999] flex items-center justify-center overflow-y-auto p-4"
          >
            {/* Fundo escuro */}
            <button
              type="button"
              aria-label="Fechar"
              onClick={() => setShowConfirm(false)}
              className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            />

            {/* Card do popup */}
            <div className="relative z-10 my-auto w-full max-w-sm overflow-hidden rounded-3xl border border-border/70 bg-card px-6 py-6 text-center shadow-2xl shadow-black/60">
              <button
                type="button"
                aria-label="Fechar"
                onClick={() => setShowConfirm(false)}
                className="absolute right-3.5 top-3.5 flex size-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <X className="size-4" aria-hidden="true" />
              </button>

              {/* Cabeçalho com ícone pequeno + título em destaque */}
              <div className="flex items-center justify-center gap-2">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <AlertTriangle className="size-4" aria-hidden="true" />
                </span>
                <h3
                  id="confirm-title"
                  className="text-xl font-bold uppercase tracking-wide text-foreground"
                >
                  Atenção
                </h3>
              </div>

              {/* Conteúdo em destaque */}
              <p className="mt-4 text-pretty text-base font-semibold leading-relaxed text-foreground">
                Seu desconto de{' '}
                <span className="font-bold text-muted-foreground line-through decoration-primary/70 decoration-2">
                  R${formatCents(originalCents)}
                </span>{' '}
                por{' '}
                <span className="text-lg font-extrabold text-primary">
                  R${formatCents(amountCents)}
                </span>{' '}
                está garantido!
              </p>

              {/* Contador regressivo — foco da tela */}
              <div className="mt-5 flex flex-col items-center gap-2 rounded-2xl border border-primary/25 bg-primary/10 py-4">
                <span className="flex items-center gap-1.5 text-[0.7rem] font-bold uppercase tracking-widest text-primary">
                  <Clock className="size-3.5 shrink-0 animate-pulse" aria-hidden="true" />
                  A oferta expira em
                </span>
                <span className="font-mono text-4xl font-extrabold leading-none tabular-nums text-foreground">
                  {mm}:{ss}
                </span>
              </div>

              <button
                type="button"
                onClick={handleConfirm}
                className="cta-gradient cta-3d relative mt-5 flex w-full items-center justify-center gap-2 rounded-2xl px-3 py-4 text-[0.95rem] font-bold text-white hover:brightness-110 sm:text-base"
              >
                <span className="whitespace-nowrap">Confirmar e continuar</span>
              </button>
            </div>
          </div>,
          document.body,
        )}
    </section>
  )
}
