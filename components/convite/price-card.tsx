'use client'

import { Check, ChevronRight, Gift } from 'lucide-react'

const benefits = [
  'Código de convite Luna Privé',
  '100% Anonimato',
  'Suporte Exclusivo',
  'Clube de Benefícios',
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
  // Preco "de" (ancora) calculado a partir do preco atual com ~40% de desconto.
  const originalCents = Math.round(amountCents / 0.6)

  return (
    <section aria-labelledby="investimento" className="relative isolate">
      {/* Glow rosa suave atras do card */}
      <div
        className="pointer-events-none absolute -inset-1 rounded-[2.5rem] bg-primary/35 blur-2xl"
        aria-hidden="true"
      />
      <div className="luna-border-top relative z-10 overflow-hidden rounded-3xl border border-border/50 bg-card px-6 py-7 shadow-2xl shadow-black/40">
        {/* Imagem de fundo (mesma do /convite) com degradê escuro por cima */}
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <img
            src="/images/background.png"
            alt=""
            className="size-full object-cover opacity-45"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/78 to-background/88" />
          <div className="absolute inset-0 bg-background/45" />
        </div>

        {/* Logo Luna Privé */}
        <div className="relative mb-3 flex justify-center">
          <img
            src="/images/luna-prive-logo.png"
            alt="Luna Privé"
            className="h-11 w-auto"
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
            <span className="text-base font-semibold text-muted-foreground line-through decoration-primary/70">
              R${formatCents(originalCents)}
            </span>
            <span className="rounded-full bg-positive/15 px-2.5 py-0.5 text-xs font-bold text-positive">
              -40%
            </span>
          </div>

          <div
            className={`mt-1 flex items-baseline justify-center gap-1 transition-all duration-300 ${
              priceReady ? 'blur-0 opacity-100' : 'blur-md opacity-70'
            }`}
            aria-hidden={!priceReady}
          >
            <span className="text-xl font-bold text-foreground sm:text-2xl">R$</span>
            <span className="text-4xl font-extrabold leading-none tracking-tight text-foreground sm:text-5xl">
              {formatCents(amountCents)}
            </span>
          </div>

          <span className="mt-2 text-sm text-muted-foreground">Pagamento único via PIX</span>
        </div>

        {/* Benefícios — lista única */}
        <ul className="relative mt-5 flex flex-col gap-3.5">
          {benefits.map((b) => (
            <li key={b} className="flex items-center gap-3">
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
          onClick={onAcquire}
          disabled={!priceReady}
          className="cta-gradient relative mt-7 flex w-full items-center justify-center gap-2.5 rounded-2xl py-4 text-base font-bold text-primary-foreground transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100"
        >
          {priceReady && <Gift className="size-5" aria-hidden="true" />}
          {priceReady ? 'Adquirir meu Convite' : 'Carregando valor...'}
          {priceReady && <ChevronRight className="size-5" aria-hidden="true" />}
        </button>
      </div>
    </section>
  )
}
