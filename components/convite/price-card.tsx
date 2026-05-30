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
        {/* faixa superior com selo */}
        <div className="relative flex items-center justify-between border-b border-border/60 bg-secondary/40 px-5 py-3">
          <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
            <Sparkles className="size-3.5 text-primary" aria-hidden="true" />
            Convite exclusivo
          </span>
          <span className="rounded-full bg-positive/15 px-2.5 py-1 text-[0.7rem] font-bold text-positive">
            -40% hoje
          </span>
        </div>

        {/* bloco de preço estruturado */}
        <div className="flex items-end justify-between gap-4 px-5 pt-5">
          <div className="flex flex-col">
            <span className="text-[0.7rem] font-semibold uppercase tracking-wide text-muted-foreground">
              Investimento único
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-base font-semibold text-muted-foreground">R$</span>
              <span className="text-4xl font-extrabold leading-none tracking-tight text-foreground">
                24,80
              </span>
            </div>
            <span className="mt-1.5 text-xs text-muted-foreground">Pagamento único via PIX</span>
          </div>

          <div className="flex flex-col items-end pb-1">
            <span className="text-xs font-medium text-muted-foreground line-through decoration-primary/70">
              R$44,67
            </span>
            <span className="mt-1 rounded-lg bg-primary/12 px-2 py-1 text-[0.7rem] font-bold text-primary">
              Economize R$19,87
            </span>
          </div>
        </div>

        {/* benefícios em grade */}
        <ul className="mt-5 grid grid-cols-1 gap-2.5 px-5 sm:grid-cols-2">
          {benefits.map((b) => (
            <li
              key={b}
              className="flex items-center gap-2.5 rounded-xl bg-secondary/50 px-3 py-2.5"
            >
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-positive/15 text-positive">
                <Check className="size-3.5" aria-hidden="true" />
              </span>
              <span className="text-[0.8rem] font-medium leading-tight text-foreground">{b}</span>
            </li>
          ))}
        </ul>

        <div className="mt-5 px-5 pb-5">
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
