'use client'

import { useState } from 'react'
import { Check, Gift, Clock, X } from 'lucide-react'

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

      {/* Popup de confirmação com aviso de urgência (10 min) */}
      {showConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Fundo escuro */}
          <button
            type="button"
            aria-label="Fechar"
            onClick={() => setShowConfirm(false)}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />

          {/* Card do popup */}
          <div className="luna-border-top relative z-10 w-full max-w-sm overflow-hidden rounded-3xl border border-border/60 bg-card px-6 py-7 text-center shadow-2xl shadow-black/50">
            <button
              type="button"
              aria-label="Fechar"
              onClick={() => setShowConfirm(false)}
              className="absolute right-3.5 top-3.5 flex size-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" aria-hidden="true" />
            </button>

            <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/12 text-primary ring-1 ring-primary/25">
              <Clock className="size-7" aria-hidden="true" />
            </span>

            <h3 id="confirm-title" className="mt-4 text-lg font-bold text-foreground">
              Atenção
            </h3>

            <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">
              O desconto de{' '}
              <span className="font-semibold text-muted-foreground line-through decoration-primary/70">
                R${formatCents(originalCents)}
              </span>{' '}
              por{' '}
              <span className="font-bold text-foreground">R${formatCents(amountCents)}</span> é
              válido por{' '}
              <span className="font-bold text-primary">10 minutos</span> a partir de agora!
            </p>

            <button
              type="button"
              onClick={handleConfirm}
              className="cta-gradient cta-3d relative mt-6 flex w-full items-center justify-center gap-2 rounded-2xl px-3 py-4 text-[0.95rem] font-bold text-white hover:brightness-110 sm:text-base"
            >
              <span className="whitespace-nowrap">Confirmar e continuar</span>
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
