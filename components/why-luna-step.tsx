'use client'

import { X, Check, Users, DollarSign, Zap, ShieldCheck } from 'lucide-react'
import { CtaButton } from '@/components/cta-button'

const cons = [
  'Você corre atrás de clientes',
  'Pagamentos lentos e taxas altas',
  'Sua identidade exposta',
]

const pros = [
  'Compradores ativos todo dia',
  'Pagamento via PIX na hora',
  '100% anônima e segura',
]

const stats = [
  { icon: Users, value: '120 mil', label: 'Compradores ativos hoje' },
  { icon: DollarSign, value: 'R$ 89,90', label: 'Ticket médio por pack' },
  { icon: Zap, value: '< 30min', label: 'Tempo médio para 1ª venda' },
  { icon: ShieldCheck, value: '100%', label: 'Anônimo e seguro' },
]

export function WhyLunaStep({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="flex flex-col">
      {/* Cabeçalho */}
      <section
        className="animate-item mt-7 text-center"
        style={{ animationDelay: '60ms' }}
      >
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
          A diferença é clara
        </p>
        <h1 className="mt-2 text-balance font-sans text-[1.7rem] font-bold leading-tight tracking-tight text-foreground">
          Por que a{' '}
          <span className="whitespace-nowrap text-primary">Luna Privé?</span>
        </h1>
        <p className="mt-2.5 text-pretty text-sm leading-relaxed text-muted-foreground">
          Aqui você{' '}
          <span className="font-semibold text-foreground">
            não corre atrás de cliente
          </span>{' '}
          — os compradores já chegam até você.
        </p>
      </section>

      {/* Card - Outras plataformas */}
      <section
        className="animate-item mt-6 rounded-xl border border-destructive/30 bg-card/95 p-3.5 shadow-lg shadow-black/30 backdrop-blur-md"
        style={{ animationDelay: '140ms' }}
      >
        <h2 className="flex items-center gap-2 text-[0.8rem] font-bold text-destructive">
          <X className="size-4 shrink-0" aria-hidden="true" />
          Outras plataformas
        </h2>
        <ul className="mt-2.5 flex flex-col gap-1.5">
          {cons.map((item) => (
            <li
              key={item}
              className="flex items-center gap-2 text-xs leading-snug text-foreground/80"
            >
              <X className="size-3.5 shrink-0 text-destructive/80" aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>
      </section>

      {/* Card - Luna Privé */}
      <section
        className="animate-item mt-3 rounded-xl border border-positive/40 bg-card/95 p-3.5 shadow-lg shadow-black/30 backdrop-blur-md"
        style={{ animationDelay: '220ms' }}
      >
        <h2 className="flex items-center gap-2 text-[0.8rem] font-bold text-positive">
          <Check className="size-4 shrink-0" aria-hidden="true" />
          Luna Privé
        </h2>
        <ul className="mt-2.5 flex flex-col gap-1.5">
          {pros.map((item) => (
            <li
              key={item}
              className="flex items-center gap-2 text-xs font-medium leading-snug text-foreground"
            >
              <Check
                className="size-3.5 shrink-0 text-positive"
                aria-hidden="true"
              />
              {item}
            </li>
          ))}
        </ul>
      </section>

      {/* Grid 2x2 de estatísticas */}
      <section
        className="animate-item mt-4 grid grid-cols-2 gap-3"
        style={{ animationDelay: '300ms' }}
        aria-label="Números da plataforma"
      >
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <div
              key={s.label}
              className="luna-border flex flex-col items-center rounded-2xl bg-card p-4 text-center"
            >
              <span className="flex size-9 items-center justify-center rounded-xl bg-primary/15">
                <Icon className="size-4 text-primary" aria-hidden="true" />
              </span>
              <p className="mt-2 font-sans text-lg font-bold leading-none text-foreground">
                {s.value}
              </p>
              <p className="mt-1 text-[0.7rem] leading-snug text-muted-foreground">
                {s.label}
              </p>
            </div>
          )
        })}
      </section>

      <div className="animate-item mt-6" style={{ animationDelay: '380ms' }}>
        <CtaButton onClick={onContinue}>Quero fazer parte!</CtaButton>
      </div>
    </div>
  )
}
