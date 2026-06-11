'use client'

import { Check, ChevronRight, ShieldCheck } from 'lucide-react'

const benefits = [
  'Plano Criadora Luna Privé',
  'Publique seus packs e comece a vender',
  'Anonimato e privacidade do perfil',
  'Suporte 24h por WhatsApp + Chat',
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
            className="size-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/55 via-background/80 to-background/95" />
          <div className="absolute inset-0 bg-background/30" />
        </div>

        {/* Logo Luna Privé */}
        <div className="relative mb-6 flex justify-center">
          <img
            src="/images/luna-prive-logo.png"
            alt="Luna Privé"
            className="h-9 w-auto"
          />
        </div>

        {/* Preço centralizado */}
        <div className="relative flex flex-col items-center text-center">
          <span
            id="investimento"
            className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground"
          >
            Investimento único
          </span>

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
          className="luna-gradient relative mt-7 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-bold text-primary-foreground shadow-lg shadow-primary/30 transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100"
        >
          {priceReady ? 'Ativar meu Plano' : 'Carregando valor...'}
          {priceReady && <ChevronRight className="size-5" aria-hidden="true" />}
        </button>

        {/* Garantia integrada */}
        <div className="luna-border-soft relative mt-5 flex items-start gap-3 rounded-2xl bg-background/40 px-4 py-3.5">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-positive" aria-hidden="true" />
          <p className="text-pretty text-xs leading-relaxed text-muted-foreground">
            Experimente o <span className="font-semibold text-foreground">Luna Privé</span> por{' '}
            <span className="font-semibold text-foreground">7 dias</span>. Se você preferir, poderá
            solicitar a <span className="font-semibold text-positive">devolução em até 7 dias</span>.
          </p>
        </div>
      </div>
    </section>
  )
}
