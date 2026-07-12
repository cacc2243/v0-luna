'use client'

import { EyeOff, UserX, Footprints, ShieldCheck } from 'lucide-react'
import { CtaButton } from '@/components/cta-button'

type Feature = {
  icon: typeof EyeOff
  title: string
  description: string
}

const features: Feature[] = [
  {
    icon: EyeOff,
    title: 'Sem mostrar rosto',
    description: 'Identidade 100% protegida em todas as etapas.',
  },
  {
    icon: UserX,
    title: 'Sem expor o corpo',
    description: 'Nenhuma foto íntima ou comprometedora.',
  },
  {
    icon: Footprints,
    title: 'Apenas fotos dos pés',
    description: 'Conteúdo simples, discreto e lucrativo.',
  },
  {
    icon: ShieldCheck,
    title: 'Privacidade total',
    description: 'Seus dados ficam protegidos pela plataforma.',
  },
]

const ticker = [
  'Usuária ativa em SP',
  'Pack publicado no RJ',
  'Novo acesso em MG',
  'Venda aprovada no PR',
  'Saque via PIX em BA',
]

export function CommunityStep({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="flex flex-col">
      {/* Card de comunidade */}
      <section
        className="luna-border animate-item mt-7 rounded-2xl bg-card p-5"
        style={{ animationDelay: '60ms' }}
      >
        <p className="font-sans text-3xl font-bold leading-none text-primary">
          6.000+{' '}
          <span className="text-sm font-medium text-muted-foreground">
            usuárias cadastradas
          </span>
        </p>
        <p className="mt-3 text-pretty text-[0.95rem] leading-relaxed text-foreground">
          Já fazem parte da comunidade{' '}
          <span className="font-semibold text-primary">Luna Privé</span>.
        </p>
      </section>

      {/* Grid 2x2 de garantias */}
      <section
        className="animate-item mt-4 grid grid-cols-2 gap-3"
        style={{ animationDelay: '160ms' }}
        aria-label="Garantias da plataforma"
      >
        {features.map((f) => {
          const Icon = f.icon
          return (
            <div
              key={f.title}
              className="luna-border flex flex-col rounded-2xl bg-card p-4"
            >
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/15">
                <Icon className="size-5 text-primary" aria-hidden="true" />
              </span>
              <h2 className="mt-3 text-pretty text-sm font-bold leading-snug text-foreground">
                {f.title}
              </h2>
              <p className="mt-1 text-pretty text-xs leading-relaxed text-muted-foreground">
                {f.description}
              </p>
            </div>
          )
        })}
      </section>

      {/* Ticker de atividade */}
      <div
        className="animate-item mt-5 overflow-hidden"
        style={{ animationDelay: '240ms' }}
        aria-hidden="true"
      >
        <div className="flex w-max animate-marquee gap-2">
          {[...ticker, ...ticker].map((item, i) => (
            <span
              key={i}
              className="flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border/60 bg-card/60 px-3 py-1.5 text-[0.7rem] text-muted-foreground"
            >
              <span className="size-1.5 rounded-full bg-positive" />
              {item}
            </span>
          ))}
        </div>
      </div>

      <div className="animate-item mt-6" style={{ animationDelay: '320ms' }}>
        <CtaButton onClick={onContinue}>Continuar</CtaButton>
      </div>
    </div>
  )
}
