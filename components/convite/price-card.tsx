'use client'

import { Check, ShieldCheck, ChevronRight, Sparkles } from 'lucide-react'

const benefits = [
  'Acesso completo à plataforma',
  'Comece a vender imediatamente',
  'Receba seu código e acesso por e-mail',
  'Suporte anônimo 24h',
]

export function PriceCard({ onAcquire }: { onAcquire?: () => void }) {
  return (
    <section aria-labelledby="investimento">
      <div className="luna-border relative overflow-hidden rounded-3xl bg-card shadow-2xl shadow-primary/20 ring-1 ring-primary/15">
        {/* brilho superior sutil */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-primary/15 to-transparent"
          aria-hidden="true"
        />

        <div className="relative px-6 pt-6 text-center">
          <p
            id="investimento"
            className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground"
          >
            Investimento único
          </p>

          <div className="mt-3 flex items-center justify-center gap-2.5">
            <span className="text-base font-semibold text-muted-foreground line-through decoration-primary/70">
              R$44,67
            </span>
            <span className="rounded-full bg-positive/15 px-2.5 py-1 text-xs font-bold text-positive">
              -40%
            </span>
          </div>

          <p className="mt-1 text-5xl font-extrabold tracking-tight text-foreground">
            R$26,80
          </p>
          <p className="mt-1.5 text-sm text-muted-foreground">Pagamento único via PIX</p>
        </div>

        <ul className="mt-6 flex flex-col gap-3 px-6">
          {benefits.map((b) => (
            <li key={b} className="flex items-center gap-2.5">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-positive/15 text-positive">
                <Check className="size-3.5" aria-hidden="true" />
              </span>
              <span className="text-sm font-medium text-foreground">{b}</span>
            </li>
          ))}
        </ul>

        <div className="mt-6 px-6 pb-6">
          <button
            type="button"
            onClick={onAcquire}
            className="luna-gradient flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-bold text-primary-foreground shadow-lg shadow-primary/30 transition active:scale-[0.98]"
          >
            <Sparkles className="size-5" aria-hidden="true" />
            Adquirir meu Convite
            <ChevronRight className="size-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Garantia */}
      <div className="luna-border mt-3 flex items-start gap-3 rounded-2xl bg-card px-4 py-3.5">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-positive" aria-hidden="true" />
        <p className="text-pretty text-xs leading-relaxed text-muted-foreground">
          Experimente o <span className="font-semibold text-foreground">Luna Privé</span> por{' '}
          <span className="font-semibold text-foreground">7 dias</span>. Se preferir, você pode
          solicitar a <span className="font-semibold text-positive">devolução em até 7 dias</span>.
        </p>
      </div>
    </section>
  )
}
