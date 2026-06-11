'use client'

import { Check, ChevronRight } from 'lucide-react'

// Ícone do PIX (logo oficial simplificado em SVG)
function PixIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" className={className} fill="currentColor" aria-hidden="true">
      <path d="M242.4 292.5c-7.6 7.6-20.9 7.6-28.5 0l-44.8-44.8c-3.5-3.5-9.2-3.5-12.7 0l-50.6 50.6c10.4 1.4 20.3 6.1 28.1 13.9l44.8 44.8c20.2 20.2 53.1 20.2 73.3 0l44.8-44.8c7.8-7.8 17.7-12.5 28.1-13.9l-50.6-50.6c-3.5 3.5-9.2 3.5-12.7 0l-44.8 44.8z" />
      <path d="M213.9 219.5c7.6-7.6 20.9-7.6 28.5 0l44.8 44.8c3.5 3.5 9.2 3.5 12.7 0l50.6-50.6c-10.4-1.4-20.3-6.1-28.1-13.9l-44.8-44.8c-20.2-20.2-53.1-20.2-73.3 0l-44.8 44.8c-7.8 7.8-17.7 12.5-28.1 13.9l50.6 50.6c3.5-3.5 9.2-3.5 12.7 0l44.8-44.8z" transform="translate(0 -3)" />
      <path d="M414.2 219.5l-31.7-31.7c-.7.3-1.5.4-2.3.4h-29.1c-7 0-13.8 2.8-18.7 7.8l-44.8 44.8c-9.1 9.1-25 9.1-34.1 0l-44.8-44.8c-5-5-11.7-7.8-18.7-7.8h-35.7c-.8 0-1.5-.1-2.3-.4L98.5 219.5c-20.2 20.2-20.2 53.1 0 73.3l31.7 31.7c.7-.3 1.5-.4 2.3-.4h35.7c7 0 13.8-2.8 18.7-7.8l44.8-44.8c9.4-9.4 24.8-9.4 34.1 0l44.8 44.8c5 5 11.7 7.8 18.7 7.8h29.1c.8 0 1.5.1 2.3.4l31.7-31.7c20.2-20.2 20.2-53.1 0-73.3z" />
    </svg>
  )
}

const benefits = [
  'Código de convite exclusivo Luna Privé',
  'Acesso imediato à plataforma após a confirmação',
  'Anonimato e privacidade total do seu perfil',
  'Suporte 24h por WhatsApp + Chat',
  'Garantia de 30 dias',
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
    <section aria-labelledby="investimento">
      <div className="luna-border-top relative overflow-hidden rounded-3xl bg-card px-6 py-7 shadow-2xl shadow-black/40">
        {/* Imagem de fundo (mesma do /convite) com degradê escuro por cima */}
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <img
            src="/images/background.png"
            alt=""
            className="size-full object-cover opacity-75"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/35 via-background/65 to-background/90" />
          <div className="absolute inset-0 bg-background/15" />
        </div>

        {/* Logo Luna Privé */}
        <div className="relative mb-6 flex justify-center">
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
            className={`mt-3 flex items-center justify-center gap-2.5 transition-all duration-300 ${
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
        <ul className="relative mt-7 flex flex-col gap-3.5">
          {benefits.map((b) => (
            <li key={b} className="flex items-center gap-3">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-positive/15 text-positive">
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
          className="luna-gradient relative mt-7 flex w-full items-center justify-center gap-2.5 rounded-2xl py-4 text-base font-bold text-primary-foreground shadow-lg shadow-primary/30 transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100"
        >
          {priceReady && <PixIcon className="size-5" />}
          {priceReady ? 'Adquirir meu Convite' : 'Carregando valor...'}
          {priceReady && <ChevronRight className="size-5" aria-hidden="true" />}
        </button>
      </div>
    </section>
  )
}
