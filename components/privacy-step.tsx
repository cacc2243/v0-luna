'use client'

import { ShieldCheck, EyeOff, Lock, FileLock2 } from 'lucide-react'
import { CtaButton } from '@/components/cta-button'

type PrivacyItem = {
  icon: typeof ShieldCheck
  title: string
  description: string
  badge?: string
}

const items: PrivacyItem[] = [
  {
    icon: ShieldCheck,
    title: 'Sua identidade nunca aparece',
    description: 'Anonimato é a regra. Sempre foi.',
    badge: 'Proteção ativa',
  },
  {
    icon: EyeOff,
    title: 'Ninguém sabe quem você é',
    description:
      'Seus dados pessoais ficam protegidos. Nem família, nem amigos, nem colegas conseguem te identificar.',
  },
  {
    icon: Lock,
    title: 'Pagamentos via PIX privado',
    description:
      'Seus recebimentos chegam direto na sua conta. Sem nome de empresa exposto, sem rastros para terceiros.',
  },
]

export function PrivacyStep({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="flex flex-col">
      <section
        className="animate-item mt-7 text-center"
        style={{ animationDelay: '60ms' }}
      >
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
          Privacidade total
        </p>
        <h1 className="mt-2 flex items-center justify-center gap-2 text-balance font-sans text-[1.7rem] font-bold leading-tight tracking-tight text-foreground">
          Pode ficar <span className="text-primary">100% tranquila</span>
          <Lock className="size-5 text-primary" aria-hidden="true" />
        </h1>
        <p className="mt-2.5 text-pretty text-sm leading-relaxed text-muted-foreground">
          Aqui no Luna sua identidade é{' '}
          <span className="font-semibold text-foreground">100% reservada</span>. Você
          decide o que mostrar — e a gente protege o resto.
        </p>
      </section>

      <section
        className="animate-item mt-6 flex flex-col gap-3"
        style={{ animationDelay: '160ms' }}
        aria-label="Garantias de privacidade"
      >
        {items.map((item) => {
          const Icon = item.icon
          return (
            <div
              key={item.title}
              className="luna-border flex items-start gap-3.5 rounded-2xl bg-card p-4"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/15">
                <Icon className="size-5 text-primary" aria-hidden="true" />
              </span>
              <div className="flex-1">
                {item.badge && (
                  <span className="flex items-center gap-1.5 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-primary">
                    <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
                    {item.badge}
                  </span>
                )}
                <h2
                  className={`text-pretty text-[0.95rem] font-bold leading-snug text-foreground ${
                    item.badge ? 'mt-1' : ''
                  }`}
                >
                  {item.title}
                </h2>
                <p className="mt-1 text-pretty text-xs leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </div>
          )
        })}
      </section>

      <div
        className="animate-item mt-4 flex items-start gap-2.5 rounded-2xl border border-primary/25 bg-primary/5 px-4 py-3"
        style={{ animationDelay: '240ms' }}
      >
        <FileLock2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
        <p className="text-pretty text-xs leading-relaxed text-muted-foreground">
          Plataforma em conformidade com a{' '}
          <span className="font-semibold text-foreground">LGPD</span> · seus dados
          nunca são vendidos ou compartilhados.
        </p>
      </div>

      <div className="animate-item mt-7" style={{ animationDelay: '320ms' }}>
        <CtaButton onClick={onContinue}>Entendi, quero continuar</CtaButton>
      </div>
    </div>
  )
}
