'use client'

import { Check, Gift, Lightbulb } from 'lucide-react'

const benefits = [
  'Código de Convite Luna',
  'Venda imediatamente',
  'Suporte Anônimo 24h',
  '100% Anonimato',
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
  // Preco "de" (ancora) fixo em R$ 69,90. O desconto e calculado a partir do
  // preco atual em relacao a esse valor ancora.
  const originalCents = 6990
  const discountPercent = Math.max(0, Math.round((1 - amountCents / originalCents) * 100))

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
            <span className="font-montserrat text-4xl font-extrabold leading-none tracking-tight text-foreground sm:text-5xl">R$</span>
            <span className="font-montserrat text-4xl font-extrabold leading-none tracking-tight text-foreground sm:text-5xl">
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
          onClick={onAcquire}
          disabled={!priceReady}
          className="animate-cta-breathe relative mt-7 flex w-full items-center justify-center gap-2.5 rounded-2xl bg-emerald-600 py-4 text-base font-bold text-white transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:animate-none disabled:opacity-60 disabled:active:scale-100"
        >
          {priceReady && <Gift className="size-5 shrink-0" aria-hidden="true" />}
          <span className="whitespace-nowrap">
            {priceReady ? 'Adquirir Meu Convite' : 'Carregando valor...'}
          </span>
        </button>
      </div>

      {/* Card pequeno e discreto de garantia (abaixo do card de preço) */}
      <div className="relative z-10 mt-3 flex items-start gap-2.5 rounded-2xl border border-border/40 bg-card/40 px-4 py-3 backdrop-blur-sm">
        <Lightbulb className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
        <p className="text-pretty text-xs leading-relaxed text-muted-foreground">
          Você tem <span className="font-semibold text-foreground">7 dias</span> para postar seu
          pack/foto. Se não vender e sacar em até{' '}
          <span className="font-semibold text-foreground">7 dias</span>, poderá solicitar{' '}
          <span className="font-semibold text-foreground">reembolso completo com 1 clique</span>{' '}
          dentro do nosso site.
        </p>
      </div>
    </section>
  )
}
